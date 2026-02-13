import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { chatRequestSchema } from '../../../lib/schemas';
import { SYSTEM_PROMPT } from '../../../lib/prompt';
import { isCrisis } from '../../../lib/safety';
import { openai } from '../../../lib/openai';
import type { ClassifiedResponse } from '../../../lib/types';

export const runtime = 'nodejs';

// TODO: Implement proper rate limiting (e.g., Redis or database-backed tokens) before broader launch.

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parseResult = chatRequestSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { messages } = parseResult.data;
    const latestUserMessage = [...messages].reverse().find((m) => m.role === 'user');

    if (!latestUserMessage) {
      return NextResponse.json({ error: 'Missing user message' }, { status: 400 });
    }

    const crisis = isCrisis(latestUserMessage.content);

    if (crisis) {
      const crisisPayload: ClassifiedResponse = {
        bucket: 'OUT_OF_SCOPE',
        crisis: true,
        response:
          [
            'I’m hearing a level of distress that sounds like a real crisis.',
            'I’m not able to help with emergencies or keep you safe here.',
            'If you are in immediate danger or considering harming yourself, please contact your local emergency services or a trusted person near you right now.',
            'If available in your country, you can also reach out to a crisis hotline or mental health professional.',
            'You do not have to navigate this alone — please reach out to real-world support.',
            'You can write one simple sentence about who you will contact or what safe step you will take next.'
          ].join('\n\n')
      };

      return NextResponse.json(crisisPayload, { status: 200 });
    }

    const openaiMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...messages.map((m) => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content }))
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      temperature: 0.35,
      max_tokens: 700,
      messages: openaiMessages,
      response_format: { type: 'json_object' }
    });

    const raw = completion.choices[0]?.message?.content ?? '';

    const parsed = z
      .object({
        bucket: z.enum(['URGE_LOOP', 'OVERWHELM', 'SELF_DOUBT', 'OUT_OF_SCOPE']),
        crisis: z.boolean(),
        response: z.string().min(1)
      })
      .safeParse(JSON.parse(raw));

    if (!parsed.success) {
      // Fallback: keep things safe and minimal if the model misbehaves.
      const fallback: ClassifiedResponse = {
        bucket: 'OUT_OF_SCOPE',
        crisis: false,
        response:
          'Something went wrong on my side while trying to respond.\n\nTake 60–90 seconds to just notice your breathing and the physical sensations in your body.\n\nIf you want, you can send a shorter version of what you are facing, in one or two sentences.'
      };
      return NextResponse.json(fallback, { status: 200 });
    }

    const payload: ClassifiedResponse = {
      bucket: parsed.data.bucket,
      crisis: parsed.data.crisis,
      response: parsed.data.response
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
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

