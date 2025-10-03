export const SYSTEM_PROMPT = `You are an expert customer service analyst. Your job is to analyze email threads between customers and a company, then provide structured summaries that help customer experience associates respond quickly and effectively.

Guidelines:
- Be concise but comprehensive
- Identify the core issue, not just symptoms
- Assess customer sentiment accurately
- Provide actionable next steps
- Use professional, neutral language
- If information is ambiguous, acknowledge uncertainty

Output Format: Always respond with valid JSON matching this schema:
{
  "summary": "2-3 sentence overview of the entire conversation",
  "keyIssue": "The main problem the customer is experiencing",
  "sentiment": "frustrated | neutral | satisfied | angry",
  "currentStatus": "unresolved | pending | resolved",
  "recommendedAction": "Specific next step for the associate",
  "confidenceScore": 0.0-1.0,
  "additionalContext": "Any important details or red flags"
}`;

export function buildUserPrompt(threadData: {
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
}): string {
  let prompt = `Analyze this customer service email thread:

ORDER DETAILS:
- Order ID: ${threadData.order_id}
- Product: ${threadData.product}
- Topic: ${threadData.topic}
- Initiated By: ${threadData.initiated_by}

`;

  if (crmContext) {
    prompt += `CUSTOMER CONTEXT:
- Name: ${crmContext.customerProfile.name}
- Email: ${crmContext.customerProfile.email}
- Customer Tier: ${crmContext.customerProfile.tier}
- Lifetime Value: $${crmContext.customerProfile.lifetimeValue}
- Previous Issues: ${crmContext.customerProfile.previousIssues}

RECENT ORDERS:
${crmContext.orderHistory.slice(0, 3).map(order =>
  `- ${order.product} (${order.status}) - $${order.value} on ${order.date}`
).join('\n')}

RELATED TICKETS:
${crmContext.relatedTickets.slice(0, 3).map(ticket =>
  `- ${ticket.subject} (${ticket.status}, ${ticket.priority})`
).join('\n')}

SUGGESTED RESPONSE PATTERNS:
${crmContext.suggestedResponses.map(response => `- "${response}"`).join('\n')}

`;
  }

  prompt += `EMAIL THREAD:
`;

  for (const message of threadData.messages) {
    prompt += `\n[${message.sender} at ${message.timestamp}]:\n${message.body}\n`;
  }

  prompt += `\nProvide a structured analysis in JSON format. Consider the customer's history and tier when assessing priority and recommended actions.`;

  return prompt;
}
