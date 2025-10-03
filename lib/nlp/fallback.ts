import type { SummaryResponse } from './parser';

// Keyword-based sentiment detection
const SENTIMENT_KEYWORDS = {
  frustrated: ['frustrated', 'annoying', 'unacceptable', 'disappointing', 'unhappy', 'upset'],
  angry: ['angry', 'furious', 'outrageous', 'terrible', 'horrible', 'worst'],
  satisfied: ['happy', 'great', 'excellent', 'perfect', 'satisfied', 'thank you', 'thanks'],
};

function inferSentiment(messages: Array<{ body: string; sender: string }>): string {
  const customerMessages = messages
    .filter(m => m.sender === 'customer')
    .map(m => m.body.toLowerCase())
    .join(' ');

  let maxScore = 0;
  let detectedSentiment = 'neutral';

  for (const [sentiment, keywords] of Object.entries(SENTIMENT_KEYWORDS)) {
    const score = keywords.filter(keyword => customerMessages.includes(keyword)).length;
    if (score > maxScore) {
      maxScore = score;
      detectedSentiment = sentiment;
    }
  }

  return detectedSentiment;
}

export function generateRuleBasedSummary(threadData: {
  order_id: string;
  product: string;
  topic: string;
  messages: Array<{
    sender: string;
    body: string;
  }>;
}): SummaryResponse {
  const sentiment = inferSentiment(threadData.messages);
  const messageCount = threadData.messages.length;
  const hasResolution = threadData.messages.some(m => 
    m.sender === 'company' && 
    (m.body.toLowerCase().includes('replacement') || 
     m.body.toLowerCase().includes('refund') ||
     m.body.toLowerCase().includes('sorry'))
  );

  const currentStatus = hasResolution ? 'pending' : 'unresolved';

  return {
    summary: `Customer contacted regarding ${threadData.topic} for order ${threadData.order_id} (${threadData.product}). Thread contains ${messageCount} messages.`,
    keyIssue: threadData.topic,
    sentiment: sentiment as any,
    currentStatus,
    recommendedAction: hasResolution
      ? 'Follow up with customer to ensure issue is resolved'
      : 'Review thread and provide resolution to customer',
    confidenceScore: 0.3, // Low confidence for rule-based
    additionalContext: 'Generated using rule-based fallback (NLP service unavailable)',
  };
}
