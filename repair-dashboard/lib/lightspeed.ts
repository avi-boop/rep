/**
 * Lightspeed POS Integration Service
 * Handles customer sync and pricing integration
 */

interface LightspeedConfig {
  accountId: string;
  personalToken: string;
  apiUrl?: string;
}

interface LightspeedCustomer {
  customerID?: string;
  firstName: string;
  lastName: string;
  emailAddress?: string;
  primaryPhone?: string;
  customFieldValues?: any;
}

interface LightspeedItem {
  itemID?: string;
  description: string;
  defaultCost?: number;
  Prices?: {
    ItemPrice: Array<{
      amount: number;
      useType: string;
    }>;
  };
}

export class LightspeedService {
  private config: LightspeedConfig;
  private baseUrl: string;

  constructor() {
    this.config = {
      accountId: process.env.LIGHTSPEED_ACCOUNT_ID || '',
      personalToken: process.env.LIGHTSPEED_PERSONAL_TOKEN || '',
      apiUrl: process.env.LIGHTSPEED_API_URL || 'https://api.lightspeedapp.com/API/V3/Account',
    };
    this.baseUrl = `${this.config.apiUrl}/${this.config.accountId}`;
  }

  /**
   * Check if Lightspeed is configured
   */
  isConfigured(): boolean {
    return !!(this.config.accountId && this.config.personalToken);
  }

  /**
   * Get authorization header
   */
  private getAuthHeader(): HeadersInit {
    const token = Buffer.from(`:${this.config.personalToken}`).toString('base64');
    return {
      'Authorization': `Basic ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Fetch all customers from Lightspeed
   */
  async getCustomers(limit = 100, offset = 0): Promise<LightspeedCustomer[]> {
    if (!this.isConfigured()) {
      throw new Error('Lightspeed not configured');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/Customer.json?limit=${limit}&offset=${offset}`,
        {
          headers: this.getAuthHeader(),
        }
      );

      if (!response.ok) {
        throw new Error(`Lightspeed API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.Customer || [];
    } catch (error) {
      console.error('Error fetching Lightspeed customers:', error);
      throw error;
    }
  }

  /**
   * Get a single customer by ID
   */
  async getCustomer(customerId: string): Promise<LightspeedCustomer | null> {
    if (!this.isConfigured()) {
      throw new Error('Lightspeed not configured');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/Customer/${customerId}.json`,
        {
          headers: this.getAuthHeader(),
        }
      );

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Lightspeed API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.Customer || null;
    } catch (error) {
      console.error('Error fetching Lightspeed customer:', error);
      throw error;
    }
  }

  /**
   * Create a new customer in Lightspeed
   */
  async createCustomer(customer: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  }): Promise<LightspeedCustomer> {
    if (!this.isConfigured()) {
      throw new Error('Lightspeed not configured');
    }

    try {
      const lightspeedCustomer: LightspeedCustomer = {
        firstName: customer.firstName,
        lastName: customer.lastName,
        emailAddress: customer.email,
        primaryPhone: customer.phone,
      };

      const response = await fetch(
        `${this.baseUrl}/Customer.json`,
        {
          method: 'POST',
          headers: this.getAuthHeader(),
          body: JSON.stringify({ Customer: lightspeedCustomer }),
        }
      );

      if (!response.ok) {
        throw new Error(`Lightspeed API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.Customer;
    } catch (error) {
      console.error('Error creating Lightspeed customer:', error);
      throw error;
    }
  }

  /**
   * Update a customer in Lightspeed
   */
  async updateCustomer(customerId: string, updates: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  }): Promise<LightspeedCustomer> {
    if (!this.isConfigured()) {
      throw new Error('Lightspeed not configured');
    }

    try {
      const lightspeedCustomer: Partial<LightspeedCustomer> = {};

      if (updates.firstName) lightspeedCustomer.firstName = updates.firstName;
      if (updates.lastName) lightspeedCustomer.lastName = updates.lastName;
      if (updates.email) lightspeedCustomer.emailAddress = updates.email;
      if (updates.phone) lightspeedCustomer.primaryPhone = updates.phone;

      const response = await fetch(
        `${this.baseUrl}/Customer/${customerId}.json`,
        {
          method: 'PUT',
          headers: this.getAuthHeader(),
          body: JSON.stringify({ Customer: lightspeedCustomer }),
        }
      );

      if (!response.ok) {
        throw new Error(`Lightspeed API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.Customer;
    } catch (error) {
      console.error('Error updating Lightspeed customer:', error);
      throw error;
    }
  }

  /**
   * Get items (for pricing sync)
   */
  async getItems(limit = 100, offset = 0): Promise<LightspeedItem[]> {
    if (!this.isConfigured()) {
      throw new Error('Lightspeed not configured');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/Item.json?limit=${limit}&offset=${offset}&load_relations=["Prices"]`,
        {
          headers: this.getAuthHeader(),
        }
      );

      if (!response.ok) {
        throw new Error(`Lightspeed API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.Item || [];
    } catch (error) {
      console.error('Error fetching Lightspeed items:', error);
      throw error;
    }
  }

  /**
   * Create or update an item in Lightspeed (for pricing sync)
   */
  async syncPricing(repair: {
    description: string;
    price: number;
    cost?: number;
    lightspeedItemId?: string;
  }): Promise<LightspeedItem> {
    if (!this.isConfigured()) {
      throw new Error('Lightspeed not configured');
    }

    try {
      const item: Partial<LightspeedItem> = {
        description: repair.description,
        defaultCost: repair.cost,
        Prices: {
          ItemPrice: [{
            amount: repair.price,
            useType: 'Default',
          }],
        },
      };

      const method = repair.lightspeedItemId ? 'PUT' : 'POST';
      const url = repair.lightspeedItemId
        ? `${this.baseUrl}/Item/${repair.lightspeedItemId}.json`
        : `${this.baseUrl}/Item.json`;

      const response = await fetch(url, {
        method,
        headers: this.getAuthHeader(),
        body: JSON.stringify({ Item: item }),
      });

      if (!response.ok) {
        throw new Error(`Lightspeed API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.Item;
    } catch (error) {
      console.error('Error syncing pricing to Lightspeed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const lightspeedService = new LightspeedService();
