import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.js';
import { verifyFirebaseToken } from '../config/firebase.js';

export async function register(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing email or password' });
    
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });
    
    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    const user = await User.create({
      email,
      passwordHash,
      role: 'user',
      verificationToken,
    });
    
    // Send verification email (non-blocking - don't fail registration if email fails)
    sendVerificationEmail(email, verificationToken).catch(err => {
      console.error('Failed to send verification email:', err);
    });
    
    res.status(201).json({ message: 'Registration successful. Please check your email to verify your account.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
}

export async function verifyEmail(req, res) {
  try {
    const { token } = req.body;
    const user = await User.findOne({ verificationToken: token });
    
    if (!user) return res.status(400).json({ message: 'Invalid verification token' });
    
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
    
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Verification failed' });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Missing credentials' });
  
  const user = await User.findOne({ email }).lean(false);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  
  // Check if user is active (not deactivated by admin)
  if (!user.isActive) {
    return res.status(403).json({ 
      message: 'Your account has been deactivated by the administrator. Please contact support for assistance.',
      code: 'ACCOUNT_DEACTIVATED'
    });
  }
  
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  
  // Allow admins even if not verified; require verification for regular users
  if (user.role !== 'admin' && !user.isVerified) {
    return res.status(401).json({ message: 'Please verify your email first' });
  }
  
  const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
  res.json({ token });
}

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();
    
    // Send password reset email (non-blocking)
    sendPasswordResetEmail(email, resetToken).catch(err => {
      console.error('Failed to send password reset email:', err);
    });
    
    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to send reset email' });
  }
}

export async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;
    
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    });
    
    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });
    
    const passwordHash = await bcrypt.hash(password, 10);
    user.passwordHash = passwordHash;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Password reset failed' });
  }
}

export async function googleAuth(req, res) {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'ID token is required' });
    }

    // Verify the Firebase ID token
    const decodedToken = await verifyFirebaseToken(idToken);
    const { email, name, picture, uid: googleId } = decodedToken;

    if (!email) {
      return res.status(400).json({ message: 'Email not provided by Google' });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists - update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId;
        user.isVerified = true; // Auto-verify Google users
        if (picture && !user.photoURL) {
          user.photoURL = picture;
        }
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        email,
        name: name || email.split('@')[0],
        googleId,
        isVerified: true, // Auto-verify Google users
        role: 'user',
        photoURL: picture,
        // No password needed for Google users
        passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10), // Random password
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        photoURL: user.photoURL
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Google authentication failed', error: error.message });
  }
}


