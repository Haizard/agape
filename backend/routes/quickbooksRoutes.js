const express = require('express');
const router = express.Router();
const { authenticateToken: protect, authorizeRole } = require('../middleware/auth');
const admin = (req, res, next) => authorizeRole(['admin'])(req, res, next);
const finance = (req, res, next) => authorizeRole(['admin', 'finance'])(req, res, next);
const quickbooksController = require('../controllers/quickbooksController');
const quickbooksTransactionController = require('../controllers/quickbooksTransactionController');

// QuickBooks configuration routes
router.route('/config')
  .get(protect, finance, quickbooksController.getQuickbooksConfig)
  .put(protect, finance, quickbooksController.updateQuickbooksConfig);

// QuickBooks authorization routes
router.get('/auth-url', protect, finance, quickbooksController.getAuthUrl);
router.get('/callback', quickbooksController.handleCallback);

// QuickBooks data routes
router.get('/accounts', protect, finance, quickbooksController.getAccounts);
router.get('/payment-methods', protect, finance, quickbooksController.getPaymentMethods);

// QuickBooks transaction routes
router.get('/transactions', protect, finance, quickbooksTransactionController.getTransactions);
router.post('/sync-all', protect, finance, quickbooksTransactionController.syncAllTransactions);
router.post('/sync-transaction/:id', protect, finance, quickbooksTransactionController.syncTransaction);

module.exports = router;
