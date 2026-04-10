const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String },
  address: { type: String },
  category: { type: String }, // type of goods/services
  rating: { type: Number, default: 3, min: 1, max: 5 },
  totalOrders: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  contactPerson: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Vendor', VendorSchema);
