const mongoose = require('mongoose');

const RFQItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  unit: { type: String, default: 'pcs' },
  specifications: { type: String },
});

const RFQSchema = new mongoose.Schema({
  rfqNumber: { type: String, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [RFQItemSchema],
  vendors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }], // selected vendors
  deadline: { type: Date, required: true },
  status: {
    type: String,
    enum: ['draft', 'sent', 'quotes_received', 'evaluated', 'po_generated', 'closed'],
    default: 'draft'
  },
  notes: { type: String },
}, { timestamps: true });

// Auto-generate RFQ number
RFQSchema.pre('save', async function (next) {
  if (!this.rfqNumber) {
    const count = await mongoose.model('RFQ').countDocuments();
    this.rfqNumber = `RFQ-${String(count + 1).padStart(4, '0')}-${new Date().getFullYear()}`;
  }
  next();
});

module.exports = mongoose.model('RFQ', RFQSchema);
