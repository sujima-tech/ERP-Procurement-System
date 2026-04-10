/**
 * Database Seeder
 * Auto-creates all collections and populates with demo data
 * Run: node seed/seed.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' });

const User         = require('../models/User');
const Product      = require('../models/Product');
const Vendor       = require('../models/Vendor');
const RFQ          = require('../models/RFQ');
const Quote        = require('../models/Quote');
const PurchaseOrder = require('../models/PurchaseOrder');
const Delivery     = require('../models/Delivery');
const Payment      = require('../models/Payment');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/erp_procurement';

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB — erp_procurement @ localhost:27017');

    // Clear all collections
    console.log('🗑  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Vendor.deleteMany({}),
      RFQ.deleteMany({}),
      Quote.deleteMany({}),
      PurchaseOrder.deleteMany({}),
      Delivery.deleteMany({}),
      Payment.deleteMany({}),
    ]);

    // ─── 1. Products ────────────────────────────────────────────────
    console.log('📦 Seeding Products...');
    const products = await Product.insertMany([
      { name: 'Laptop Dell XPS 15',    sku: 'LAP-001', category: 'Electronics',  unit: 'pcs',  description: 'High-performance laptop', currentStock: 5,  reorderLevel: 3 },
      { name: 'Office Chair Ergonomic',sku: 'FUR-002', category: 'Furniture',    unit: 'pcs',  description: 'Adjustable ergonomic chair', currentStock: 12, reorderLevel: 5 },
      { name: 'A4 Paper Ream 500',     sku: 'STA-003', category: 'Stationery',   unit: 'ream', description: '80gsm A4 paper', currentStock: 200, reorderLevel: 50 },
      { name: 'Projector Epson EB-X',  sku: 'ELC-004', category: 'Electronics',  unit: 'pcs',  description: 'Business projector 3600 lumens', currentStock: 2,  reorderLevel: 1 },
      { name: 'Standing Desk Premium', sku: 'FUR-005', category: 'Furniture',    unit: 'pcs',  description: 'Height-adjustable desk', currentStock: 4,  reorderLevel: 2 },
    ]);
    console.log(`   ✓ ${products.length} products created`);

    // ─── 2. Vendors ─────────────────────────────────────────────────
    console.log('🏢 Seeding Vendors...');
    const vendors = await Vendor.insertMany([
      { name: 'TechSupply Co.',    email: 'vendor1@techsupply.com',   phone: '9876543210', address: 'Chennai, TN',    category: 'Electronics', rating: 4.5, contactPerson: 'Ravi Kumar' },
      { name: 'OfficeWorld Pvt.',  email: 'vendor2@officeworld.com',  phone: '9876543211', address: 'Bangalore, KA', category: 'Furniture',   rating: 3.8, contactPerson: 'Priya Sharma' },
      { name: 'StationeryHub',     email: 'vendor3@stationeryhub.com',phone: '9876543212', address: 'Mumbai, MH',    category: 'Stationery',  rating: 4.2, contactPerson: 'Ankit Joshi' },
      { name: 'GlobalTech Imports',email: 'vendor4@globaltech.com',   phone: '9876543213', address: 'Delhi, DL',     category: 'Electronics', rating: 4.0, contactPerson: 'Mehta Patel' },
      { name: 'FurnitureZone',     email: 'vendor5@furniturezone.com',phone: '9876543214', address: 'Pune, MH',      category: 'Furniture',   rating: 3.5, contactPerson: 'Sara Ali' },
    ]);
    console.log(`   ✓ ${vendors.length} vendors created`);

    // ─── 3. Users ───────────────────────────────────────────────────
    console.log('👤 Seeding Users...');
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@erp.com',
      password: 'admin123',
      role: 'admin',
    });

    const vendorUsers = await Promise.all([
      User.create({ name: 'TechSupply Rep',   email: 'vendor1@techsupply.com',    password: 'vendor123', role: 'vendor', vendorId: vendors[0]._id }),
      User.create({ name: 'OfficeWorld Rep',  email: 'vendor2@officeworld.com',   password: 'vendor123', role: 'vendor', vendorId: vendors[1]._id }),
      User.create({ name: 'StationeryHub Rep',email: 'vendor3@stationeryhub.com', password: 'vendor123', role: 'vendor', vendorId: vendors[2]._id }),
      User.create({ name: 'GlobalTech Rep',   email: 'vendor4@globaltech.com',    password: 'vendor123', role: 'vendor', vendorId: vendors[3]._id }),
      User.create({ name: 'FurnitureZone Rep',email: 'vendor5@furniturezone.com', password: 'vendor123', role: 'vendor', vendorId: vendors[4]._id }),
    ]);
    console.log(`   ✓ 1 admin + ${vendorUsers.length} vendor users created`);

    // ─── 4. Sample RFQ ─────────────────────────────────────────────
    console.log('📋 Seeding Sample RFQ...');
    const rfq = await RFQ.create({
      title: 'Q2 2026 Office Equipment Procurement',
      description: 'Quarterly procurement for IT and office furniture',
      createdBy: adminUser._id,
      items: [
        { product: products[0]._id, quantity: 10, unit: 'pcs', specifications: 'Intel i7, 16GB RAM, 512GB SSD' },
        { product: products[1]._id, quantity: 20, unit: 'pcs', specifications: 'Lumbar support, adjustable armrests' },
        { product: products[2]._id, quantity: 100, unit: 'ream', specifications: '80gsm, white' },
      ],
      vendors: [vendors[0]._id, vendors[1]._id, vendors[2]._id, vendors[3]._id],
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'quotes_received',
    });
    console.log(`   ✓ RFQ created: ${rfq.rfqNumber}`);

    // ─── 5. Sample Quotes ───────────────────────────────────────────
    console.log('💬 Seeding Sample Quotes...');
    await Quote.create({
      rfq: rfq._id,
      vendor: vendors[0]._id,
      submittedBy: vendorUsers[0]._id,
      items: [
        { product: products[0]._id, unitPrice: 85000, quantity: 10, deliveryDays: 5 },
        { product: products[1]._id, unitPrice: 12000, quantity: 20, deliveryDays: 7 },
      ],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      remarks: 'Best prices with fast delivery',
    });

    await Quote.create({
      rfq: rfq._id,
      vendor: vendors[3]._id,
      submittedBy: vendorUsers[3]._id,
      items: [
        { product: products[0]._id, unitPrice: 82000, quantity: 10, deliveryDays: 8 },
        { product: products[2]._id, unitPrice: 320,   quantity: 100, deliveryDays: 3 },
      ],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      remarks: 'Competitive pricing for electronics',
    });

    await Quote.create({
      rfq: rfq._id,
      vendor: vendors[1]._id,
      submittedBy: vendorUsers[1]._id,
      items: [
        { product: products[1]._id, unitPrice: 11500, quantity: 20, deliveryDays: 5 },
        { product: products[2]._id, unitPrice: 340,   quantity: 100, deliveryDays: 4 },
      ],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      remarks: 'Premium furniture specialist',
    });
    console.log('   ✓ 3 quotes created');

    // ─── Summary ────────────────────────────────────────────────────
    console.log('\n🎉 DATABASE SEEDED SUCCESSFULLY!');
    console.log('━'.repeat(50));
    console.log('📊 Collections created in MongoDB Compass:');
    console.log('   • users          (6 documents)');
    console.log('   • products       (5 documents)');
    console.log('   • vendors        (5 documents)');
    console.log('   • rfqs           (1 document)');
    console.log('   • quotes         (3 documents)');
    console.log('   • purchaseorders (0 — generated via UI)');
    console.log('   • deliveries     (0 — recorded via UI)');
    console.log('   • payments       (0 — recorded via UI)');
    console.log('━'.repeat(50));
    console.log('🔑 Login Credentials:');
    console.log('   Admin  → admin@erp.com       / admin123');
    console.log('   Vendor → vendor1@techsupply.com / vendor123');
    console.log('   Vendor → vendor2@officeworld.com / vendor123');
    console.log('━'.repeat(50));

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed Error:', err.message);
    process.exit(1);
  }
};

seed();
