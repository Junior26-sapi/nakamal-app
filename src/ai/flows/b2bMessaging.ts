import { ai, z } from '../genkit.js';

// Schemas for B2B Messaging
export const SupplierProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  supplierId: z.string(),
  barId: z.string().nullable().optional(),
  description: z.string().optional(),
  unit: z.string().optional(),
  stockLevel: z.number().optional(),
  imageUrl: z.string().optional(),
  status: z.enum(['In Stock', 'Out of Stock', 'Low Stock']).optional(),
});

export const B2BMessageSchema = z.object({
  chatId: z.string().optional(),
  fromId: z.string(),
  toId: z.string(),
  text: z.string(),
  type: z.enum(['text', 'order_request', 'delivery_alert']).default('text'),
  timestamp: z.number().default(() => Date.now()),
  attachments: z.array(z.object({
    type: z.enum(['product_info', 'purchase_order', 'delivery_note']),
    refId: z.string(),
    quantity: z.number().optional(),
    details: z.any().optional(),
  })).optional(),
});

// Genkit Flow for B2B Messaging
export const b2bMessagingFlow = ai.defineFlow({
  name: 'b2bMessagingFlow',
  inputSchema: B2BMessageSchema,
  outputSchema: z.object({
    success: z.boolean(),
    messageId: z.string(),
    aiAnalysis: z.string(),
  }),
}, async (input) => {
  // In a real implementation, we would save to firestore/database here.
  
  // AI component: Analyze the message context to provide a summary or action items
  const analysis = await ai.generate({
    prompt: `
      Act as a B2B logistics coordinator. 
      Analyze the following message between a venue manager and a supplier:
      Message: "${input.text}"
      ${input.attachments ? `Attachments: ${JSON.stringify(input.attachments)}` : 'No attachments.'}
      
      Provide a concise 1-sentence summary of the business intent and any required follow-on action.
    `,
  });

  return {
    success: true,
    messageId: `b2b_${Math.random().toString(36).substr(2, 9)}`,
    aiAnalysis: analysis.text,
  };
});
