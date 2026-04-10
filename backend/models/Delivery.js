const mongoose = require('mongoose');

const DeliveryItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  orderedQty: { type: Number },
  receivedQty: { type: Number, required: true },
  condition: { type: String, enum: ['good', 'damaged', 'partial'], default: 'good' },
});

const DeliverySchema = new mongoose.Schema({
  purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  deliveredAt: { type: Date, default: Date.now },
  receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [DeliveryItemSchema],
  status: {
    type: String,
    enum: ['pending', 'in_transit', 'delivered', 'rejected'],
    default: 'pending'
  },
  warehouseLocation: { type: String },
  notes: { type: String },
  inventoryUpdated: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Delivery', DeliverySchema);
