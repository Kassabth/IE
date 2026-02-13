import type { Bucket } from './types';

const CRISIS_KEYWORDS = [
  'suicide',
  'suicidal',
  'kill myself',
  'kill myself',
  'end my life',
  'no reason to live',
  'want to die',
  'hurt myself',
  'self harm',
  'self-harm',
  'overdose',
  'can’t go on',
  "can't go on"
];

export function isCrisis(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}

export function bucketLabel(bucket: Bucket): string {
  switch (bucket) {
    case 'URGE_LOOP':
      return 'Urge loop';
    case 'OVERWHELM':
      return 'Mental overwhelm';
    case 'SELF_DOUBT':
      return 'Self-doubt';
    default:
      return 'Out of scope';
  }
}

