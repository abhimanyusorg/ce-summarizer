export type CRMProvider = 'salesforce' | 'zendesk' | 'shopify' | 'mock';

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  tier: 'bronze' | 'silver' | 'gold';
  lifetimeValue: number;
  previousIssues: number;
}

export interface Order {
  id: string;
  product: string;
  status: string;
  date: string;
  value: number;
}

export interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
}

export interface CRMContext {
  customerProfile: CustomerProfile;
  orderHistory: Order[];
  relatedTickets: Ticket[];
  suggestedResponses: string[];
}