import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { Brand } from '../models/Brand.js';
import slugify from 'slugify';

const router = Router();

// Public: list brands
router.get('/', async (req, res) => {
  try {
    const brands = await Brand.find({}).sort({ name: 1 }).lean();
    res.json({ data: brands });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch brands' });
  }
});

// Public: get single brand
router.get('/:id', async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id).lean();
    if (!brand) return res.status(404).json({ message: 'Brand not found' });
    res.json({ data: brand });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch brand' });
  }
});

// Admin: create brand
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, image } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Name required' });
    const slug = slugify(name, { lower: true, strict: true });
    const brand = new Brand({ name: name.trim(), slug, image: image || '' });
    await brand.save();
    res.status(201).json({ data: brand });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to create brand' });
  }
});

// Admin: update brand
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, image } = req.body;
    const update = {};
    if (typeof name === 'string') {
      update.name = name.trim();
      update.slug = slugify(name, { lower: true, strict: true });
    }
    if (typeof image === 'string') update.image = image;
    const brand = await Brand.findByIdAndUpdate(req.params.id, { $set: update }, { new: true }).lean();
    if (!brand) return res.status(404).json({ message: 'Brand not found' });
    res.json({ data: brand });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to update brand' });
  }
});

// Admin: delete brand
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ message: 'Brand not found' });
    await brand.deleteOne();
    res.json({ data: { deletedId: req.params.id } });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete brand' });
  }
});

export { router as brandRouter };
