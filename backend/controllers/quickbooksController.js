const asyncHandler = require('express-async-handler');
const QuickbooksConfig = require('../models/QuickbooksConfig');
const quickbooksService = require('../services/quickbooksService');
const OAuthClient = require('intuit-oauth');

/**
 * @desc    Get QuickBooks configuration
 * @route   GET /api/finance/quickbooks/config
 * @access  Private/Admin/Finance
 */
const getQuickbooksConfig = asyncHandler(async (req, res) => {
  // Get configuration from database
  let config = await QuickbooksConfig.findOne();
  
  // If no configuration exists, create a default one
  if (!config) {
    config = await QuickbooksConfig.create({
      isConfigured: false,
      environment: 'sandbox',
      clientId: '',
      clientSecret: '',
      redirectUri: '',
      realmId: '',
      accountMappings: {
        tuitionFees: '',
        libraryFees: '',
        examFees: '',
        transportFees: '',
        uniformFees: '',
        otherFees: '',
        cashAccount: '',
        bankAccount: '',
        mobileMoney: ''
      },
      syncSettings: {
        autoSyncEnabled: false,
        syncFrequency: 'daily',
        lastSyncStatus: 'not_started'
      }
    });
  }
  
  // Remove sensitive information
  const configResponse = {
    isConfigured: config.isConfigured,
    environment: config.environment,
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    realmId: config.realmId,
    lastSyncDate: config.lastSyncDate,
    accountMappings: config.accountMappings,
    syncSettings: config.syncSettings
  };
  
  res.json(configResponse);
});

/**
 * @desc    Update QuickBooks configuration
 * @route   PUT /api/finance/quickbooks/config
 * @access  Private/Admin/Finance
 */
const updateQuickbooksConfig = asyncHandler(async (req, res) => {
  // Get configuration from database
  let config = await QuickbooksConfig.findOne();
  
  // If no configuration exists, create a new one
  if (!config) {
    config = new QuickbooksConfig();
  }
  
  // Update configuration fields
  config.isConfigured = true;
  config.environment = req.body.environment || config.environment;
  config.clientId = req.body.clientId || config.clientId;
  config.redirectUri = req.body.redirectUri || config.redirectUri;
  
  // Only update client secret if provided (to avoid overwriting with empty string)
  if (req.body.clientSecret) {
    config.clientSecret = req.body.clientSecret;
  }
  
  // Update account mappings if provided
  if (req.body.accountMappings) {
    config.accountMappings = {
      ...config.accountMappings,
      ...req.body.accountMappings
    };
  }
  
  // Update sync settings if provided
  if (req.body.syncSettings) {
    config.syncSettings = {
      ...config.syncSettings,
      ...req.body.syncSettings
    };
  }
  
  // Save configuration
  await config.save();
  
  // Initialize QuickBooks service with new configuration
  await quickbooksService.initialize();
  
  // Remove sensitive information from response
  const configResponse = {
    isConfigured: config.isConfigured,
    environment: config.environment,
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    realmId: config.realmId,
    lastSyncDate: config.lastSyncDate,
    accountMappings: config.accountMappings,
    syncSettings: config.syncSettings
  };
  
  res.json({
    message: 'QuickBooks configuration updated successfully',
    config: configResponse
  });
});

/**
 * @desc    Get QuickBooks authorization URL
 * @route   GET /api/finance/quickbooks/auth-url
 * @access  Private/Admin/Finance
 */
const getAuthUrl = asyncHandler(async (req, res) => {
  // Get configuration from database
  const config = await QuickbooksConfig.findOne();
  
  if (!config || !config.isConfigured) {
    return res.status(400).json({ message: 'QuickBooks is not configured' });
  }
  
  // Initialize QuickBooks service
  await quickbooksService.initialize();
  
  // Get authorization URL
  const authUrl = quickbooksService.getAuthorizationUrl();
  
  res.json({ authUrl });
});

/**
 * @desc    Handle QuickBooks OAuth callback
 * @route   GET /api/finance/quickbooks/callback
 * @access  Public
 */
const handleCallback = asyncHandler(async (req, res) => {
  try {
    // Get the full URL including query parameters
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    
    // Initialize QuickBooks service
    await quickbooksService.initialize();
    
    // Handle callback
    const result = await quickbooksService.handleCallback(fullUrl);
    
    // Redirect to frontend with success message
    res.redirect(`/finance/quickbooks?success=true&realmId=${result.realmId}`);
  } catch (error) {
    console.error('Error handling QuickBooks callback:', error);
    
    // Redirect to frontend with error message
    res.redirect(`/finance/quickbooks?success=false&error=${encodeURIComponent(error.message)}`);
  }
});

/**
 * @desc    Get QuickBooks accounts
 * @route   GET /api/finance/quickbooks/accounts
 * @access  Private/Admin/Finance
 */
const getAccounts = asyncHandler(async (req, res) => {
  // Get configuration from database
  const config = await QuickbooksConfig.findOne();
  
  if (!config || !config.isConfigured || !config.realmId) {
    return res.status(400).json({ message: 'QuickBooks is not configured or connected' });
  }
  
  // Initialize QuickBooks service
  await quickbooksService.initialize();
  
  // Get accounts
  const accounts = await quickbooksService.getAccounts();
  
  res.json(accounts);
});

/**
 * @desc    Get QuickBooks payment methods
 * @route   GET /api/finance/quickbooks/payment-methods
 * @access  Private/Admin/Finance
 */
const getPaymentMethods = asyncHandler(async (req, res) => {
  // Get configuration from database
  const config = await QuickbooksConfig.findOne();
  
  if (!config || !config.isConfigured || !config.realmId) {
    return res.status(400).json({ message: 'QuickBooks is not configured or connected' });
  }
  
  // Initialize QuickBooks service
  await quickbooksService.initialize();
  
  // Get payment methods
  const paymentMethods = await quickbooksService.getPaymentMethods();
  
  res.json(paymentMethods);
});

module.exports = {
  getQuickbooksConfig,
  updateQuickbooksConfig,
  getAuthUrl,
  handleCallback,
  getAccounts,
  getPaymentMethods
};
