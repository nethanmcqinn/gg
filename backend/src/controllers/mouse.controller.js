import { Mouse } from '../models/Mouse.js';
import { Review } from '../models/Review.js';
import mongoose from 'mongoose';
import validator from 'validator';

export async function listMice(req, res) {
  try {
    const {
      q = '',
      brand,
      connection,
      rgb,
      minRating,
      hasReviews,
      minPrice,
      maxPrice,
      sort = 'name',
      page = '1',
      limit = '12',
    } = req.query;

    const numericPage = Math.max(parseInt(page, 10) || 1, 1);
    const numericLimit = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 60);

    const filter = {};
    if (q && validator.isAscii(q + '')) {
      filter.$or = [
        { name: { $regex: validator.escape(q), $options: 'i' } },
        { brand: { $regex: validator.escape(q), $options: 'i' } },
      ];
    }
    if (brand && validator.isAscii(brand + '')) filter.brand = brand;
    if (connection && ['wired', 'wireless'].includes(connection)) filter.connection = connection;
    if (rgb === 'true') filter.rgb = true;
    if (rgb === 'false') filter.rgb = false;

    // Review-based filtering
    const minR = Number(minRating);
    if (!Number.isNaN(minR) && minR >= 1) {
      if (minR >= 5) {
        filter.rating = { $gte: 5, $lte: 5 };
      } else {
        filter.rating = { $gte: minR, $lt: minR + 1 };
      }
    }
    
    // Handle hasReviews filter by querying the reviews collection
    let mouseIdsWithReviews = null;
    if (hasReviews === 'true' || hasReviews === 'false') {
      // Get all mice that have (or don't have) approved reviews
      const reviewedMice = await Review.distinct('mouse', { status: 'approved' });
      mouseIdsWithReviews = reviewedMice.map(id => (typeof id === 'string' ? mongoose.Types.ObjectId(id) : id));
      
      if (hasReviews === 'true') {
        // Show only mice with approved reviews
        filter._id = { $in: mouseIdsWithReviews };
      } else if (hasReviews === 'false') {
        // Show only mice without approved reviews
        filter._id = { $nin: mouseIdsWithReviews };
      }
    }

    const priceFilter = {};
    const min = Number(minPrice);
    const max = Number(maxPrice);
    if (!Number.isNaN(min)) priceFilter.$gte = min;
    if (!Number.isNaN(max)) priceFilter.$lte = max;
    if (Object.keys(priceFilter).length) filter.price = priceFilter;

    const sortMap = {
      name: { name: 1 },
      price: { price: 1 },
      '-price': { price: -1 },
      rating: { rating: -1 },
    };
    const sortSpec = sortMap[sort] || { name: 1 };

    const result = await Promise.all([
      Mouse.find(filter)
        .sort(sortSpec)
        .skip((numericPage - 1) * numericLimit)
        .limit(numericLimit)
        .lean(),
      Mouse.countDocuments(filter),
    ]);
    let items = result[0];
    const total = result[1];

    
    try {
      const ids = items.map(i => i._id).filter(Boolean);
      if (ids.length) {
        const agg = await Review.aggregate([
          { $match: { mouse: { $in: ids.map(id => (typeof id === 'string' ? mongoose.Types.ObjectId(id) : id)) }, status: 'approved' } },
          { $group: { _id: '$mouse', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
        ]);
        const map = {};
        agg.forEach(a => { map[String(a._id)] = a; });
        items = items.map(it => {
          const m = map[String(it._id)];
          if (m) {
            
            it.rating = Math.round((m.avgRating + Number.EPSILON) * 10) / 10;
            it.reviewCount = m.count;
          } else {
            it.rating = it.rating || 0;
            it.reviewCount = 0;
          }
          return it;
        });
      } else {
        items = items.map(it => ({ ...it, rating: it.rating || 0, reviewCount: 0 }));
      }
    } catch (err) {
      console.warn('Failed to aggregate reviews for catalog page', err.message || err);
      items = items.map(it => ({ ...it, rating: it.rating || 0, reviewCount: 0 }));
    }

    res.json({
      items,
      page: numericPage,
      limit: numericLimit,
      total,
      totalPages: Math.ceil(total / numericLimit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch mice' });
  }
}

export async function getMouseBySlug(req, res) {
  try {
    const { slug } = req.params;
    const mouse = await Mouse.findOne({ slug }).lean();
    if (!mouse) return res.status(404).json({ message: 'Not found' });
    // Enrich the single mouse with up-to-date review aggregates (avg rating and count)
    try {
      const agg = await Review.aggregate([
        { $match: { mouse: mongoose.Types.ObjectId(mouse._id), status: 'approved' } },
        { $group: { _id: '$mouse', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
      ]);
      if (agg && agg.length) {
        // round to one decimal to match frontend star precision
        mouse.rating = Math.round((agg[0].avgRating + Number.EPSILON) * 10) / 10;
        mouse.reviewCount = agg[0].count;
      } else {
        mouse.rating = mouse.rating || 0;
        mouse.reviewCount = 0;
      }
    } catch (err) {
      console.warn('Failed to aggregate reviews for product page', err.message || err);
      mouse.rating = mouse.rating || 0;
      mouse.reviewCount = mouse.reviewCount || 0;
    }

    res.json(mouse);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch mouse' });
  }
}


