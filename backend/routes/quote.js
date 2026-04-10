const express = require('express');
const router = express.Router();
const Quote = require('../models/Quote');
const RFQ = require('../models/RFQ');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// @GET /api/quotes — admin: all; vendor: their own
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'vendor') {
      query = { vendor: req.user.vendorId };
    }
    if (req.query.rfq) query.rfq = req.query.rfq;

    const quotes = await Quote.find(query)
      .populate('rfq', 'rfqNumber title')
      .populate('vendor', 'name email rating')
      .populate('items.product', 'name sku unit')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: quotes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/quotes/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id)
      .populate('rfq', 'rfqNumber title deadline')
      .populate('vendor', 'name email phone rating')
      .populate('items.product', 'name sku unit');
    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });
    res.json({ success: true, data: quote });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/quotes — vendor submits quote
router.post('/', protect, authorize('vendor'), async (req, res) => {
  try {
    const { rfq, items, validUntil, remarks } = req.body;

    // Check if vendor already quoted this RFQ
    const existing = await Quote.findOne({ rfq, vendor: req.user.vendorId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Quote already submitted for this RFQ' });
    }

    const quote = await Quote.create({
      rfq,
      vendor: req.user.vendorId,
      submittedBy: req.user._id,
      items,
      validUntil,
      remarks,
    });

    // Update RFQ status
    await RFQ.findByIdAndUpdate(rfq, { status: 'quotes_received' });

    const populated = await Quote.findById(quote._id)
      .populate('vendor', 'name email')
      .populate('items.product', 'name sku');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @PUT /api/quotes/:id — vendor updates quote before deadline
router.put('/:id', protect, authorize('vendor'), async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });
    if (quote.vendor.toString() !== req.user.vendorId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const updated = await Quote.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('vendor', 'name email')
      .populate('items.product', 'name sku');
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
