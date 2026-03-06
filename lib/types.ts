export type Bucket = 'URGE_LOOP' | 'OVERWHELM' | 'SELF_DOUBT' | 'OUT_OF_SCOPE';

export type DepthLevel = 'REACTIVE' | 'REFLECTIVE' | 'META';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ClassifiedResponse {
  bucket: Bucket;
  crisis: boolean;
  /**
   * Inferred depth of the user's current cognitive layer.
   */
  depth: DepthLevel;
  response: string;
  /**
   * Updated internal state summary produced by the model for this session.
   * The frontend stores this and sends it back with the next request.
   */
  newInternalState: string;
}

