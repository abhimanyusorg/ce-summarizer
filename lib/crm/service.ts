import { CRMContext, CRMProvider } from '@/types/crm';

export class CRMService {
  private provider: CRMProvider;
  private apiKey?: string;
  private baseUrl?: string;

  constructor() {
    this.provider = (process.env.CRM_PROVIDER as CRMProvider) || 'mock';
    this.apiKey = process.env.CRM_API_KEY;
    this.baseUrl = process.env.CRM_BASE_URL;
  }

  async getCustomerContext(email: string): Promise<CRMContext> {
    try {
      // Check if real CRM is configured
      if (this.isRealCRMConfigured()) {
        return await this.fetchFromRealCRM(email);
      } else {
        console.log('CRM: Using mock data (no real CRM configured)');
        return this.getMockCRMData(email);
      }
    } catch (error) {
      console.error('CRM: Error fetching customer context:', error);
      // Fallback to mock data on error
      return this.getMockCRMData(email);
    }
  }

  private isRealCRMConfigured(): boolean {
    return !!(
      this.provider &&
      this.provider !== 'mock' &&
      this.apiKey &&
      this.baseUrl
    );
  }

  private async fetchFromRealCRM(email: string): Promise<CRMContext> {
    switch (this.provider) {
      case 'salesforce':
        return this.fetchFromSalesforce(email);
      case 'zendesk':
        return this.fetchFromZendesk(email);
      case 'shopify':
        return this.fetchFromShopify(email);
      default:
        throw new Error(`Unsupported CRM provider: ${this.provider}`);
    }
  }

  private async fetchFromSalesforce(email: string): Promise<CRMContext> {
    // Salesforce REST API integration
    const response = await fetch(`${this.baseUrl}/services/data/v58.0/query?q=SELECT+Id,Name,Email__c,Customer_Tier__c,Lifetime_Value__c,Previous_Issues__c,Orders__r,Cases__r+FROM+Contact+WHERE+Email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Salesforce API error: ${response.status}`);
    }

    const data = await response.json();
    return this.transformSalesforceData(data);
  }

  private async fetchFromZendesk(email: string): Promise<CRMContext> {
    // Zendesk API integration
    const response = await fetch(`${this.baseUrl}/api/v2/search.json?query=email:${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Zendesk API error: ${response.status}`);
    }

    const data = await response.json();
    return this.transformZendeskData(data);
  }

  private async fetchFromShopify(email: string): Promise<CRMContext> {
    // First get customer by email
    const customerResponse = await fetch(`${this.baseUrl}/admin/api/2024-01/customers/search.json?query=email:${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': this.apiKey!,
        'Content-Type': 'application/json',
      },
    });

    if (!customerResponse.ok) {
      throw new Error(`Shopify customer API error: ${customerResponse.status}`);
    }

    const customerData = await customerResponse.json();
    const customer = customerData.customers?.[0];

    if (!customer) {
      throw new Error('Customer not found in Shopify');
    }

    // Get customer's orders
    const ordersResponse = await fetch(`${this.baseUrl}/admin/api/2024-01/customers/${customer.id}/orders.json`, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': this.apiKey!,
        'Content-Type': 'application/json',
      },
    });

    if (!ordersResponse.ok) {
      throw new Error(`Shopify orders API error: ${ordersResponse.status}`);
    }

    const ordersData = await ordersResponse.json();

    return this.transformShopifyData({ customer, orders: ordersData.orders || [] });
  }

  private transformSalesforceData(data: any): CRMContext {
    // Transform Salesforce response to our CRMContext format
    return {
      customerProfile: {
        id: data.Id,
        name: data.Name,
        email: data.Email__c,
        tier: data.Customer_Tier__c || 'bronze',
        lifetimeValue: data.Lifetime_Value__c || 0,
        previousIssues: data.Previous_Issues__c || 0,
      },
      orderHistory: data.Orders__r?.records?.map((order: any) => ({
        id: order.Id,
        product: order.Product__c,
        status: order.Status__c,
        date: order.CreatedDate,
        value: order.Total_Amount__c,
      })) || [],
      relatedTickets: data.Cases__r?.records?.map((ticket: any) => ({
        id: ticket.Id,
        subject: ticket.Subject,
        status: ticket.Status,
        priority: ticket.Priority,
        createdAt: ticket.CreatedDate,
      })) || [],
      suggestedResponses: this.generateSuggestedResponses(data),
    };
  }

  private transformZendeskData(data: any): CRMContext {
    // Transform Zendesk response to our CRMContext format
    const customer = data.results?.[0];
    return {
      customerProfile: {
        id: customer?.id?.toString(),
        name: customer?.name || 'Unknown',
        email: customer?.email,
        tier: customer?.tags?.includes('vip') ? 'gold' : 'bronze',
        lifetimeValue: 0, // Zendesk doesn't typically store LTV
        previousIssues: customer?.ticket_count || 0,
      },
      orderHistory: [], // Would need custom fields or separate integration
      relatedTickets: customer?.tickets?.map((ticket: any) => ({
        id: ticket.id.toString(),
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        createdAt: ticket.created_at,
      })) || [],
      suggestedResponses: this.generateSuggestedResponses(customer),
    };
  }

  private transformShopifyData(data: any): CRMContext {
    // Transform Shopify response to our CRMContext format
    const order = data.orders?.[0];
    const customer = order?.customer;

    return {
      customerProfile: {
        id: customer?.id?.toString(),
        name: `${customer?.first_name} ${customer?.last_name}`,
        email: customer?.email,
        tier: this.calculateShopifyTier(customer?.total_spent),
        lifetimeValue: parseFloat(customer?.total_spent) || 0,
        previousIssues: 0, // Would need custom integration
      },
      orderHistory: data.orders?.map((o: any) => ({
        id: o.id.toString(),
        product: o.line_items?.[0]?.name || 'Unknown',
        status: o.fulfillment_status || o.status,
        date: o.created_at,
        value: parseFloat(o.total_price),
      })) || [],
      relatedTickets: [], // Would need separate helpdesk integration
      suggestedResponses: this.generateSuggestedResponses(customer),
    };
  }

  private calculateShopifyTier(totalSpent: string): 'bronze' | 'silver' | 'gold' {
    const spent = parseFloat(totalSpent) || 0;
    if (spent >= 1000) return 'gold';
    if (spent >= 500) return 'silver';
    return 'bronze';
  }

  private generateSuggestedResponses(customerData: any): string[] {
    const responses: string[] = [];

    // Base responses
    responses.push("Thank you for your patience. We're working to resolve this issue.");

    // Tier-based responses
    const tier = customerData?.tier || customerData?.Customer_Tier__c || 'bronze';
    if (tier === 'gold') {
      responses.push("As a valued Gold member, we'll prioritize your request and provide expedited service.");
    }

    // Issue history based responses
    const prevIssues = customerData?.previousIssues || customerData?.Previous_Issues__c || 0;
    if (prevIssues > 2) {
      responses.push("We appreciate your continued business and want to ensure this issue is resolved to your satisfaction.");
    }

    return responses;
  }

  private getMockCRMData(email: string): CRMContext {
    // Enhanced mock data based on email patterns
    const isVIP = email.includes('sarah') || email.includes('vip'); // Make certain emails VIP
    const hasHistory = email.includes('john') || email.includes('history'); // Give certain emails history

    const customerId = `CUST-${this.simpleHash(email).toString().slice(-6)}`;

    return {
      customerProfile: {
        id: customerId,
        name: isVIP ? 'Sarah Johnson (VIP)' : 'John Smith',
        email,
        tier: isVIP ? 'gold' : hasHistory ? 'silver' : 'bronze',
        lifetimeValue: isVIP ? 2450 : hasHistory ? 850 : 120,
        previousIssues: isVIP ? 3 : hasHistory ? 2 : 0,
      },
      orderHistory: hasHistory ? [
        {
          id: `${customerId}-001`,
          product: 'Wireless Headphones',
          status: 'delivered',
          date: '2025-08-15',
          value: 199.99,
        },
        {
          id: `${customerId}-002`,
          product: 'LED Monitor',
          status: 'shipped',
          date: '2025-09-01',
          value: 349.99,
        },
      ] : [],
      relatedTickets: isVIP ? [
        {
          id: `TICKET-${customerId.slice(-3)}-001`,
          subject: 'Previous return request',
          status: 'resolved',
          priority: 'normal',
          createdAt: '2025-08-20',
        },
      ] : [],
      suggestedResponses: [
        "Thank you for your patience. We're working to resolve this issue.",
        isVIP ? "As a valued Gold member, we'll prioritize your request and provide expedited service." : "We appreciate your business and want to resolve this quickly.",
        hasHistory ? "Based on your order history, we want to ensure this meets your expectations." : "",
      ].filter(Boolean),
    };
  }

  async updateTicketStatus(threadId: string, status: string): Promise<void> {
    if (!this.isRealCRMConfigured()) {
      console.log(`CRM: Mock update - Thread ${threadId} status: ${status}`);
      return;
    }

    try {
      // Update CRM ticket status
      // Implementation would depend on CRM provider
      console.log(`CRM: Updated ticket ${threadId} to status: ${status}`);
    } catch (error) {
      console.error('CRM: Failed to update ticket status:', error);
      throw error;
    }
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

// Singleton instance
export const crmService = new CRMService();