import { z } from 'zod';

const NLP_CONFIG = {
  baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
  model: 'deepseek/deepseek-chat-v3.1:free',
  timeout: 30000,
};

const ConfidenceAssessmentSchema = z.object({
  score: z.number().min(0).max(1),
  reasoning: z.string(),
  issues: z.array(z.string()),
  strengths: z.array(z.string()),
  criteriaScores: z.object({
    accuracy: z.number().min(0).max(1),
    completeness: z.number().min(0).max(1),
    clarity: z.number().min(0).max(1),
    sentimentMatch: z.number().min(0).max(1),
    actionRelevance: z.number().min(0).max(1),
  }),
});

export type ConfidenceAssessment = z.infer<typeof ConfidenceAssessmentSchema>;

const CONFIDENCE_SYSTEM_PROMPT = `You are a quality assessment expert for customer service email summaries. Your job is to evaluate how well an AI-generated summary captures the essence of a customer service email thread.

Evaluate summaries on these 5 criteria:
1. ACCURACY: Does the summary correctly represent what happened in the thread?
2. COMPLETENESS: Are all important details and context captured?
3. CLARITY: Is the summary clear, concise, and easy to understand?
4. SENTIMENT MATCH: Is the detected sentiment (frustrated/neutral/satisfied/angry) accurate?
5. ACTION RELEVANCE: Is the recommended action appropriate and actionable?

Always respond with valid JSON in this exact format:
{
  "score": 0.85,
  "reasoning": "Brief explanation of overall assessment",
  "issues": ["list of specific problems found"],
  "strengths": ["list of what the summary does well"],
  "criteriaScores": {
    "accuracy": 0.9,
    "completeness": 0.8,
    "clarity": 0.85,
    "sentimentMatch": 0.9,
    "actionRelevance": 0.8
  }
}

The overall score should be the weighted average of criteria scores.`;

function buildConfidencePrompt(threadData: any, generatedSummary: any): string {
  return `ORIGINAL EMAIL THREAD:
Order ID: ${threadData.order_id}
Product: ${threadData.product}
Topic: ${threadData.topic}
Initiated by: ${threadData.initiated_by}

Messages (chronological):
${threadData.messages.map((m: any, i: number) => 
  `${i + 1}. [${m.sender.toUpperCase()}] (${m.timestamp}): ${m.body}`
).join('\n')}

AI-GENERATED SUMMARY TO EVALUATE:
Summary: "${generatedSummary.summary}"
Key Issue: "${generatedSummary.keyIssue}"
Sentiment: "${generatedSummary.sentiment}"
Current Status: "${generatedSummary.currentStatus}"
Recommended Action: "${generatedSummary.recommendedAction}"

Please assess this summary's quality and provide your evaluation in JSON format.`;
}

export async function assessSummaryConfidence(
  threadData: any,
  generatedSummary: any
): Promise<ConfidenceAssessment> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.warn('OpenRouter API key not found, using rule-based confidence assessment');
    return calculateRuleBasedConfidence(generatedSummary);
  }

  try {
    const userPrompt = buildConfidencePrompt(threadData, generatedSummary);
    const response = await callOpenRouterForConfidence(userPrompt, apiKey);
    return response;
  } catch (error: any) {
    console.error('LLM confidence assessment failed:', error.message);
    return calculateRuleBasedConfidence(generatedSummary);
  }
}

async function callOpenRouterForConfidence(
  userPrompt: string,
  apiKey: string
): Promise<ConfidenceAssessment> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), NLP_CONFIG.timeout);

  try {
    const response = await fetch(NLP_CONFIG.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'CE Summarization System - Confidence Checker',
      },
      body: JSON.stringify({
        model: NLP_CONFIG.model,
        messages: [
          { role: 'system', content: CONFIDENCE_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1, // Low temperature for consistent evaluation
        max_tokens: 800,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in OpenRouter response');
    }

    // Parse and validate the JSON response
    const parsed = parseConfidenceResponse(content);
    return ConfidenceAssessmentSchema.parse(parsed);
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Confidence assessment timeout');
    }
    
    throw error;
  }
}

function parseConfidenceResponse(content: string): any {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // If no JSON found, try parsing the whole content
    return JSON.parse(content);
  } catch {
    console.error('Failed to parse confidence response:', content);
    throw new Error('Invalid JSON response from confidence checker');
  }
}

function calculateRuleBasedConfidence(summary: any): ConfidenceAssessment {
  const scores = {
    accuracy: 0.6, // Can't really assess accuracy without LLM
    completeness: 0.6,
    clarity: 0.6,
    sentimentMatch: 0.6,
    actionRelevance: 0.6,
  };
  
  const issues: string[] = [];
  const strengths: string[] = [];

  // Check summary completeness
  if (!summary.summary || summary.summary.length < 20) {
    scores.completeness -= 0.3;
    scores.clarity -= 0.2;
    issues.push('Summary text is too short or missing');
  } else if (summary.summary.length > 100) {
    scores.completeness += 0.2;
    strengths.push('Detailed summary provided');
  }

  // Check key issue identification
  if (!summary.keyIssue || summary.keyIssue === 'Unknown' || summary.keyIssue.length < 10) {
    scores.completeness -= 0.2;
    scores.accuracy -= 0.2;
    issues.push('Key issue not properly identified');
  } else {
    strengths.push('Key issue clearly identified');
  }

  // Check recommended action
  if (!summary.recommendedAction || summary.recommendedAction.length < 15) {
    scores.actionRelevance -= 0.3;
    issues.push('Recommended action is too vague or missing');
  } else if (summary.recommendedAction.includes('contact') || summary.recommendedAction.includes('follow up')) {
    scores.actionRelevance += 0.1;
    strengths.push('Actionable recommendation provided');
  }

  // Check sentiment validity
  const validSentiments = ['frustrated', 'neutral', 'satisfied', 'angry'];
  if (!validSentiments.includes(summary.sentiment)) {
    scores.sentimentMatch -= 0.3;
    issues.push('Invalid or missing sentiment classification');
  } else {
    strengths.push('Valid sentiment classification');
  }

  // Calculate overall score (weighted average)
  const overallScore = (
    scores.accuracy * 0.25 +
    scores.completeness * 0.25 +
    scores.clarity * 0.15 +
    scores.sentimentMatch * 0.15 +
    scores.actionRelevance * 0.20
  );

  return {
    score: Math.max(0.1, Math.min(1.0, overallScore)),
    reasoning: 'Rule-based confidence assessment (LLM validation unavailable)',
    issues,
    strengths,
    criteriaScores: scores,
  };
}