import { z } from 'zod';

// Schema for NLP response
export const SummaryResponseSchema = z.object({
  summary: z.string(),
  keyIssue: z.string(),
  sentiment: z.enum(['frustrated', 'neutral', 'satisfied', 'angry']),
  currentStatus: z.enum(['unresolved', 'pending', 'resolved']),
  recommendedAction: z.string(),
  confidenceScore: z.number().min(0).max(1),
  additionalContext: z.string().optional(),
});

export type SummaryResponse = z.infer<typeof SummaryResponseSchema>;

export function parseSummaryResponse(response: string): SummaryResponse {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return SummaryResponseSchema.parse(parsed);
  } catch (error) {
    console.error('Failed to parse NLP response:', error);
    throw new Error('Invalid NLP response format');
  }
}

export function calculateConfidenceScore(response: SummaryResponse): number {
  // Adjust confidence based on response completeness
  let score = response.confidenceScore || 0.5;

  if (!response.summary || response.summary.length < 20) {
    score *= 0.7;
  }

  if (!response.keyIssue || response.keyIssue.length < 10) {
    score *= 0.8;
  }

  if (!response.recommendedAction || response.recommendedAction.length < 10) {
    score *= 0.9;
  }

  return Math.min(Math.max(score, 0), 1);
}
