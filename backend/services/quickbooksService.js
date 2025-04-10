const OAuthClient = require('intuit-oauth');
const QuickBooks = require('node-quickbooks');
const QuickbooksConfig = require('../models/QuickbooksConfig');

/**
 * QuickBooks Service
 * Handles integration with QuickBooks API
 */
class QuickbooksService {
  constructor() {
    this.oauthClient = null;
    this.qbo = null;
    this.config = null;
  }

  /**
   * Initialize the QuickBooks service with configuration
   */
  async initialize() {
    try {
      // Get configuration from database
      this.config = await QuickbooksConfig.getConfig();

      if (!this.config.isConfigured) {
        console.log('QuickBooks is not configured yet');
        return false;
      }

      // Initialize OAuth client
      this.oauthClient = new OAuthClient({
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret,
        environment: this.config.environment,
        redirectUri: this.config.redirectUri
      });

      // Check if we have valid tokens
      if (this.config.accessToken && this.config.refreshToken && this.config.realmId) {
        // Set tokens in OAuth client
        this.oauthClient.setToken({
          access_token: this.config.accessToken,
          refresh_token: this.config.refreshToken,
          realmId: this.config.realmId,
          expires_in: this.getTokenExpirySeconds()
        });

        // Initialize QuickBooks client
        this.initializeQBOClient();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error initializing QuickBooks service:', error);
      return false;
    }
  }

  /**
   * Initialize the QuickBooks Online client
   */
  initializeQBOClient() {
    if (!this.config.realmId || !this.config.accessToken) {
      console.error('Cannot initialize QBO client: Missing realmId or accessToken');
      return;
    }

    this.qbo = new QuickBooks(
      this.config.clientId,
      this.config.clientSecret,
      this.config.accessToken,
      false, // don't use OAuth 1.0
      this.config.realmId,
      this.config.environment === 'sandbox', // sandbox?
      true, // debug?
      null, // minor version
      '2.0', // OAuth version
      this.config.refreshToken
    );
  }

  /**
   * Get the authorization URL for QuickBooks OAuth
   */
  getAuthorizationUrl() {
    if (!this.oauthClient) {
      throw new Error('OAuth client not initialized');
    }

    const authUri = this.oauthClient.authorizeUri({
      scope: [OAuthClient.scopes.Accounting],
      state: 'finance-integration'
    });

    return authUri;
  }

  /**
   * Handle the callback from QuickBooks OAuth
   * @param {string} url - The callback URL with authorization code
   */
  async handleCallback(url) {
    if (!this.oauthClient) {
      throw new Error('OAuth client not initialized');
    }

    try {
      // Parse the redirect URL and exchange the auth code for tokens
      const authResponse = await this.oauthClient.createToken(url);
      const tokens = authResponse.getJson();

      // Update configuration with tokens
      this.config.accessToken = tokens.access_token;
      this.config.refreshToken = tokens.refresh_token;
      this.config.realmId = tokens.realmId;
      this.config.tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);
      this.config.isConfigured = true;

      await this.config.save();

      // Initialize QuickBooks client
      this.initializeQBOClient();

      return {
        success: true,
        realmId: tokens.realmId
      };
    } catch (error) {
      console.error('Error handling QuickBooks callback:', error);
      throw error;
    }
  }

  /**
   * Refresh the access token if it's expired
   */
  async refreshTokenIfNeeded() {
    if (!this.oauthClient || !this.config) {
      throw new Error('QuickBooks service not initialized');
    }

    // Check if token is expired or about to expire (within 10 minutes)
    if (this.config.tokenExpiry && new Date(this.config.tokenExpiry) < new Date(Date.now() + 10 * 60 * 1000)) {
      try {
        console.log('Refreshing QuickBooks access token');
        const authResponse = await this.oauthClient.refreshUsingToken(this.config.refreshToken);
        const tokens = authResponse.getJson();

        // Update configuration with new tokens
        this.config.accessToken = tokens.access_token;
        this.config.refreshToken = tokens.refresh_token;
        this.config.tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);

        await this.config.save();

        // Reinitialize QuickBooks client with new token
        this.initializeQBOClient();

        return true;
      } catch (error) {
        console.error('Error refreshing QuickBooks token:', error);
        throw error;
      }
    }

    return false;
  }

  /**
   * Get token expiry in seconds
   */
  getTokenExpirySeconds() {
    if (!this.config.tokenExpiry) {
      return 0;
    }

    const expiryTime = new Date(this.config.tokenExpiry).getTime();
    const currentTime = Date.now();
    const expirySeconds = Math.floor((expiryTime - currentTime) / 1000);

    return expirySeconds > 0 ? expirySeconds : 0;
  }

  /**
   * Create a customer in QuickBooks
   * @param {Object} studentData - Student data
   */
  async createCustomer(studentData) {
    await this.refreshTokenIfNeeded();

    if (!this.qbo) {
      throw new Error('QuickBooks client not initialized');
    }

    const customerData = {
      DisplayName: `${studentData.firstName} ${studentData.lastName} (${studentData.admissionNumber})`,
      GivenName: studentData.firstName,
      FamilyName: studentData.lastName,
      PrimaryEmailAddr: {
        Address: studentData.email || ''
      },
      Notes: `Student ID: ${studentData._id}, Admission Number: ${studentData.admissionNumber}`
    };

    return new Promise((resolve, reject) => {
      this.qbo.createCustomer(customerData, (err, customer) => {
        if (err) {
          reject(err);
        } else {
          resolve(customer);
        }
      });
    });
  }

  /**
   * Create an invoice in QuickBooks
   * @param {Object} studentFee - Student fee data
   * @param {Object} customer - QuickBooks customer
   */
  async createInvoice(studentFee, customer) {
    await this.refreshTokenIfNeeded();

    if (!this.qbo) {
      throw new Error('QuickBooks client not initialized');
    }

    // Prepare line items from fee components
    const lineItems = studentFee.feeComponents.map(component => {
      return {
        Amount: component.amount,
        Description: component.name,
        DetailType: 'SalesItemLineDetail',
        SalesItemLineDetail: {
          ItemRef: {
            value: component.quickbooksAccountId || this.getDefaultAccountId(component.name)
          },
          TaxCodeRef: {
            value: 'NON'
          }
        }
      };
    });

    const invoiceData = {
      Line: lineItems,
      CustomerRef: {
        value: customer.Id
      },
      DueDate: studentFee.dueDate
    };

    return new Promise((resolve, reject) => {
      this.qbo.createInvoice(invoiceData, (err, invoice) => {
        if (err) {
          reject(err);
        } else {
          resolve(invoice);
        }
      });
    });
  }

  /**
   * Record a payment in QuickBooks
   * @param {Object} payment - Payment data
   * @param {Object} invoice - QuickBooks invoice
   */
  async recordPayment(payment, invoice) {
    await this.refreshTokenIfNeeded();

    if (!this.qbo) {
      throw new Error('QuickBooks client not initialized');
    }

    const paymentData = {
      TotalAmt: payment.amount,
      CustomerRef: {
        value: invoice.CustomerRef.value
      },
      PaymentMethodRef: {
        value: this.getPaymentMethodId(payment.paymentMethod)
      },
      Line: [{
        Amount: payment.amount,
        LinkedTxn: [{
          TxnId: invoice.Id,
          TxnType: 'Invoice'
        }]
      }]
    };

    return new Promise((resolve, reject) => {
      this.qbo.createPayment(paymentData, (err, payment) => {
        if (err) {
          reject(err);
        } else {
          resolve(payment);
        }
      });
    });
  }

  /**
   * Get default account ID based on fee component name
   * @param {string} componentName - Fee component name
   */
  getDefaultAccountId(componentName) {
    const name = componentName.toLowerCase();
    
    if (this.config.accountMappings) {
      if (name.includes('tuition')) return this.config.accountMappings.tuitionFees;
      if (name.includes('library')) return this.config.accountMappings.libraryFees;
      if (name.includes('exam')) return this.config.accountMappings.examFees;
      if (name.includes('transport')) return this.config.accountMappings.transportFees;
      if (name.includes('uniform')) return this.config.accountMappings.uniformFees;
    }
    
    // Default to other fees
    return this.config.accountMappings?.otherFees || '1';
  }

  /**
   * Get payment method ID based on payment method
   * @param {string} method - Payment method
   */
  getPaymentMethodId(method) {
    switch (method) {
      case 'cash':
        return this.config.accountMappings?.cashAccount || '1';
      case 'bank_transfer':
      case 'check':
        return this.config.accountMappings?.bankAccount || '2';
      case 'mobile_money':
        return this.config.accountMappings?.mobileMoney || '3';
      default:
        return '1'; // Default to cash
    }
  }

  /**
   * Get accounts from QuickBooks
   */
  async getAccounts() {
    await this.refreshTokenIfNeeded();

    if (!this.qbo) {
      throw new Error('QuickBooks client not initialized');
    }

    return new Promise((resolve, reject) => {
      this.qbo.findAccounts({
        AccountType: 'Income'
      }, (err, accounts) => {
        if (err) {
          reject(err);
        } else {
          resolve(accounts.QueryResponse.Account);
        }
      });
    });
  }

  /**
   * Get payment methods from QuickBooks
   */
  async getPaymentMethods() {
    await this.refreshTokenIfNeeded();

    if (!this.qbo) {
      throw new Error('QuickBooks client not initialized');
    }

    return new Promise((resolve, reject) => {
      this.qbo.findPaymentMethods({}, (err, methods) => {
        if (err) {
          reject(err);
        } else {
          resolve(methods.QueryResponse.PaymentMethod);
        }
      });
    });
  }
}

// Create a singleton instance
const quickbooksService = new QuickbooksService();

module.exports = quickbooksService;
