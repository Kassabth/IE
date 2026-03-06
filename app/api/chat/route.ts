import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { chatRequestSchema, depthEnum } from '../../../lib/schemas';
import { SYSTEM_PROMPT } from '../../../lib/prompt';
import { isCrisis } from '../../../lib/safety';
import { openai } from '../../../lib/openai';
import type { ChatMessage, ClassifiedResponse } from '../../../lib/types';

export const runtime = 'nodejs';

// TODO: Implement proper rate limiting (e.g., Redis or database-backed tokens) before broader launch.

const BANNED_GENERIC_PATTERNS = [
  /what belief is underlying/i,
  /what does this say about you/i,
  /what are you really feeling/i,
  /what do you think is driving this/i,
  /what does this mean to you/i,
  /what'?s the deeper need/i,
  /what need (is|are) (this|you)/i,
  /what (core )?belief/i
];

/**
 * Returns true if the response text contains generic CBT-style questions
 * that the system prompt explicitly bans.
 */
function containsGenericQuestion(text: string): boolean {
  return BANNED_GENERIC_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Asks the model to rewrite a response that slipped through with generic questions,
 * anchoring any question to the user's exact words.
 */
async function rewriteGenericResponse(
  originalResponse: string,
  userMessage: string
): Promise<string> {
  const rewriteCompletion = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    temperature: 0.4,
    max_tokens: 400,
    messages: [
      {
        role: 'system',
        content:
          'You are an editor. Rewrite the assistant response below to remove any generic therapy-style questions. ' +
          'If a question is needed, make it specific to the user\'s exact words. ' +
          'Propose 2–3 short candidate interpretations drawn from what the user actually said, e.g. "Is it more (1) X, (2) Y, or (3) Z?" ' +
          'Do NOT use generic questions like "What belief is underlying this?" or "What are you really feeling?". ' +
          'Return only the rewritten response text, no JSON.'
      },
      {
        role: 'user',
        content: `User said: "${userMessage}"\n\nOriginal response:\n${originalResponse}\n\nRewritten response:`
      }
    ]
  });

  return rewriteCompletion.choices[0]?.message?.content?.trim() ?? originalResponse;
}

/**
 * Builds a short, session-only snapshot from recent user messages so the model
 * can notice immediate themes and tension patterns.
 */
function buildSessionSnapshot(messages: { role: string; content: string }[]) {
  const lastUserMessages = messages
    .filter((m) => m.role === 'user')
    .slice(-4); // only last 4 user messages

  const combined = lastUserMessages.map((m) => m.content).join(' ');

  return `
Latest turn snapshot (session-only, not shown to the user):
- Recurrent themes in the last few messages: ${combined.slice(0, 300)}
  `.trim();
}

export async function POST(req: NextRequest) {
  try {
    // --- 1) Parse and validate request body ---
    const json = await req.json();
    const parseResult = chatRequestSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { messages, internalState } = parseResult.data;

    // --- 2) Ensure we have at least one user message ---
    const latestUserMessage = [...messages].reverse().find((m) => m.role === 'user');

    if (!latestUserMessage) {
      return NextResponse.json({ error: 'Missing user message' }, { status: 400 });
    }

    // --- 3) Crisis check: never send crisis content to the model ---
    const crisis = isCrisis(latestUserMessage.content);

    if (crisis) {
      const crisisPayload: ClassifiedResponse = {
        bucket: 'OUT_OF_SCOPE',
        crisis: true,
        depth: 'REACTIVE',
        response:
          [
            'I’m hearing a level of distress that sounds like a real crisis.',
            'I’m not able to help with emergencies or keep you safe here.',
            'If you are in immediate danger or considering harming yourself, please contact your local emergency services or a trusted person near you right now.',
            'If available in your country, you can also reach out to a crisis hotline or mental health professional.',
            'You do not have to navigate this alone — please reach out to real-world support.',
            'You can write one simple sentence about who you will contact or what safe step you will take next.'
          ].join('\n\n'),
        // In crisis paths we simply carry forward whatever internal state we had.
        newInternalState: internalState ?? ''
      };

      return NextResponse.json(crisisPayload, { status: 200 });
    }

    // --- 4) Build a short snapshot from recent user messages (session-only hint) ---
    const snapshot = buildSessionSnapshot(messages);

    // --- 5) Assemble messages for OpenAI: system prompt + existing internal state + snapshot + conversation ---
    const openaiMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...(internalState
        ? ([{ role: 'system' as const, content: `Existing internal state for this session:\n${internalState}` }] as const)
        : []),
      { role: 'system' as const, content: snapshot },
      ...messages.map((m: ChatMessage) => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content }))
    ];

    // --- 6) Call OpenAI with structured JSON output ---
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      temperature: 0.55,
      max_tokens: 700,
      messages: openaiMessages,
      response_format: { type: 'json_object' }
    });

    const raw = completion.choices[0]?.message?.content ?? '';

    // --- 7) Parse and validate model JSON; fallback to safe message on failure ---
    const parsed = z
      .object({
        bucket: z.enum(['URGE_LOOP', 'OVERWHELM', 'SELF_DOUBT', 'OUT_OF_SCOPE']),
        crisis: z.boolean(),
        depth: depthEnum,
        response: z.string().min(1),
        newInternalState: z.string().max(4000).optional().default(internalState ?? '')
      })
      .safeParse(JSON.parse(raw));

    if (!parsed.success) {
      // Fallback: keep things safe and minimal if the model misbehaves or returns invalid JSON.
      const fallback: ClassifiedResponse = {
        bucket: 'OUT_OF_SCOPE',
        crisis: false,
        depth: 'REFLECTIVE',
        response:
          'Something went wrong on my side while trying to respond.\n\nTake 60–90 seconds to just notice your breathing and the physical sensations in your body.\n\nIf you want, you can send a shorter version of what you are facing, in one or two sentences.',
        newInternalState: internalState ?? ''
      };
      return NextResponse.json(fallback, { status: 200 });
    }

    // --- 8) Post-process: rewrite if generic questions slipped through ---
    let finalResponse = parsed.data.response;
    if (containsGenericQuestion(finalResponse)) {
      finalResponse = await rewriteGenericResponse(finalResponse, latestUserMessage.content);
    }

    // --- 9) Return validated response to client ---
    const payload: ClassifiedResponse = {
      bucket: parsed.data.bucket,
      crisis: parsed.data.crisis,
      depth: parsed.data.depth,
      response: finalResponse,
      newInternalState: parsed.data.newInternalState
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    // --- 10) Log and return generic 500 on unexpected errors ---
    console.error('Chat route error', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Something went wrong. Try again in a moment.'
      },
      { status: 500 }
    );
  }
}

