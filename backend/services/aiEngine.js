/**
 * AI Evaluation Engine
 * Scoring system to compare vendor quotes per product
 * 
 * Factors:
 *   Price    (weight 0.5) — lower is better
 *   Delivery (weight 0.3) — faster is better
 *   Rating   (weight 0.2) — higher is better
 */

const evaluateQuotes = (quotes, vendors) => {
  // Flatten all quote items with their vendor info
  // quotes = [{ vendor, items: [{ product, unitPrice, deliveryDays, quantity }] }]

  // Group items by product
  const productMap = {};

  quotes.forEach(quote => {
    const vendorInfo = vendors.find(v => v._id.toString() === quote.vendor._id.toString());
    const vendorRating = vendorInfo ? vendorInfo.rating : 3;

    quote.items.forEach(item => {
      const productId = item.product._id ? item.product._id.toString() : item.product.toString();
      if (!productMap[productId]) {
        productMap[productId] = {
          productId,
          productName: item.product.name || 'Unknown',
          bids: []
        };
      }
      productMap[productId].bids.push({
        vendorId: quote.vendor._id.toString(),
        vendorName: quote.vendor.name,
        quoteId: quote._id.toString(),
        unitPrice: item.unitPrice,
        deliveryDays: item.deliveryDays,
        rating: vendorRating,
        quantity: item.quantity,
      });
    });
  });

  const results = [];

  Object.values(productMap).forEach(({ productId, productName, bids }) => {
    if (bids.length === 0) return;

    // Find min/max for normalization
    const minPrice = Math.min(...bids.map(b => b.unitPrice));
    const minDelivery = Math.min(...bids.map(b => b.deliveryDays));
    const maxRating = Math.max(...bids.map(b => b.rating));

    const weights = { price: 0.5, delivery: 0.3, rating: 0.2 };

    const scoredBids = bids.map(bid => {
      const normalizedPrice = minPrice / bid.unitPrice;
      const normalizedDelivery = minDelivery / bid.deliveryDays;
      const normalizedRating = maxRating > 0 ? bid.rating / maxRating : 0;

      const score =
        weights.price * normalizedPrice +
        weights.delivery * normalizedDelivery +
        weights.rating * normalizedRating;

      return {
        ...bid,
        score: parseFloat(score.toFixed(4)),
        breakdown: {
          normalizedPrice: parseFloat(normalizedPrice.toFixed(4)),
          normalizedDelivery: parseFloat(normalizedDelivery.toFixed(4)),
          normalizedRating: parseFloat(normalizedRating.toFixed(4)),
          weights,
        }
      };
    });

    // Sort descending by score
    scoredBids.sort((a, b) => b.score - a.score);
    const best = scoredBids[0];

    results.push({
      productId,
      productName,
      bestVendorId: best.vendorId,
      bestVendorName: best.vendorName,
      bestQuoteId: best.quoteId,
      bestScore: best.score,
      bestUnitPrice: best.unitPrice,
      bestDeliveryDays: best.deliveryDays,
      bestRating: best.rating,
      allBids: scoredBids,
    });
  });

  return results;
};

module.exports = { evaluateQuotes };
