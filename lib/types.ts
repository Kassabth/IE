export type Bucket = 'URGE_LOOP' | 'OVERWHELM' | 'SELF_DOUBT' | 'OUT_OF_SCOPE';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ClassifiedResponse {
  bucket: Bucket;
  crisis: boolean;
  response: string;
}

