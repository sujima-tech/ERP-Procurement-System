const mongoose = require('mongoose');

const QuoteItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  unitPrice: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true },
  deliveryDays: { type: Number, required: true, min: 1 },
  totalPrice: { type: Number },
  notes: { type: String },
});

const QuoteSchema = new mongoose.Schema({
  rfq: { type: mongoose.Schema.Types.ObjectId, ref: 'RFQ', required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [QuoteItemSchema],
  validUntil: { type: Date },
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'accepted', 'rejected'],
    default: 'submitted'
  },
  remarks: { type: String },
  aiScore: { type: Number, default: null }, // stored after AI evaluation
}, { timestamps: true });

// Auto-calculate total price per item
QuoteSchema.pre('save', function (next) {
  this.items.forEach(item => {
    item.totalPrice = item.unitPrice * item.quantity;
  });
  next();
});

module.exports = mongoose.model('Quote', QuoteSchema);
