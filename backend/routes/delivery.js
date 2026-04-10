const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery');
const PurchaseOrder = require('../models/PurchaseOrder');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// @GET /api/delivery
router.get('/', protect, async (req, res) => {
  try {
    const deliveries = await Delivery.find()
      .populate('purchaseOrder', 'poNumber totalAmount')
      .populate('vendor', 'name email')
      .populate('items.product', 'name sku')
      .populate('receivedBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: deliveries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/delivery/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('purchaseOrder')
      .populate('vendor', 'name email phone')
      .populate('items.product', 'name sku unit currentStock');
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' });
    res.json({ success: true, data: delivery });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/delivery — record a delivery and update inventory
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { purchaseOrder, vendor, items, warehouseLocation, notes, deliveredAt } = req.body;

    const delivery = await Delivery.create({
      purchaseOrder,
      vendor,
      items,
      warehouseLocation,
      notes,
      deliveredAt: deliveredAt || new Date(),
      receivedBy: req.user._id,
      status: 'delivered',
      inventoryUpdated: true,
    });

    // Update inventory (currentStock) for each product
    for (const item of items) {
      if (item.condition !== 'damaged') {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { currentStock: item.receivedQty }
        });
      }
    }

    // Update PO status to delivered
    await PurchaseOrder.findByIdAndUpdate(purchaseOrder, { status: 'delivered' });

    const populated = await Delivery.findById(delivery._id)
      .populate('vendor', 'name')
      .populate('items.product', 'name sku currentStock');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
