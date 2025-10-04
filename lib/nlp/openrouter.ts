import { SYSTEM_PROMPT, buildUserPrompt } from './prompts';
import { parseSummaryResponse, calculateConfidenceScore, type SummaryResponse } from './parser';
import { generateRuleBasedSummary } from './fallback';

const NLP_CONFIG = {
  baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
  model: 'deepseek/deepseek-chat-v3.1:free', // Using a faster free model
  timeout: 60000,
  maxRetries: 3,
  retryDelay: 1000,
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function generateSummary(threadData: {
  order_id: string;
  product: string;
  topic: string;
  initiated_by: string;
  messages: Array<{
    sender: string;
    timestamp: string;
    body: string;
  }>;
}, crmContext?: {
  customerProfile: {
    name: string;
    email: string;
    tier: string;
    lifetimeValue: number;
    previousIssues: number;
  };
  orderHistory: Array<{
    product: string;
    status: string;
    date: string;
    value: number;
  }>;
  relatedTickets: Array<{
    subject: string;
    status: string;
    priority: string;
  }>;
  suggestedResponses: string[];
}): Promise<SummaryResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.warn('OpenRouter API key not found, using rule-based fallback');
    return generateRuleBasedSummary(threadData);
  }

  return await generateSummaryWithRetry(threadData, apiKey, NLP_CONFIG.maxRetries, crmContext);
}

async function generateSummaryWithRetry(
  threadData: any,
  apiKey: string,
  maxRetries: number,
  crmContext?: any
): Promise<SummaryResponse> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await callOpenRouter(threadData, apiKey, crmContext);
      return response;
    } catch (error: any) {
      console.error(`Attempt ${attempt} failed:`, error.message);

      if (error.status === 429) {
        // Rate limited - wait and retry with exponential backoff
        await sleep(NLP_CONFIG.retryDelay * Math.pow(2, attempt));
      } else if (error.status >= 500) {
        // Server error - retry
        await sleep(NLP_CONFIG.retryDelay * attempt);
      } else {
        // Client error - don't retry
        break;
      }
    }
  }

  // Final fallback: rule-based summary
  console.warn('All NLP attempts failed, using rule-based fallback');
  return generateRuleBasedSummary(threadData);
}

async function callOpenRouter(threadData: any, apiKey: string, crmContext?: any): Promise<SummaryResponse> {
  const userPrompt = buildUserPrompt(threadData, crmContext);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), NLP_CONFIG.timeout);

  try {
    const response = await fetch(NLP_CONFIG.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'CE Summarization System',
      },
      body: JSON.stringify({
        model: NLP_CONFIG.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw {
        status: response.status,
        message: `OpenRouter API error: ${response.statusText}`,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in OpenRouter response');
    }

    const parsed = parseSummaryResponse(content);
    const adjustedScore = calculateConfidenceScore(parsed);

    return {
      ...parsed,
      confidenceScore: adjustedScore,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw { status: 408, message: 'Request timeout' };
    }
    
    throw error;
  }
}
