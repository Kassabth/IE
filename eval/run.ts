/**
 * Evaluation harness for AI Mirror.
 *
 * Run with:
 *   npx ts-node --project tsconfig.json eval/run.ts
 *
 * Or with a local dev server running on port 3000:
 *   BASE_URL=http://localhost:3000 npx ts-node --project tsconfig.json eval/run.ts
 *
 * Scores each response across four dimensions:
 *   specificity  — does the response use the user's exact words / situation?
 *   resonance    — does it address the deeper layer, not just the surface?
 *   repetition   — does it avoid generic / repeated phrases?
 *   depthFit     — does the inferred depth match the expected depth?
 */

import { fixtures } from './fixtures';
import type { EvalFixture } from './fixtures';
import type { Bucket, DepthLevel } from '../lib/types';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

// ─── Scoring helpers ────────────────────────────────────────────────────────

const GENERIC_PHRASES = [
  'what belief is underlying',
  'what does this say about you',
  'what are you really feeling',
  'what do you think is driving',
  'what does this mean to you',
  "what's the deeper need",
  'i understand how you feel',
  'that must be really hard',
  'it sounds like you',
  'have you considered',
  'you should try',
  'many people feel this way'
];

/**
 * Specificity: does the response quote or closely mirror the user's words?
 * Score 0–2.
 */
function scoreSpecificity(prompt: string, response: string): number {
  const userWords = prompt
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .split(' ')
    .filter((w) => w.length > 4);

  const responseLower = response.toLowerCase();
  const matches = userWords.filter((w) => responseLower.includes(w));
  const ratio = matches.length / Math.max(userWords.length, 1);

  if (ratio >= 0.35) return 2;
  if (ratio >= 0.15) return 1;
  return 0;
}

/**
 * Resonance: does the response go beyond the surface statement?
 * Looks for language that names a deeper layer.
 * Score 0–2.
 */
function scoreResonance(response: string): number {
  const resonanceSignals = [
    /pattern/i,
    /beneath|underneath|deeper/i,
    /seeking|looking for|trying to/i,
    /tension|conflict/i,
    /identity|who you are|who you want/i,
    /rule you('re| are) operating/i,
    /belief|assumption/i,
    /protect(ing|ion)/i,
    /avoid(ing|ance)/i,
    /fear (of|that)/i
  ];

  const hits = resonanceSignals.filter((r) => r.test(response)).length;
  if (hits >= 3) return 2;
  if (hits >= 1) return 1;
  return 0;
}

/**
 * Repetition: penalises generic phrases.
 * Score 0–2 (2 = clean, 0 = multiple generic phrases).
 */
function scoreRepetition(response: string): number {
  const responseLower = response.toLowerCase();
  const hits = GENERIC_PHRASES.filter((p) => responseLower.includes(p)).length;
  if (hits === 0) return 2;
  if (hits === 1) return 1;
  return 0;
}

/**
 * Depth fit: does the returned depth match the expected depth?
 * Score 0–2 (2 = exact match, 1 = adjacent, 0 = opposite).
 */
function scoreDepthFit(expected: DepthLevel, actual: DepthLevel): number {
  if (expected === actual) return 2;
  const order: DepthLevel[] = ['REACTIVE', 'REFLECTIVE', 'META'];
  const dist = Math.abs(order.indexOf(expected) - order.indexOf(actual));
  return dist === 1 ? 1 : 0;
}

// ─── API call ───────────────────────────────────────────────────────────────

interface ApiResponse {
  bucket: Bucket;
  crisis: boolean;
  depth: DepthLevel;
  response: string;
  newInternalState: string;
  error?: string;
}

async function callApi(prompt: string): Promise<ApiResponse> {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      internalState: ''
    })
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  return res.json() as Promise<ApiResponse>;
}

// ─── Result types ────────────────────────────────────────────────────────────

interface EvalResult {
  id: string;
  prompt: string;
  expectedBucket: Bucket;
  actualBucket: Bucket;
  bucketMatch: boolean;
  expectedDepth: DepthLevel;
  actualDepth: DepthLevel;
  scores: {
    specificity: number;
    resonance: number;
    repetition: number;
    depthFit: number;
    total: number;
  };
  response: string;
  scoringNotes: string;
  error?: string;
}

// ─── Runner ──────────────────────────────────────────────────────────────────

async function runEval(fixture: EvalFixture): Promise<EvalResult> {
  try {
    const data = await callApi(fixture.prompt);

    const specificity = scoreSpecificity(fixture.prompt, data.response);
    const resonance = scoreResonance(data.response);
    const repetition = scoreRepetition(data.response);
    const depthFit = scoreDepthFit(fixture.expectedDepth, data.depth);
    const total = specificity + resonance + repetition + depthFit;

    return {
      id: fixture.id,
      prompt: fixture.prompt,
      expectedBucket: fixture.expectedBucket,
      actualBucket: data.bucket,
      bucketMatch: data.bucket === fixture.expectedBucket,
      expectedDepth: fixture.expectedDepth,
      actualDepth: data.depth,
      scores: { specificity, resonance, repetition, depthFit, total },
      response: data.response,
      scoringNotes: fixture.scoringNotes
    };
  } catch (err) {
    return {
      id: fixture.id,
      prompt: fixture.prompt,
      expectedBucket: fixture.expectedBucket,
      actualBucket: 'OUT_OF_SCOPE',
      bucketMatch: false,
      expectedDepth: fixture.expectedDepth,
      actualDepth: 'REFLECTIVE',
      scores: { specificity: 0, resonance: 0, repetition: 0, depthFit: 0, total: 0 },
      response: '',
      scoringNotes: fixture.scoringNotes,
      error: String(err)
    };
  }
}

function printResult(r: EvalResult) {
  const bucketIcon = r.bucketMatch ? '✓' : '✗';
  const scoreBar = '█'.repeat(r.scores.total) + '░'.repeat(8 - r.scores.total);

  console.log(`\n─── ${r.id} ───────────────────────────────────────`);
  console.log(`Prompt:   ${r.prompt}`);
  console.log(`Bucket:   ${bucketIcon} expected=${r.expectedBucket} actual=${r.actualBucket}`);
  console.log(`Depth:    expected=${r.expectedDepth} actual=${r.actualDepth}`);
  console.log(`Score:    [${scoreBar}] ${r.scores.total}/8`);
  console.log(`          specificity=${r.scores.specificity}/2  resonance=${r.scores.resonance}/2  repetition=${r.scores.repetition}/2  depthFit=${r.scores.depthFit}/2`);
  console.log(`Notes:    ${r.scoringNotes}`);
  if (r.error) {
    console.log(`ERROR:    ${r.error}`);
  } else {
    console.log(`Response: ${r.response.slice(0, 200)}${r.response.length > 200 ? '…' : ''}`);
  }
}

function printSummary(results: EvalResult[]) {
  const total = results.length;
  const bucketMatches = results.filter((r) => r.bucketMatch).length;
  const depthMatches = results.filter((r) => r.actualDepth === r.expectedDepth).length;
  const errors = results.filter((r) => r.error).length;

  const avgScore =
    results.reduce((sum, r) => sum + r.scores.total, 0) / total;
  const avgSpecificity =
    results.reduce((sum, r) => sum + r.scores.specificity, 0) / total;
  const avgResonance =
    results.reduce((sum, r) => sum + r.scores.resonance, 0) / total;
  const avgRepetition =
    results.reduce((sum, r) => sum + r.scores.repetition, 0) / total;
  const avgDepthFit =
    results.reduce((sum, r) => sum + r.scores.depthFit, 0) / total;

  // Worst performers
  const worst = [...results]
    .filter((r) => !r.error)
    .sort((a, b) => a.scores.total - b.scores.total)
    .slice(0, 3);

  console.log('\n══════════════════════════════════════════════════');
  console.log('EVAL SUMMARY');
  console.log('══════════════════════════════════════════════════');
  console.log(`Fixtures run:     ${total}`);
  console.log(`Errors:           ${errors}`);
  console.log(`Bucket accuracy:  ${bucketMatches}/${total} (${Math.round((bucketMatches / total) * 100)}%)`);
  console.log(`Depth accuracy:   ${depthMatches}/${total} (${Math.round((depthMatches / total) * 100)}%)`);
  console.log(`Avg total score:  ${avgScore.toFixed(2)}/8`);
  console.log(`  specificity:    ${avgSpecificity.toFixed(2)}/2`);
  console.log(`  resonance:      ${avgResonance.toFixed(2)}/2`);
  console.log(`  repetition:     ${avgRepetition.toFixed(2)}/2`);
  console.log(`  depth fit:      ${avgDepthFit.toFixed(2)}/2`);

  if (worst.length > 0) {
    console.log('\nLowest scoring fixtures:');
    worst.forEach((r) => {
      console.log(`  ${r.id} — score ${r.scores.total}/8 — ${r.prompt.slice(0, 60)}`);
    });
  }
  console.log('══════════════════════════════════════════════════\n');
}

async function main() {
  console.log(`\nAI Mirror Eval — ${new Date().toISOString()}`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Fixtures: ${fixtures.length}`);

  const results: EvalResult[] = [];

  for (const fixture of fixtures) {
    process.stdout.write(`Running ${fixture.id}…`);
    const result = await runEval(fixture);
    results.push(result);
    process.stdout.write(` score=${result.scores.total}/8\n`);

    // Small delay to avoid rate-limiting
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  results.forEach(printResult);
  printSummary(results);
}

main().catch((err) => {
  console.error('Eval failed:', err);
  process.exit(1);
});
