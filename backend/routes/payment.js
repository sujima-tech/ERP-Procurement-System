const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const PurchaseOrder = require('../models/PurchaseOrder');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// @GET /api/payments
router.get('/', protect, async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('purchaseOrder', 'poNumber totalAmount')
      .populate('vendor', 'name email')
      .populate('paidBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/payments/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('purchaseOrder')
      .populate('vendor', 'name email phone')
      .populate('paidBy', 'name email');
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/payments — finance records payment
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { purchaseOrder, vendor, amount, method, referenceNumber, notes } = req.body;

    const payment = await Payment.create({
      purchaseOrder,
      vendor,
      amount,
      method,
      referenceNumber,
      notes,
      paidBy: req.user._id,
      status: 'paid',
      paidAt: new Date(),
    });

    // Mark PO as paid and close
    await PurchaseOrder.findByIdAndUpdate(purchaseOrder, { status: 'paid' });

    const populated = await Payment.findById(payment._id)
      .populate('vendor', 'name email')
      .populate('purchaseOrder', 'poNumber totalAmount');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @GET /api/payments/stats/summary — finance summary
router.get('/stats/summary', protect, authorize('admin'), async (req, res) => {
  try {
    const totalPaid = await Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    const pending = await PurchaseOrder.countDocuments({ status: { $in: ['delivered', 'confirmed'] } });
    res.json({
      success: true,
      data: {
        totalPaid: totalPaid[0]?.total || 0,
        paymentCount: totalPaid[0]?.count || 0,
        pendingPayments: pending,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
