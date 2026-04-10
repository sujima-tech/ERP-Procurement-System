const express = require('express');
const router = express.Router();
const Quote = require('../models/Quote');
const Vendor = require('../models/Vendor');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { evaluateQuotes } = require('../services/aiEngine');

// @GET /api/ai/evaluate/:rfqId — run AI evaluation for an RFQ
router.get('/evaluate/:rfqId', protect, authorize('admin'), async (req, res) => {
  try {
    const quotes = await Quote.find({ rfq: req.params.rfqId })
      .populate('vendor', 'name email rating')
      .populate('items.product', 'name sku unit');

    if (quotes.length === 0) {
      return res.status(404).json({ success: false, message: 'No quotes found for this RFQ' });
    }

    // Gather all vendors
    const vendorIds = [...new Set(quotes.map(q => q.vendor._id.toString()))];
    const vendors = await Vendor.find({ _id: { $in: vendorIds } });

    const results = evaluateQuotes(quotes, vendors);

    // Store AI scores back in quotes
    for (const result of results) {
      const bestQuote = quotes.find(q => q._id.toString() === result.bestQuoteId);
      if (bestQuote) {
        await Quote.findByIdAndUpdate(result.bestQuoteId, { aiScore: result.bestScore });
      }
    }

    res.json({
      success: true,
      rfqId: req.params.rfqId,
      totalProducts: results.length,
      totalQuotes: quotes.length,
      results,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
