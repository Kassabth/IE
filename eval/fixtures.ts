import type { Bucket, DepthLevel } from '../lib/types';

export interface EvalFixture {
  id: string;
  prompt: string;
  expectedBucket: Bucket;
  expectedDepth: DepthLevel;
  // Short description of what a good response should do
  scoringNotes: string;
}

export const fixtures: EvalFixture[] = [
  // ─── URGE LOOP / REACTIVE ────────────────────────────────────────────────
  {
    id: 'ul-r-01',
    prompt: "I'm about to text her right now. I can't stop myself.",
    expectedBucket: 'URGE_LOOP',
    expectedDepth: 'REACTIVE',
    scoringNotes: 'Should slow urgency, name the pull, no abstraction, 0–1 question max.'
  },
  {
    id: 'ul-r-02',
    prompt: "I just opened Instagram again. I said I wouldn't.",
    expectedBucket: 'URGE_LOOP',
    expectedDepth: 'REACTIVE',
    scoringNotes: 'Should name the loop without shame, suggest a short pause.'
  },
  {
    id: 'ul-r-03',
    prompt: "I want to watch porn right now even though I'm trying to stop.",
    expectedBucket: 'URGE_LOOP',
    expectedDepth: 'REACTIVE',
    scoringNotes: 'Should separate feeling from action, ask what is being sought.'
  },
  {
    id: 'ul-r-04',
    prompt: "I keep refreshing my email every two minutes waiting for a reply.",
    expectedBucket: 'URGE_LOOP',
    expectedDepth: 'REACTIVE',
    scoringNotes: 'Should name the anxiety loop, suggest a 60–90s pause.'
  },
  {
    id: 'ul-r-05',
    prompt: "I'm reaching for my phone every time I sit down to work.",
    expectedBucket: 'URGE_LOOP',
    expectedDepth: 'REACTIVE',
    scoringNotes: 'Should name the avoidance pattern, short grounding step.'
  },

  // ─── URGE LOOP / REFLECTIVE ──────────────────────────────────────────────
  {
    id: 'ul-rf-01',
    prompt: "I notice I always want to text her when I feel lonely at night. It's a pattern.",
    expectedBucket: 'URGE_LOOP',
    expectedDepth: 'REFLECTIVE',
    scoringNotes: 'Should affirm the observation, ask a specific question with 2–3 candidate interpretations.'
  },
  {
    id: 'ul-rf-02',
    prompt: "Every time I finish a hard task I reward myself with scrolling and then I can't stop.",
    expectedBucket: 'URGE_LOOP',
    expectedDepth: 'REFLECTIVE',
    scoringNotes: 'Should name the reward loop, offer a reframe, one next step.'
  },
  {
    id: 'ul-rf-03',
    prompt: "I've been checking my phone less but I still feel the pull. I'm not sure what I'm looking for.",
    expectedBucket: 'URGE_LOOP',
    expectedDepth: 'REFLECTIVE',
    scoringNotes: 'Should propose 2–3 specific candidate interpretations for what they are seeking.'
  },

  // ─── URGE LOOP / META ────────────────────────────────────────────────────
  {
    id: 'ul-m-01',
    prompt: "I wonder if my urge to check my phone is really about not trusting myself to be productive.",
    expectedBucket: 'URGE_LOOP',
    expectedDepth: 'META',
    scoringNotes: 'Should reflect the identity rule, gently challenge it, no moralising.'
  },
  {
    id: 'ul-m-02',
    prompt: "I think I use texting her as proof that I still matter to someone.",
    expectedBucket: 'URGE_LOOP',
    expectedDepth: 'META',
    scoringNotes: 'Should name the validation-seeking belief, philosophical mirror tone.'
  },

  // ─── OVERWHELM / REACTIVE ────────────────────────────────────────────────
  {
    id: 'ow-r-01',
    prompt: "I have so much to do I can't even start. I'm just sitting here.",
    expectedBucket: 'OVERWHELM',
    expectedDepth: 'REACTIVE',
    scoringNotes: 'Should normalise freeze, ask for the single smallest next action.'
  },
  {
    id: 'ow-r-02',
    prompt: "Everything is urgent and I don't know where to begin.",
    expectedBucket: 'OVERWHELM',
    expectedDepth: 'REACTIVE',
    scoringNotes: 'Should reduce urgency, suggest one micro action, no list of advice.'
  },
  {
    id: 'ow-r-03',
    prompt: "I'm completely frozen. I've been staring at my screen for an hour.",
    expectedBucket: 'OVERWHELM',
    expectedDepth: 'REACTIVE',
    scoringNotes: 'Should name freeze as normal, one concrete 2-minute step.'
  },
  {
    id: 'ow-r-04',
    prompt: "My inbox has 200 unread emails and I feel paralysed.",
    expectedBucket: 'OVERWHELM',
    expectedDepth: 'REACTIVE',
    scoringNotes: 'Should not give productivity advice; should ask what one thing matters most right now.'
  },

  // ─── OVERWHELM / REFLECTIVE ──────────────────────────────────────────────
  {
    id: 'ow-rf-01',
    prompt: "I keep getting overwhelmed every Sunday night. It's becoming a weekly thing.",
    expectedBucket: 'OVERWHELM',
    expectedDepth: 'REFLECTIVE',
    scoringNotes: 'Should name the pattern, ask a specific question about what Sunday nights trigger.'
  },
  {
    id: 'ow-rf-02',
    prompt: "I notice I take on too much and then collapse. I do it every time.",
    expectedBucket: 'OVERWHELM',
    expectedDepth: 'REFLECTIVE',
    scoringNotes: 'Should reflect the cycle, propose 2–3 candidate interpretations for why they keep taking on too much.'
  },

  // ─── OVERWHELM / META ────────────────────────────────────────────────────
  {
    id: 'ow-m-01',
    prompt: "I think I stay overwhelmed because if I'm busy I don't have to face what I actually want.",
    expectedBucket: 'OVERWHELM',
    expectedDepth: 'META',
    scoringNotes: 'Should reflect the avoidance belief, gentle identity-level challenge.'
  },
  {
    id: 'ow-m-02',
    prompt: "I wonder if my overwhelm is actually about fear that if I slow down I'll realise I'm not enough.",
    expectedBucket: 'OVERWHELM',
    expectedDepth: 'META',
    scoringNotes: 'Should engage the identity layer, not give productivity tips.'
  },

  // ─── SELF-DOUBT / REACTIVE ───────────────────────────────────────────────
  {
    id: 'sd-r-01',
    prompt: "I feel like I'm not good enough for this job.",
    expectedBucket: 'SELF_DOUBT',
    expectedDepth: 'REACTIVE',
    scoringNotes: 'Should reflect insecurity without judgment, ask what triggered it specifically.'
  },
  {
    id: 'sd-r-02',
    prompt: "I just sent a message in a meeting and now I think it was stupid.",
    expectedBucket: 'SELF_DOUBT',
    expectedDepth: 'REACTIVE',
    scoringNotes: 'Should name the spiral, suggest a stabilising action, no reassurance.'
  },
  {
    id: 'sd-r-03',
    prompt: "Everyone else seems to know what they're doing and I have no idea.",
    expectedBucket: 'SELF_DOUBT',
    expectedDepth: 'REACTIVE',
    scoringNotes: 'Should name comparison trap specifically, one grounding step.'
  },
  {
    id: 'sd-r-04',
    prompt: "I feel insecure about how I come across to people.",
    expectedBucket: 'SELF_DOUBT',
    expectedDepth: 'REACTIVE',
    scoringNotes: 'Should ask what specifically triggered it today, not generically.'
  },

  // ─── SELF-DOUBT / REFLECTIVE ─────────────────────────────────────────────
  {
    id: 'sd-rf-01',
    prompt: "I notice I always feel like a fraud when I'm about to present something I worked hard on.",
    expectedBucket: 'SELF_DOUBT',
    expectedDepth: 'REFLECTIVE',
    scoringNotes: 'Should name the pattern, offer 2–3 candidate interpretations for the fraud feeling.'
  },
  {
    id: 'sd-rf-02',
    prompt: "I keep second-guessing decisions after I make them. It's exhausting.",
    expectedBucket: 'SELF_DOUBT',
    expectedDepth: 'REFLECTIVE',
    scoringNotes: 'Should name the retroactive doubt loop, ask a specific question about what they fear was wrong.'
  },

  // ─── SELF-DOUBT / META ───────────────────────────────────────────────────
  {
    id: 'sd-m-01',
    prompt: "I think I'm afraid that if people really knew me they'd see I'm not as capable as I seem.",
    expectedBucket: 'SELF_DOUBT',
    expectedDepth: 'META',
    scoringNotes: 'Should reflect the identity rule, gentle philosophical mirror, no reassurance.'
  },
  {
    id: 'sd-m-02',
    prompt: "I wonder if my self-doubt is actually a way of keeping myself safe from trying and failing.",
    expectedBucket: 'SELF_DOUBT',
    expectedDepth: 'META',
    scoringNotes: 'Should engage the protective function of doubt, challenge gently.'
  },
  {
    id: 'sd-m-03',
    prompt: "I use discipline as a way to avoid feeling anything. I wonder if that's repression.",
    expectedBucket: 'SELF_DOUBT',
    expectedDepth: 'META',
    scoringNotes: 'Should differentiate repression from discipline, identity-layer reflection.'
  },

  // ─── OUT OF SCOPE ─────────────────────────────────────────────────────────
  {
    id: 'oos-01',
    prompt: "Can you help me write a cover letter for a job application?",
    expectedBucket: 'OUT_OF_SCOPE',
    expectedDepth: 'REFLECTIVE',
    scoringNotes: 'Should gently redirect, ask which of the three buckets is closest if any.'
  },
  {
    id: 'oos-02',
    prompt: "What's the best diet for losing weight?",
    expectedBucket: 'OUT_OF_SCOPE',
    expectedDepth: 'REFLECTIVE',
    scoringNotes: 'Should redirect without judgment, suggest a grounding pause if no bucket fits.'
  }
];
