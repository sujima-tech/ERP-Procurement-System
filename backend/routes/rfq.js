const express = require('express');
const router = express.Router();
const RFQ = require('../models/RFQ');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// @GET /api/rfqs — admin: all; vendor: RFQs assigned to them
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'vendor') {
      query = { vendors: req.user.vendorId };
    }
    const rfqs = await RFQ.find(query)
      .populate('items.product', 'name sku unit')
      .populate('vendors', 'name email phone')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: rfqs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/rfqs/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const rfq = await RFQ.findById(req.params.id)
      .populate('items.product', 'name sku unit category')
      .populate('vendors', 'name email phone rating contactPerson')
      .populate('createdBy', 'name email');
    if (!rfq) return res.status(404).json({ success: false, message: 'RFQ not found' });
    res.json({ success: true, data: rfq });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/rfqs — admin creates RFQ
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const rfq = await RFQ.create({ ...req.body, createdBy: req.user._id });
    const populated = await RFQ.findById(rfq._id)
      .populate('items.product', 'name sku')
      .populate('vendors', 'name email');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @PUT /api/rfqs/:id — update/send RFQ
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const rfq = await RFQ.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('items.product', 'name sku')
      .populate('vendors', 'name email');
    if (!rfq) return res.status(404).json({ success: false, message: 'RFQ not found' });
    res.json({ success: true, data: rfq });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @DELETE /api/rfqs/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await RFQ.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'RFQ deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
