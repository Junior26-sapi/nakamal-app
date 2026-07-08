import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  model: googleAI.model('gemini-3-flash-preview'), // Valid model from skill
});

export { z };
