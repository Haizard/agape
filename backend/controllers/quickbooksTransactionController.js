const Payment = require('../models/Payment');
const QuickbooksConfig = require('../models/QuickbooksConfig');
const { getQuickbooksClient } = require('../services/quickbooksService');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Get all transactions for QuickBooks reconciliation
 * @route   GET /api/finance/quickbooks/transactions
 * @access  Private/Admin/Finance
 */
const getTransactions = asyncHandler(async (req, res) => {
  const { status, startDate, endDate, search } = req.query;
  
  // Build filter object
  const filter = {};
  
  // Add status filter if provided
  if (status) {
    filter['quickbooksInfo.syncStatus'] = status;
  }
  
  // Add date range filter if provided
  if (startDate || endDate) {
    filter.paymentDate = {};
    if (startDate) filter.paymentDate.$gte = new Date(startDate);
    if (endDate) filter.paymentDate.$lte = new Date(endDate);
  }
  
  // Add search filter if provided
  if (search) {
    filter.$or = [
      { receiptNumber: { $regex: search, $options: 'i' } },
      { 'studentFee.student.firstName': { $regex: search, $options: 'i' } },
      { 'studentFee.student.lastName': { $regex: search, $options: 'i' } }
    ];
  }
  
  // Get payments with populated student fee data
  const payments = await Payment.find(filter)
    .populate({
      path: 'studentFee',
      populate: [
        { path: 'student', select: 'firstName lastName admissionNumber' },
        { path: 'class', select: 'name section stream' },
        { path: 'academicYear', select: 'name year' }
      ]
    })
    .sort({ paymentDate: -1 });
  
  // Transform payments to transaction format
  const transactions = payments.map(payment => ({
    _id: payment._id,
    receiptNumber: payment.receiptNumber,
    paymentDate: payment.paymentDate,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod,
    notes: payment.notes,
    studentName: payment.studentFee ? 
      `${payment.studentFee.student?.firstName || ''} ${payment.studentFee.student?.lastName || ''}`.trim() : 
      'N/A',
    className: payment.studentFee?.class ? 
      `${payment.studentFee.class.name}${payment.studentFee.class.section ? ` - ${payment.studentFee.class.section}` : ''}${payment.studentFee.class.stream ? ` (${payment.studentFee.class.stream})` : ''}` : 
      'N/A',
    syncStatus: payment.quickbooksInfo?.syncStatus || 'pending',
    lastSyncDate: payment.quickbooksInfo?.lastSyncDate || null,
    quickbooksId: payment.quickbooksInfo?.id || null,
    syncError: payment.quickbooksInfo?.syncError || null
  }));
  
  // Calculate stats
  const stats = {
    total: transactions.length,
    synced: transactions.filter(t => t.syncStatus === 'synced').length,
    failed: transactions.filter(t => t.syncStatus === 'failed').length,
    pending: transactions.filter(t => t.syncStatus === 'pending').length
  };
  
  res.json({
    transactions,
    stats
  });
});

/**
 * @desc    Sync all pending transactions to QuickBooks
 * @route   POST /api/finance/quickbooks/sync-all
 * @access  Private/Admin/Finance
 */
const syncAllTransactions = asyncHandler(async (req, res) => {
  // Get QuickBooks configuration
  const config = await QuickbooksConfig.findOne();
  
  if (!config || !config.isConfigured || !config.realmId) {
    return res.status(400).json({ message: 'QuickBooks is not configured or connected' });
  }
  
  // Get pending transactions
  const pendingPayments = await Payment.find({
    $or: [
      { 'quickbooksInfo.syncStatus': { $ne: 'synced' } },
      { 'quickbooksInfo.syncStatus': { $exists: false } }
    ]
  }).populate({
    path: 'studentFee',
    populate: [
      { path: 'student', select: 'firstName lastName admissionNumber' },
      { path: 'class', select: 'name section stream' },
      { path: 'academicYear', select: 'name year' },
      { path: 'feeStructure', select: 'name' }
    ]
  });
  
  if (pendingPayments.length === 0) {
    return res.json({ message: 'No pending transactions to sync' });
  }
  
  // Start background sync process
  // In a production environment, this would be handled by a queue system
  // For simplicity, we'll just return a success message and let the sync happen in the background
  
  // Update the last sync date
  config.lastSyncDate = new Date();
  config.syncSettings.lastSyncStatus = 'in_progress';
  await config.save();
  
  // Start the sync process in the background
  syncPaymentsToQuickbooks(pendingPayments, config);
  
  res.json({ 
    message: `Started syncing ${pendingPayments.length} transactions. This process will run in the background.`,
    pendingCount: pendingPayments.length
  });
});

/**
 * @desc    Sync a single transaction to QuickBooks
 * @route   POST /api/finance/quickbooks/sync-transaction/:id
 * @access  Private/Admin/Finance
 */
const syncTransaction = asyncHandler(async (req, res) => {
  const paymentId = req.params.id;
  
  // Get QuickBooks configuration
  const config = await QuickbooksConfig.findOne();
  
  if (!config || !config.isConfigured || !config.realmId) {
    return res.status(400).json({ message: 'QuickBooks is not configured or connected' });
  }
  
  // Get the payment
  const payment = await Payment.findById(paymentId).populate({
    path: 'studentFee',
    populate: [
      { path: 'student', select: 'firstName lastName admissionNumber' },
      { path: 'class', select: 'name section stream' },
      { path: 'academicYear', select: 'name year' },
      { path: 'feeStructure', select: 'name' }
    ]
  });
  
  if (!payment) {
    return res.status(404).json({ message: 'Payment not found' });
  }
  
  try {
    // Sync the payment to QuickBooks
    const result = await syncPaymentToQuickbooks(payment, config);
    
    res.json({ 
      message: 'Transaction synced successfully',
      transaction: {
        _id: payment._id,
        receiptNumber: payment.receiptNumber,
        syncStatus: payment.quickbooksInfo?.syncStatus || 'pending',
        quickbooksId: payment.quickbooksInfo?.id || null
      }
    });
  } catch (error) {
    console.error('Error syncing transaction:', error);
    
    // Update payment with error information
    payment.quickbooksInfo = {
      ...payment.quickbooksInfo,
      syncStatus: 'failed',
      syncError: error.message,
      lastSyncDate: new Date()
    };
    await payment.save();
    
    res.status(500).json({ 
      message: 'Failed to sync transaction',
      error: error.message
    });
  }
});

/**
 * Helper function to sync a single payment to QuickBooks
 * @param {Object} payment - The payment to sync
 * @param {Object} config - The QuickBooks configuration
 * @returns {Promise} - Promise that resolves when the sync is complete
 */
const syncPaymentToQuickbooks = async (payment, config) => {
  try {
    // Get QuickBooks client
    const qbo = await getQuickbooksClient(config);
    
    if (!qbo) {
      throw new Error('Failed to initialize QuickBooks client');
    }
    
    // Check if payment has the required account mappings
    const { accountMappings } = config;
    
    // Determine income account based on fee type
    let incomeAccountId;
    if (payment.studentFee && payment.studentFee.feeStructure) {
      const feeType = payment.studentFee.feeStructure.name.toLowerCase();
      
      if (feeType.includes('tuition')) {
        incomeAccountId = accountMappings.tuitionFees;
      } else if (feeType.includes('library')) {
        incomeAccountId = accountMappings.libraryFees;
      } else if (feeType.includes('exam')) {
        incomeAccountId = accountMappings.examFees;
      } else if (feeType.includes('transport')) {
        incomeAccountId = accountMappings.transportFees;
      } else if (feeType.includes('uniform')) {
        incomeAccountId = accountMappings.uniformFees;
      } else {
        incomeAccountId = accountMappings.otherFees;
      }
    } else {
      // Default to other fees if no specific fee type is found
      incomeAccountId = accountMappings.otherFees;
    }
    
    if (!incomeAccountId) {
      throw new Error('No income account mapped for this fee type');
    }
    
    // Determine deposit account based on payment method
    let depositAccountId;
    switch (payment.paymentMethod) {
      case 'cash':
        depositAccountId = accountMappings.cashAccount;
        break;
      case 'bank_transfer':
        depositAccountId = accountMappings.bankAccount;
        break;
      case 'mobile_money':
        depositAccountId = accountMappings.mobileMoney;
        break;
      default:
        depositAccountId = accountMappings.cashAccount;
    }
    
    if (!depositAccountId) {
      throw new Error('No deposit account mapped for this payment method');
    }
    
    // Create customer name
    const customerName = payment.studentFee && payment.studentFee.student
      ? `${payment.studentFee.student.firstName || ''} ${payment.studentFee.student.lastName || ''} (${payment.studentFee.student.admissionNumber || 'No ID'})`
      : `Unknown Student (${payment.receiptNumber})`;
    
    // Create payment description
    const description = payment.studentFee
      ? `Payment for ${payment.studentFee.feeStructure?.name || 'fees'} - ${payment.studentFee.academicYear?.name || 'current year'}`
      : `Payment with receipt ${payment.receiptNumber}`;
    
    // Check if this payment was already synced
    if (payment.quickbooksInfo && payment.quickbooksInfo.id) {
      // Update existing payment in QuickBooks
      // This would require implementing an update function
      // For simplicity, we'll just mark it as synced
      payment.quickbooksInfo = {
        ...payment.quickbooksInfo,
        syncStatus: 'synced',
        lastSyncDate: new Date()
      };
      await payment.save();
      
      return {
        success: true,
        message: 'Payment already synced to QuickBooks',
        id: payment.quickbooksInfo.id
      };
    }
    
    // Create sales receipt in QuickBooks
    const salesReceiptPayload = {
      Line: [
        {
          Amount: payment.amount,
          DetailType: 'SalesItemLineDetail',
          SalesItemLineDetail: {
            ItemRef: {
              value: incomeAccountId
            },
            TaxCodeRef: {
              value: 'NON'
            }
          },
          Description: description
        }
      ],
      CustomerRef: {
        name: customerName
      },
      PaymentMethodRef: {
        value: payment.paymentMethod === 'cash' ? '1' : '2' // 1 for Cash, 2 for Check (simplified)
      },
      DepositToAccountRef: {
        value: depositAccountId
      },
      DocNumber: payment.receiptNumber,
      TxnDate: payment.paymentDate.toISOString().split('T')[0]
    };
    
    // Create the sales receipt in QuickBooks
    const response = await new Promise((resolve, reject) => {
      qbo.createSalesReceipt(salesReceiptPayload, (err, salesReceipt) => {
        if (err) {
          reject(err);
        } else {
          resolve(salesReceipt);
        }
      });
    });
    
    // Update payment with QuickBooks information
    payment.quickbooksInfo = {
      id: response.Id,
      documentNumber: response.DocNumber,
      syncStatus: 'synced',
      lastSyncDate: new Date()
    };
    await payment.save();
    
    return {
      success: true,
      message: 'Payment synced to QuickBooks successfully',
      id: response.Id
    };
  } catch (error) {
    console.error('Error syncing payment to QuickBooks:', error);
    
    // Update payment with error information
    payment.quickbooksInfo = {
      ...payment.quickbooksInfo,
      syncStatus: 'failed',
      syncError: error.message,
      lastSyncDate: new Date()
    };
    await payment.save();
    
    throw error;
  }
};

/**
 * Helper function to sync multiple payments to QuickBooks
 * @param {Array} payments - The payments to sync
 * @param {Object} config - The QuickBooks configuration
 */
const syncPaymentsToQuickbooks = async (payments, config) => {
  try {
    // Process payments in batches to avoid overwhelming the API
    const batchSize = 10;
    const batches = [];
    
    for (let i = 0; i < payments.length; i += batchSize) {
      batches.push(payments.slice(i, i + batchSize));
    }
    
    let successCount = 0;
    let failureCount = 0;
    
    // Process each batch sequentially
    for (const batch of batches) {
      const promises = batch.map(payment => {
        return syncPaymentToQuickbooks(payment, config)
          .then(() => {
            successCount++;
            return true;
          })
          .catch(error => {
            failureCount++;
            console.error(`Failed to sync payment ${payment._id}:`, error);
            return false;
          });
      });
      
      // Wait for the current batch to complete before moving to the next
      await Promise.all(promises);
      
      // Add a small delay between batches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Update the sync status in the config
    config.syncSettings.lastSyncStatus = 'completed';
    config.lastSyncDate = new Date();
    await config.save();
    
    console.log(`Sync completed. Success: ${successCount}, Failures: ${failureCount}`);
  } catch (error) {
    console.error('Error in batch sync process:', error);
    
    // Update the sync status in the config
    config.syncSettings.lastSyncStatus = 'failed';
    await config.save();
  }
};

module.exports = {
  getTransactions,
  syncAllTransactions,
  syncTransaction
};
