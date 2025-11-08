import express from 'express';
import { authenticate as auth } from '../middleware/auth.js';
import { Review } from '../models/Review.js';
import { Mouse } from '../models/Mouse.js';

const router = express.Router();

// Create a review
router.post('/:mouseId', auth, async (req, res) => {
    try {
        const mouseId = req.params.mouseId;
        const userId = req.user.id;

        // Check if mouse exists
        const mouse = await Mouse.findById(mouseId);
        if (!mouse) {
            return res.status(404).json({ error: 'Mouse not found' });
        }

        // Check if user already reviewed this mouse
        const existingReview = await Review.findOne({ user: userId, mouse: mouseId });
        if (existingReview) {
            return res.status(400).json({ error: 'You have already reviewed this mouse' });
        }

        // Validate review data
        const { data: validatedData, error: validationError } = await Review.validate(req.body);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        // Create review - auto-approve by default
        const review = new Review({
            ...validatedData,
            user: userId,
            mouse: mouseId
        });

        await review.save();

        // Populate user details
        await review.populate('user', 'username');

        res.status(201).json({ data: review });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get approved reviews for a mouse (public)
router.get('/mouse/:mouseId', async (req, res) => {
    try {
        const mouseId = req.params.mouseId;
        const reviews = await Review.find({ mouse: mouseId, status: 'approved' })
            .populate('user', 'username')
            .sort({ createdAt: -1 });

        res.json({ data: reviews });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Get all reviews (for management)
router.get('/all', auth, async (req, res) => {
    try {
        if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });

        const reviews = await Review.find({})
            .populate('user', 'username email')
            .populate('mouse', 'name slug')
            .sort({ createdAt: -1 });

        res.json({ data: reviews });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Moderate a review (approve or hide)
router.put('/:reviewId/moderate', auth, async (req, res) => {
    try {
        if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });

        const reviewId = req.params.reviewId;
        const { status, reason } = req.body;

        if (!['approved', 'hidden'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const review = await Review.findById(reviewId);
        if (!review) return res.status(404).json({ error: 'Review not found' });

        review.status = status;
        review.moderationReason = reason || null;
        review.moderatedBy = req.user.id;
        review.moderatedAt = new Date();

        await review.save();

        await review.populate('user', 'username email');
        await review.populate('mouse', 'name slug');

        res.json({ data: review });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get reviews by a user
router.get('/user/:userId', auth, async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Check if user is requesting their own reviews or if admin
        if (req.user.id !== userId && !req.user.isAdmin) {
            return res.status(403).json({ error: 'Unauthorized to view these reviews' });
        }

        const reviews = await Review.find({ user: userId })
            .populate('mouse', 'name image')
            .sort({ createdAt: -1 });

        res.json({ data: reviews });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update own review
router.put('/:reviewId', auth, async (req, res) => {
    try {
        const reviewId = req.params.reviewId;
        const userId = req.user.id;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        // Check if user owns the review
        if (!review.isOwner(userId)) {
            return res.status(403).json({ error: 'Unauthorized to update this review' });
        }

        // Validate update data
        const { data: validatedData, error: validationError } = await Review.validate(req.body);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        // Update review
        Object.assign(review, validatedData);
        await review.save();

        res.json({ data: review });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete review (admin or owner)
router.delete('/:reviewId', auth, async (req, res) => {
    try {
        const reviewId = req.params.reviewId;
        const userId = req.user.id;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        // Check if user is admin or owns the review
        if (!req.user.isAdmin && !review.isOwner(userId)) {
            return res.status(403).json({ error: 'Unauthorized to delete this review' });
        }

        await review.deleteOne();
        res.json({ data: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export { router as reviewRouter };