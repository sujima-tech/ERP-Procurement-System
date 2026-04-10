const express = require('express');
const router = express.Router();
const PurchaseOrder = require('../models/PurchaseOrder');
const RFQ = require('../models/RFQ');
const Vendor = require('../models/Vendor');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// @GET /api/po
router.get('/', protect, async (req, res) => {
  try {
    const pos = await PurchaseOrder.find()
      .populate('rfq', 'rfqNumber title')
      .populate('items.product', 'name sku')
      .populate('items.vendor', 'name email')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: pos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/po/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id)
      .populate('rfq', 'rfqNumber title')
      .populate('items.product', 'name sku unit')
      .populate('items.vendor', 'name email phone contactPerson')
      .populate('createdBy', 'name email');
    if (!po) return res.status(404).json({ success: false, message: 'PO not found' });
    res.json({ success: true, data: po });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/po — admin generates PO from AI results
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { rfqId, items, expectedDelivery, terms, notes } = req.body;
    // items: [{ product, vendor, quantity, unitPrice, deliveryDays, aiScore }]

    const po = await PurchaseOrder.create({
      rfq: rfqId,
      createdBy: req.user._id,
      items,
      expectedDelivery,
      terms,
      notes,
    });

    // Mark RFQ as PO generated
    await RFQ.findByIdAndUpdate(rfqId, { status: 'po_generated' });

    // Update vendor order count
    const vendorIds = [...new Set(items.map(i => i.vendor))];
    await Vendor.updateMany({ _id: { $in: vendorIds } }, { $inc: { totalOrders: 1 } });

    const populated = await PurchaseOrder.findById(po._id)
      .populate('rfq', 'rfqNumber title')
      .populate('items.product', 'name sku')
      .populate('items.vendor', 'name email');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @PUT /api/po/:id/status — update PO status
router.put('/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const po = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    ).populate('items.product', 'name').populate('items.vendor', 'name');
    if (!po) return res.status(404).json({ success: false, message: 'PO not found' });
    res.json({ success: true, data: po });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
