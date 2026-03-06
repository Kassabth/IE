import { z } from 'zod';
import type { Bucket, DepthLevel } from './types';

export const bucketEnum = z.enum(['URGE_LOOP', 'OVERWHELM', 'SELF_DOUBT', 'OUT_OF_SCOPE']) as z.ZodType<Bucket>;

export const depthEnum = z.enum(['REACTIVE', 'REFLECTIVE', 'META']) as z.ZodType<DepthLevel>;

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(4000)
});

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(20),
  /**
   * Opaque session-level internal state that the model can update on each turn.
   * This is never shown directly to the user.
   */
  internalState: z.string().max(4000).optional().default('')
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

