import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  // In production this should be set via Railway environment variables.
  // We throw here so misconfiguration is caught early.
  throw new Error('OPENAI_API_KEY is not set');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

