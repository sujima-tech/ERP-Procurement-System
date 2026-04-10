const mongoose = require('mongoose');

const POItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number },
  deliveryDays: { type: Number },
  aiScore: { type: Number },
});

const PurchaseOrderSchema = new mongoose.Schema({
  poNumber: { type: String, unique: true },
  rfq: { type: mongoose.Schema.Types.ObjectId, ref: 'RFQ', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [POItemSchema],
  totalAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_delivery', 'delivered', 'paid', 'cancelled'],
    default: 'pending'
  },
  expectedDelivery: { type: Date },
  terms: { type: String, default: 'Net 30' },
  notes: { type: String },
}, { timestamps: true });

// Auto-generate PO number & total
PurchaseOrderSchema.pre('save', async function (next) {
  if (!this.poNumber) {
    const count = await mongoose.model('PurchaseOrder').countDocuments();
    this.poNumber = `PO-${String(count + 1).padStart(4, '0')}-${new Date().getFullYear()}`;
  }
  this.items.forEach(item => { item.totalPrice = item.unitPrice * item.quantity; });
  this.totalAmount = this.items.reduce((sum, i) => sum + (i.totalPrice || 0), 0);
  next();
});

module.exports = mongoose.model('PurchaseOrder', PurchaseOrderSchema);
