const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  amount: { type: Number, required: true },
  method: {
    type: String,
    enum: ['bank_transfer', 'cheque', 'cash', 'upi', 'online'],
    default: 'bank_transfer'
  },
  referenceNumber: { type: String },
  paidAt: { type: Date, default: Date.now },
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed'],
    default: 'pending'
  },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
