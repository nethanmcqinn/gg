import { Mouse } from '../models/Mouse.js';
import validator from 'validator';

export async function listMice(req, res) {
  try {
    const {
      q = '',
      brand,
      connection,
      rgb,
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

    const [items, total] = await Promise.all([
      Mouse.find(filter)
        .sort(sortSpec)
        .skip((numericPage - 1) * numericLimit)
        .limit(numericLimit)
        .lean(),
      Mouse.countDocuments(filter),
    ]);

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
    res.json(mouse);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch mouse' });
  }
}


