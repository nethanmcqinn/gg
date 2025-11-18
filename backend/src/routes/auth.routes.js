import { Router } from 'express';
import { register, login, verifyEmail, forgotPassword, resetPassword, googleAuth } from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/google', googleAuth);

export { router as authRouter };


