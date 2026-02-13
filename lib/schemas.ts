import { z } from 'zod';
import type { Bucket } from './types';

export const bucketEnum = z.enum(['URGE_LOOP', 'OVERWHELM', 'SELF_DOUBT', 'OUT_OF_SCOPE']) as z.ZodType<Bucket>;

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(4000)
});

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(20)
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

