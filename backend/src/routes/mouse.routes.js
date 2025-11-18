import { Router } from 'express';
import { listMice, getMouseBySlug } from '../controllers/mouse.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { Mouse } from '../models/Mouse.js';

const router = Router();

router.get('/', listMice);

// Admin: bulk delete (must come BEFORE /:slug to avoid conflicts)
router.post('/bulk-delete', authenticate, requireAdmin, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Invalid IDs array' });
    }
    const result = await Mouse.deleteMany({ _id: { $in: ids } });
    res.json({ 
      deletedCount: result.deletedCount,
      message: `Successfully deleted ${result.deletedCount} mice`
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.get('/:slug', getMouseBySlug);

// Admin: create
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const doc = await Mouse.create(req.body);
    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Admin: update
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const doc = await Mouse.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Admin: delete
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const r = await Mouse.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ message: 'Not found' });
    res.status(204).send();
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

export { router as mouseRouter };


