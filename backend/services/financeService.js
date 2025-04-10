const mongoose = require('mongoose');
const FeeStructure = require('../models/FeeStructure');
const StudentFee = require('../models/StudentFee');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const Class = require('../models/Class');
const quickbooksService = require('./quickbooksService');

/**
 * Finance Service
 * Handles financial operations like fee management and payments
 */
class FinanceService {
  /**
   * Create a fee structure
   * @param {Object} feeData - Fee structure data
   * @param {Object} user - User creating the fee structure
   */
  async createFeeStructure(feeData, user) {
    const session = await mongoose.startSession();
    session.startTransaction({
      readPreference: 'primary',
      readConcern: { level: 'local' },
      writeConcern: { w: 'majority' }
    });

    try {
      // Calculate total amount from fee components
      const totalAmount = feeData.feeComponents.reduce((sum, component) => sum + component.amount, 0);

      // Create fee structure
      const feeStructure = new FeeStructure({
        name: feeData.name,
        academicYear: feeData.academicYear,
        class: feeData.class,
        feeComponents: feeData.feeComponents,
        totalAmount,
        createdBy: user.userId,
        status: feeData.status || 'draft'
      });

      await feeStructure.save({ session });

      // If fee structure is active, assign it to all students in the class
      if (feeData.status === 'active') {
        await this.assignFeeStructureToStudents(feeStructure, user.userId, session);
      }

      await session.commitTransaction();
      return feeStructure;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Update a fee structure
   * @param {string} feeStructureId - Fee structure ID
   * @param {Object} feeData - Updated fee structure data
   * @param {Object} user - User updating the fee structure
   */
  async updateFeeStructure(feeStructureId, feeData, user) {
    const session = await mongoose.startSession();
    session.startTransaction({
      readPreference: 'primary',
      readConcern: { level: 'local' },
      writeConcern: { w: 'majority' }
    });

    try {
      // Find existing fee structure
      const feeStructure = await FeeStructure.findById(feeStructureId).session(session).read('primary');
      if (!feeStructure) {
        throw new Error('Fee structure not found');
      }

      // Calculate total amount from fee components
      const totalAmount = feeData.feeComponents.reduce((sum, component) => sum + component.amount, 0);

      // Update fee structure
      feeStructure.name = feeData.name;
      feeStructure.feeComponents = feeData.feeComponents;
      feeStructure.totalAmount = totalAmount;
      feeStructure.updatedBy = user.userId;
      feeStructure.status = feeData.status || feeStructure.status;

      await feeStructure.save({ session });

      // If status changed to active, assign fee structure to students
      if (feeStructure.status === 'active' && feeData.status === 'active') {
        await this.assignFeeStructureToStudents(feeStructure, user.userId, session);
      }

      await session.commitTransaction();
      return feeStructure;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Assign fee structure to a single student
   * @param {string} studentId - Student ID
   * @param {string} feeStructureId - Fee structure ID
   * @param {Object} user - User object
   * @returns {Object} - Created student fee
   */
  async assignFeeStructureToStudent(studentId, feeStructureId, user) {
    const session = await mongoose.startSession();
    session.startTransaction({
      readPreference: 'primary',
      readConcern: { level: 'local' },
      writeConcern: { w: 'majority' }
    });

    try {
      // Find the fee structure
      const feeStructure = await FeeStructure.findById(feeStructureId)
        .session(session)
        .read('primary');

      if (!feeStructure) {
        throw new Error('Fee structure not found');
      }

      if (feeStructure.status !== 'active') {
        throw new Error('Only active fee structures can be assigned to students');
      }

      // Find the student
      const student = await Student.findById(studentId)
        .session(session)
        .read('primary');

      if (!student) {
        throw new Error('Student not found');
      }

      // Check if student already has a fee for this academic year
      const existingFee = await StudentFee.findOne({
        student: studentId,
        academicYear: feeStructure.academicYear
      })
        .session(session)
        .read('primary');

      if (existingFee) {
        throw new Error('Student already has a fee structure assigned for this academic year');
      }

      // Create student fee
      const feeComponents = feeStructure.feeComponents.map(component => ({
        name: component.name,
        amount: component.amount,
        description: component.description,
        isOptional: component.isOptional,
        amountPaid: 0,
        balance: component.amount,
        status: 'pending'
      }));

      const totalAmount = feeComponents.reduce((sum, component) => sum + component.amount, 0);

      const studentFee = new StudentFee({
        student: studentId,
        feeStructure: feeStructureId,
        academicYear: feeStructure.academicYear,
        class: student.class,
        feeComponents,
        totalAmount,
        amountPaid: 0,
        balance: totalAmount,
        status: 'pending',
        dueDate: new Date(new Date().getFullYear(), 11, 31), // Default to end of year
        createdBy: user.userId,
        updatedBy: user.userId
      });

      await studentFee.save({ session });

      await session.commitTransaction();
      session.endSession();

      return studentFee;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Assign fee structure to all students in a class
   * @param {Object} feeStructure - Fee structure
   * @param {string} userId - User ID
   * @param {Object} session - Mongoose session
   */
  async assignFeeStructureToStudents(feeStructure, userId, session) {
    // Find all students in the class
    const students = await Student.find({
      class: feeStructure.class,
      status: 'active'
    }).session(session).read('primary');

    // Create student fees for each student
    const studentFees = [];
    for (const student of students) {
      // Check if student already has a fee for this academic year
      const existingFee = await StudentFee.findOne({
        student: student._id,
        academicYear: feeStructure.academicYear
      }).session(session).read('primary');

      if (!existingFee) {
        // Create fee components with balance
        const feeComponents = feeStructure.feeComponents.map(component => ({
          name: component.name,
          amount: component.amount,
          amountPaid: 0,
          balance: component.amount,
          dueDate: component.dueDate,
          status: 'pending',
          quickbooksAccountId: component.quickbooksAccountId
        }));

        // Create student fee
        const studentFee = new StudentFee({
          student: student._id,
          feeStructure: feeStructure._id,
          academicYear: feeStructure.academicYear,
          class: feeStructure.class,
          totalAmount: feeStructure.totalAmount,
          amountPaid: 0,
          balance: feeStructure.totalAmount,
          dueDate: feeStructure.feeComponents[0]?.dueDate || new Date(),
          status: 'pending',
          feeComponents,
          createdBy: userId
        });

        await studentFee.save({ session });
        studentFees.push(studentFee);

        // Sync with QuickBooks if integration is enabled
        try {
          const isQBInitialized = await quickbooksService.initialize();
          if (isQBInitialized) {
            // Create customer in QuickBooks
            const customer = await quickbooksService.createCustomer(student);

            // Create invoice in QuickBooks
            const invoice = await quickbooksService.createInvoice(studentFee, customer);

            // Update student fee with QuickBooks invoice ID
            studentFee.quickbooksInvoiceId = invoice.Id;
            await studentFee.save({ session });
          }
        } catch (error) {
          console.error('Error syncing with QuickBooks:', error);
          // Continue without failing the transaction
        }
      }
    }

    return studentFees;
  }

  /**
   * Record a payment
   * @param {Object} paymentData - Payment data
   * @param {Object} user - User recording the payment
   */
  async recordPayment(paymentData, user) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find student fee
      const studentFee = await StudentFee.findById(paymentData.studentFee).session(session);
      if (!studentFee) {
        throw new Error('Student fee not found');
      }

      // Validate payment amount
      if (paymentData.amount <= 0) {
        throw new Error('Payment amount must be greater than zero');
      }

      if (paymentData.amount > studentFee.balance) {
        throw new Error('Payment amount exceeds remaining balance');
      }

      // Generate reference and receipt numbers
      const referenceNumber = this.generateReferenceNumber();
      const receiptNumber = this.generateReceiptNumber();

      // Create payment record
      const payment = new Payment({
        student: studentFee.student,
        studentFee: studentFee._id,
        academicYear: studentFee.academicYear,
        amount: paymentData.amount,
        paymentDate: paymentData.paymentDate || new Date(),
        paymentMethod: paymentData.paymentMethod,
        referenceNumber,
        receiptNumber,
        description: paymentData.description,
        feeComponentPayments: paymentData.feeComponentPayments || [],
        status: 'completed',
        receivedBy: user.userId
      });

      await payment.save({ session });

      // Update student fee
      studentFee.amountPaid += paymentData.amount;
      studentFee.balance -= paymentData.amount;

      // Update fee components if specified
      if (paymentData.feeComponentPayments && paymentData.feeComponentPayments.length > 0) {
        for (const componentPayment of paymentData.feeComponentPayments) {
          const component = studentFee.feeComponents.find(c => c._id.toString() === componentPayment.feeComponentId);
          if (component) {
            component.amountPaid += componentPayment.amount;
            component.balance -= componentPayment.amount;

            // Update component status
            if (component.balance === 0) {
              component.status = 'paid';
            } else if (component.amountPaid > 0) {
              component.status = 'partial';
            }
          }
        }
      } else {
        // Distribute payment to fee components proportionally
        const remainingBalance = studentFee.balance + paymentData.amount;
        const paymentRatio = paymentData.amount / remainingBalance;

        for (const component of studentFee.feeComponents) {
          const componentPayment = Math.min(component.balance, component.balance * paymentRatio);
          component.amountPaid += componentPayment;
          component.balance -= componentPayment;

          // Update component status
          if (component.balance === 0) {
            component.status = 'paid';
          } else if (component.amountPaid > 0) {
            component.status = 'partial';
          }
        }
      }

      await studentFee.save({ session });

      // Sync with QuickBooks if integration is enabled
      try {
        const isQBInitialized = await quickbooksService.initialize();
        if (isQBInitialized && studentFee.quickbooksInvoiceId) {
          // Get invoice from QuickBooks
          const invoice = await quickbooksService.getInvoice(studentFee.quickbooksInvoiceId);

          // Record payment in QuickBooks
          const qbPayment = await quickbooksService.recordPayment(payment, invoice);

          // Update payment with QuickBooks payment ID
          payment.quickbooksPaymentId = qbPayment.Id;
          payment.quickbooksSyncStatus = 'synced';
          await payment.save({ session });
        }
      } catch (error) {
        console.error('Error syncing payment with QuickBooks:', error);
        payment.quickbooksSyncStatus = 'failed';
        payment.quickbooksSyncError = error.message;
        await payment.save({ session });
        // Continue without failing the transaction
      }

      await session.commitTransaction();
      return payment;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Generate a unique reference number
   */
  generateReferenceNumber() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `REF-${timestamp.substr(-6)}-${random}`;
  }

  /**
   * Generate a unique receipt number
   */
  generateReceiptNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `RCT-${year}${month}${day}-${random}`;
  }

  /**
   * Get student fee details
   * @param {string} studentId - Student ID
   * @param {string} academicYearId - Academic year ID
   */
  async getStudentFeeDetails(studentId, academicYearId) {
    // Find student fee
    const studentFee = await StudentFee.findOne({
      student: studentId,
      academicYear: academicYearId
    })
      .populate('student', 'firstName lastName admissionNumber')
      .populate('class', 'name section stream')
      .populate('academicYear', 'name year')
      .populate('feeStructure', 'name');

    if (!studentFee) {
      throw new Error('Student fee not found');
    }

    // Find payments for this fee
    const payments = await Payment.find({
      student: studentId,
      academicYear: academicYearId
    })
      .sort({ paymentDate: -1 })
      .populate('receivedBy', 'username');

    return {
      studentFee,
      payments
    };
  }

  /**
   * Get fee payment status for a class
   * @param {string} classId - Class ID
   * @param {string} academicYearId - Academic year ID
   */
  async getClassFeeStatus(classId, academicYearId) {
    // Find all students in the class
    const students = await Student.find({
      class: classId,
      status: 'active'
    });

    // Find fee structure for the class
    const feeStructure = await FeeStructure.findOne({
      class: classId,
      academicYear: academicYearId,
      status: 'active'
    });

    if (!feeStructure) {
      throw new Error('No active fee structure found for this class');
    }

    // Find student fees for all students
    const studentFees = await StudentFee.find({
      class: classId,
      academicYear: academicYearId
    })
      .populate('student', 'firstName lastName admissionNumber')
      .sort({ 'student.firstName': 1, 'student.lastName': 1 });

    // Calculate class statistics
    const totalStudents = students.length;
    const totalFees = feeStructure.totalAmount * totalStudents;
    const totalPaid = studentFees.reduce((sum, fee) => sum + fee.amountPaid, 0);
    const totalBalance = totalFees - totalPaid;
    const paymentPercentage = totalFees > 0 ? (totalPaid / totalFees) * 100 : 0;

    // Group students by payment status
    const fullyPaid = studentFees.filter(fee => fee.status === 'paid').length;
    const partiallyPaid = studentFees.filter(fee => fee.status === 'partial').length;
    const pending = studentFees.filter(fee => fee.status === 'pending').length;
    const overdue = studentFees.filter(fee => fee.status === 'overdue').length;

    return {
      classDetails: {
        totalStudents,
        totalFees,
        totalPaid,
        totalBalance,
        paymentPercentage,
        fullyPaid,
        partiallyPaid,
        pending,
        overdue
      },
      feeStructure,
      studentFees
    };
  }

  /**
   * Generate financial reports
   * @param {Object} reportParams - Report parameters
   */
  async generateFinancialReport(reportParams) {
    const { reportType, startDate, endDate, academicYearId, classId } = reportParams;

    // Convert string dates to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Set to end of day

    let report = {};

    switch (reportType) {
      case 'payment_collection':
        report = await this.generatePaymentCollectionReport(start, end, academicYearId, classId);
        break;
      case 'fee_balance':
        report = await this.generateFeeBalanceReport(academicYearId, classId);
        break;
      case 'payment_method':
        report = await this.generatePaymentMethodReport(start, end, academicYearId);
        break;
      case 'financial_summary':
        report = await this.generateFinancialSummaryReport(start, end, academicYearId);
        break;
      default:
        throw new Error('Invalid report type');
    }

    return report;
  }

  /**
   * Generate payment collection report
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} academicYearId - Academic year ID
   * @param {string} classId - Class ID (optional)
   */
  async generatePaymentCollectionReport(startDate, endDate, academicYearId, classId) {
    // Build query
    const query = {
      paymentDate: { $gte: startDate, $lte: endDate },
      academicYear: academicYearId,
      status: 'completed'
    };

    if (classId) {
      // Find all students in the class
      const students = await Student.find({ class: classId }).select('_id');
      const studentIds = students.map(student => student._id);

      // Add student filter to query
      query.student = { $in: studentIds };
    }

    // Get payments
    const payments = await Payment.find(query)
      .populate('student', 'firstName lastName admissionNumber')
      .populate({
        path: 'studentFee',
        populate: {
          path: 'class',
          select: 'name section stream'
        }
      })
      .sort({ paymentDate: 1 });

    // Calculate totals
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);

    // Group by date
    const paymentsByDate = {};
    for (const payment of payments) {
      const dateKey = payment.paymentDate.toISOString().split('T')[0];
      if (!paymentsByDate[dateKey]) {
        paymentsByDate[dateKey] = {
          date: dateKey,
          amount: 0,
          count: 0
        };
      }

      paymentsByDate[dateKey].amount += payment.amount;
      paymentsByDate[dateKey].count += 1;
    }

    // Group by payment method
    const paymentsByMethod = {};
    for (const payment of payments) {
      const method = payment.paymentMethod;
      if (!paymentsByMethod[method]) {
        paymentsByMethod[method] = {
          method,
          amount: 0,
          count: 0
        };
      }

      paymentsByMethod[method].amount += payment.amount;
      paymentsByMethod[method].count += 1;
    }

    return {
      reportType: 'payment_collection',
      startDate,
      endDate,
      totalAmount,
      totalPayments: payments.length,
      paymentsByDate: Object.values(paymentsByDate),
      paymentsByMethod: Object.values(paymentsByMethod),
      payments
    };
  }

  /**
   * Generate fee balance report
   * @param {string} academicYearId - Academic year ID
   * @param {string} classId - Class ID (optional)
   */
  async generateFeeBalanceReport(academicYearId, classId) {
    // Build query
    const query = {
      academicYear: academicYearId
    };

    if (classId) {
      query.class = classId;
    }

    // Get student fees
    const studentFees = await StudentFee.find(query)
      .populate('student', 'firstName lastName admissionNumber')
      .populate('class', 'name section stream')
      .sort({ balance: -1 });

    // Calculate totals
    const totalAmount = studentFees.reduce((sum, fee) => sum + fee.totalAmount, 0);
    const totalPaid = studentFees.reduce((sum, fee) => sum + fee.amountPaid, 0);
    const totalBalance = studentFees.reduce((sum, fee) => sum + fee.balance, 0);

    // Group by class
    const balanceByClass = {};
    for (const fee of studentFees) {
      const classId = fee.class._id.toString();
      const className = `${fee.class.name} ${fee.class.section || ''} ${fee.class.stream || ''}`.trim();

      if (!balanceByClass[classId]) {
        balanceByClass[classId] = {
          classId,
          className,
          totalAmount: 0,
          amountPaid: 0,
          balance: 0,
          count: 0
        };
      }

      balanceByClass[classId].totalAmount += fee.totalAmount;
      balanceByClass[classId].amountPaid += fee.amountPaid;
      balanceByClass[classId].balance += fee.balance;
      balanceByClass[classId].count += 1;
    }

    // Group by status
    const balanceByStatus = {
      paid: { status: 'paid', count: 0, totalAmount: 0, amountPaid: 0, balance: 0 },
      partial: { status: 'partial', count: 0, totalAmount: 0, amountPaid: 0, balance: 0 },
      pending: { status: 'pending', count: 0, totalAmount: 0, amountPaid: 0, balance: 0 },
      overdue: { status: 'overdue', count: 0, totalAmount: 0, amountPaid: 0, balance: 0 }
    };

    for (const fee of studentFees) {
      balanceByStatus[fee.status].count += 1;
      balanceByStatus[fee.status].totalAmount += fee.totalAmount;
      balanceByStatus[fee.status].amountPaid += fee.amountPaid;
      balanceByStatus[fee.status].balance += fee.balance;
    }

    return {
      reportType: 'fee_balance',
      academicYearId,
      totalAmount,
      totalPaid,
      totalBalance,
      paymentPercentage: totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0,
      balanceByClass: Object.values(balanceByClass),
      balanceByStatus: Object.values(balanceByStatus),
      studentFees
    };
  }

  /**
   * Generate payment method report
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} academicYearId - Academic year ID
   */
  async generatePaymentMethodReport(startDate, endDate, academicYearId) {
    // Build query
    const query = {
      paymentDate: { $gte: startDate, $lte: endDate },
      academicYear: academicYearId,
      status: 'completed'
    };

    // Get payments
    const payments = await Payment.find(query)
      .populate('receivedBy', 'username')
      .sort({ paymentDate: 1 });

    // Group by payment method
    const paymentsByMethod = {};
    for (const payment of payments) {
      const method = payment.paymentMethod;
      if (!paymentsByMethod[method]) {
        paymentsByMethod[method] = {
          method,
          amount: 0,
          count: 0
        };
      }

      paymentsByMethod[method].amount += payment.amount;
      paymentsByMethod[method].count += 1;
    }

    // Group by receiver
    const paymentsByReceiver = {};
    for (const payment of payments) {
      const receiverId = payment.receivedBy ? payment.receivedBy._id.toString() : 'system';
      const receiverName = payment.receivedBy ? payment.receivedBy.username : 'System';

      if (!paymentsByReceiver[receiverId]) {
        paymentsByReceiver[receiverId] = {
          receiverId,
          receiverName,
          amount: 0,
          count: 0
        };
      }

      paymentsByReceiver[receiverId].amount += payment.amount;
      paymentsByReceiver[receiverId].count += 1;
    }

    return {
      reportType: 'payment_method',
      startDate,
      endDate,
      totalAmount: payments.reduce((sum, payment) => sum + payment.amount, 0),
      totalPayments: payments.length,
      paymentsByMethod: Object.values(paymentsByMethod),
      paymentsByReceiver: Object.values(paymentsByReceiver)
    };
  }

  /**
   * Generate financial summary report
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} academicYearId - Academic year ID
   */
  async generateFinancialSummaryReport(startDate, endDate, academicYearId) {
    // Get fee collection data
    const collectionReport = await this.generatePaymentCollectionReport(startDate, endDate, academicYearId);

    // Get fee balance data
    const balanceReport = await this.generateFeeBalanceReport(academicYearId);

    // Get payment method data
    const methodReport = await this.generatePaymentMethodReport(startDate, endDate, academicYearId);

    // Calculate additional metrics
    const totalStudents = balanceReport.studentFees.length;
    const fullyPaidStudents = balanceReport.studentFees.filter(fee => fee.status === 'paid').length;
    const partiallyPaidStudents = balanceReport.studentFees.filter(fee => fee.status === 'partial').length;
    const pendingStudents = balanceReport.studentFees.filter(fee => fee.status === 'pending').length;
    const overdueStudents = balanceReport.studentFees.filter(fee => fee.status === 'overdue').length;

    // Calculate collection rate
    const collectionRate = balanceReport.totalAmount > 0 ?
      (balanceReport.totalPaid / balanceReport.totalAmount) * 100 : 0;

    // Calculate average payment amount
    const avgPaymentAmount = collectionReport.totalPayments > 0 ?
      collectionReport.totalAmount / collectionReport.totalPayments : 0;

    // Calculate average fee per student
    const avgFeePerStudent = totalStudents > 0 ?
      balanceReport.totalAmount / totalStudents : 0;

    // Calculate average balance per student
    const avgBalancePerStudent = totalStudents > 0 ?
      balanceReport.totalBalance / totalStudents : 0;

    return {
      reportType: 'financial_summary',
      startDate,
      endDate,
      academicYearId,

      // Fee statistics
      totalFees: balanceReport.totalAmount,
      totalCollected: balanceReport.totalPaid,
      totalBalance: balanceReport.totalBalance,
      collectionRate,

      // Student statistics
      totalStudents,
      fullyPaidStudents,
      partiallyPaidStudents,
      pendingStudents,
      overdueStudents,

      // Payment statistics
      totalPayments: collectionReport.totalPayments,
      avgPaymentAmount,
      avgFeePerStudent,
      avgBalancePerStudent,

      // Payment methods
      paymentMethods: methodReport.paymentsByMethod,

      // Class breakdown
      classSummary: balanceReport.balanceByClass
    };
  }
}

// Create a singleton instance
const financeService = new FinanceService();

module.exports = financeService;
