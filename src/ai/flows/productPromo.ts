import { ai, z } from '../genkit.js';

// Schemas for Product Promotions
export const PromoInputSchema = z.object({
  products: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    price: z.number().optional(),
  })),
});

export const PromoOutputSchema = z.object({
  promotions: z.array(z.object({
    productId: z.string(),
    promoDescription: z.string(),
  })),
});

// Genkit Flow for generating promotional descriptions for a list of products
export const productPromoFlow = ai.defineFlow({
  name: 'productPromoFlow',
  inputSchema: PromoInputSchema,
  outputSchema: PromoOutputSchema,
}, async (input) => {
  const productsString = JSON.stringify(input.products, null, 2);

  const response = await ai.generate({
    prompt: `
      You are a premium B2B marketing copies generator for Vanuatu Nakamal kava establishments & suppliers.
      Given the following list of products:
      ${productsString}

      For each product, generate a highly engaging, brand-aligned, and exquisite promotional description.
      - Keep it short (1 to 2 punchy and inspiring sentences).
      - Echo the luxurious, relaxing, and organic spirit of Nakamal cultural tradition and premium botanical beverages.
      - Return the structured response containing each product's ID paired with its promotional description.
    `,
    output: {
      schema: PromoOutputSchema,
    }
  });

  if (!response.output) {
    throw new Error('AI generating promotional descriptions returned empty output.');
  }

  return response.output;
});
