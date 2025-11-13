/**
 * Lightspeed X Series POS Integration Service
 * Handles customer sync and pricing integration
 */

interface LightspeedConfig {
  domainPrefix: string;
  personalToken: string;
}

interface LightspeedCustomer {
  id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  company_name?: string;
  custom_field_1?: string;
  custom_field_2?: string;
  custom_field_3?: string;
  custom_field_4?: string;
}

interface LightspeedProduct {
  id?: string;
  name?: string;
  description?: string;
  sku?: string;
  handle?: string;
  supply_price?: number;
  retail_price?: number;
  variant_parent_id?: string;
  variant_name?: string;
}

interface LightspeedSale {
  id?: string;
  customer_id?: string;
  sale_date?: string;
  status?: string;
  note?: string;
  line_items?: Array<{
    product_id?: string;
    variant_id?: string;
    quantity: number;
    price: number;
    note?: string;
  }>;
  payments?: Array<{
    amount: number;
    payment_type_id: string;
    payment_date?: string;
  }>;
}

export class LightspeedService {
  private config: LightspeedConfig;
  private baseUrl: string;

  constructor() {
    this.config = {
      domainPrefix: process.env.LIGHTSPEED_DOMAIN_PREFIX || '',
      personalToken: process.env.LIGHTSPEED_PERSONAL_TOKEN || '',
    };
    this.baseUrl = `https://${this.config.domainPrefix}.retail.lightspeed.app/api/2.0`;
  }

  /**
   * Check if Lightspeed is configured
   */
  isConfigured(): boolean {
    return !!(this.config.domainPrefix && this.config.personalToken);
  }

  /**
   * Get authorization header
   */
  private getAuthHeader(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.config.personalToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Fetch all customers from Lightspeed X Series
   */
  async getCustomers(limit = 100, offset = 0): Promise<LightspeedCustomer[]> {
    if (!this.isConfigured()) {
      throw new Error('Lightspeed not configured');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/customers`,
        {
          headers: this.getAuthHeader(),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lightspeed API error: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return data.data || [];
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
        `${this.baseUrl}/customers/${customerId}`,
        {
          headers: this.getAuthHeader(),
        }
      );

      if (!response.ok) {
        if (response.status === 404) return null;
        const errorText = await response.text();
        throw new Error(`Lightspeed API error: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('Error fetching Lightspeed customer:', error);
      throw error;
    }
  }

  /**
   * Create a new customer in Lightspeed X Series
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
      const lightspeedCustomer: Partial<LightspeedCustomer> = {
        first_name: customer.firstName,
        last_name: customer.lastName,
        email: customer.email,
        phone: customer.phone,
      };

      const response = await fetch(
        `${this.baseUrl}/customers`,
        {
          method: 'POST',
          headers: this.getAuthHeader(),
          body: JSON.stringify(lightspeedCustomer),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lightspeed API error: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating Lightspeed customer:', error);
      throw error;
    }
  }

  /**
   * Update a customer in Lightspeed X Series
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

      if (updates.firstName) lightspeedCustomer.first_name = updates.firstName;
      if (updates.lastName) lightspeedCustomer.last_name = updates.lastName;
      if (updates.email) lightspeedCustomer.email = updates.email;
      if (updates.phone) lightspeedCustomer.phone = updates.phone;

      const response = await fetch(
        `${this.baseUrl}/customers/${customerId}`,
        {
          method: 'PUT',
          headers: this.getAuthHeader(),
          body: JSON.stringify(lightspeedCustomer),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lightspeed API error: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating Lightspeed customer:', error);
      throw error;
    }
  }

  /**
   * Get products (for pricing sync)
   */
  async getItems(limit = 100, offset = 0): Promise<LightspeedProduct[]> {
    if (!this.isConfigured()) {
      throw new Error('Lightspeed not configured');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/products`,
        {
          headers: this.getAuthHeader(),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lightspeed API error: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching Lightspeed products:', error);
      throw error;
    }
  }

  /**
   * Create or update a product in Lightspeed X Series (for pricing sync)
   */
  async syncPricing(repair: {
    description: string;
    price: number;
    cost?: number;
    lightspeedItemId?: string;
  }): Promise<LightspeedProduct> {
    if (!this.isConfigured()) {
      throw new Error('Lightspeed not configured');
    }

    try {
      const product: Partial<LightspeedProduct> = {
        name: repair.description,
        description: repair.description,
        supply_price: repair.cost,
        retail_price: repair.price,
      };

      const method = repair.lightspeedItemId ? 'PUT' : 'POST';
      const url = repair.lightspeedItemId
        ? `${this.baseUrl}/products/${repair.lightspeedItemId}`
        : `${this.baseUrl}/products`;

      const response = await fetch(url, {
        method,
        headers: this.getAuthHeader(),
        body: JSON.stringify(product),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lightspeed API error: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error syncing pricing to Lightspeed:', error);
      throw error;
    }
  }

  /**
   * Create a sale in Lightspeed from a completed repair
   */
  async createSale(sale: {
    customerId?: string;
    items: Array<{
      name: string;
      price: number;
      quantity: number;
      sku?: string;
    }>;
    totalPaid: number;
    paymentType?: string;
    note?: string;
  }): Promise<LightspeedSale> {
    if (!this.isConfigured()) {
      throw new Error('Lightspeed not configured');
    }

    try {
      // First, create/find products for each repair item
      const lineItems = []

      for (const item of sale.items) {
        // Try to find existing product by SKU
        let product = null
        if (item.sku) {
          try {
            const products = await this.getItems()
            product = products.find(p => p.sku === item.sku)
          } catch (e) {
            console.log('Could not search for existing product:', e)
          }
        }

        // Create product if it doesn't exist
        if (!product) {
          product = await this.syncPricing({
            description: item.name,
            price: item.price,
            cost: Math.round(item.price * 0.5), // Estimate 50% cost
          })
        }

        lineItems.push({
          product_id: product.id,
          quantity: item.quantity,
          price: item.price,
          note: item.name,
        })
      }

      // Create the sale
      const lightspeedSale: Partial<LightspeedSale> = {
        customer_id: sale.customerId,
        sale_date: new Date().toISOString(),
        status: 'complete',
        note: sale.note || 'Repair order synced from dashboard',
        line_items: lineItems,
        payments: [{
          amount: sale.totalPaid,
          payment_type_id: '1', // Cash/default payment type
          payment_date: new Date().toISOString(),
        }],
      }

      const response = await fetch(
        `${this.baseUrl}/sales`,
        {
          method: 'POST',
          headers: this.getAuthHeader(),
          body: JSON.stringify(lightspeedSale),
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Lightspeed API error: ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      console.error('Error creating Lightspeed sale:', error)
      throw error
    }
  }
}

// Export singleton instance
export const lightspeedService = new LightspeedService();
