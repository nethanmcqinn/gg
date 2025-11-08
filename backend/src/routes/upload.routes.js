import { Router } from 'express';
import multer from 'multer';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { configureCloudinary, uploadImage } from '../services/cloudinary.js';

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

configureCloudinary();

// Single image upload
router.post('/image', authenticate, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Missing file' });
    const result = await uploadImage(req.file.buffer, req.file.originalname, 'ggclicks/mice');
    res.status(201).json({ url: result.secure_url });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Multiple images upload
router.post('/images', authenticate, requireAdmin, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'Missing files' });
    
    const uploadPromises = req.files.map(file => 
      uploadImage(file.buffer, file.originalname, 'ggclicks/mice')
    );
    
    const results = await Promise.all(uploadPromises);
    const urls = results.map(result => result.secure_url);
    
    res.status(201).json({ urls });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export { router as uploadRouter };

// Profile photo upload (authenticated user)
router.post('/profile', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Missing file' });
    const result = await uploadImage(req.file.buffer, req.file.originalname, 'ggclicks/profiles');
    res.status(201).json({ url: result.secure_url });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});



