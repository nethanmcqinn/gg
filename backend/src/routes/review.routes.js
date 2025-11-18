import express from 'express';
import mongoose from 'mongoose';
import { Filter } from 'bad-words';
import { authenticate as auth } from '../middleware/auth.js';
import { Review } from '../models/Review.js';
import { Mouse } from '../models/Mouse.js';
import Order from '../models/Order.js';

const router = express.Router();
const profanityFilter = new Filter();

// Helper: recalculate aggregated rating for a mouse and persist to Mouse.rating
async function recalcMouseRating(mouseId) {
    try {
        // consider only approved reviews for public rating
        const agg = await Review.aggregate([
            { $match: { mouse: mongoose.Types.ObjectId(mouseId), status: 'approved' } },
            { $group: { _id: '$mouse', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
        ]);
        if (agg && agg.length) {
            // Round to one decimal so UI stars (which display to one decimal) match stored value
            const avg = Math.round((agg[0].avgRating + Number.EPSILON) * 10) / 10; // one decimal
                await Mouse.findByIdAndUpdate(mouseId, { rating: avg });
        } else {
            // no approved reviews -> reset rating to 0
            await Mouse.findByIdAndUpdate(mouseId, { rating: 0 });
        }
    } catch (err) {
        console.warn('Failed to recalc mouse rating', err.message || err);
    }
}

// Helper function to check for profanity
function checkProfanity(text) {
    return profanityFilter.isProfane(text);
}

// Helper function to clean profanity
function cleanProfanity(text) {
    return profanityFilter.clean(text);
}

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

        // Ensure the user actually purchased and received (delivered) this mouse
        // Look for an order by this user that contains the mouse and is delivered
        const purchasedDeliveredOrder = await Order.findOne({
            user: userId,
            'orderItems.mouse': mouseId,
            $or: [ { status: 'delivered' }, { isDelivered: true } ]
        });

        if (!purchasedDeliveredOrder) {
            return res.status(403).json({ error: 'You may only review products you have ordered and received' });
        }

        // Check for profanity in comment before validation
        if (req.body.comment && checkProfanity(req.body.comment)) {
            return res.status(400).json({ 
                error: 'Your comment contains inappropriate language. Please remove profanity and try again.',
                profanityDetected: true
            });
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

    // Recalculate mouse aggregated rating
    await recalcMouseRating(mouseId);

        res.status(201).json({ data: review });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check if current user can review a specific mouse
router.get('/:mouseId/can-review', auth, async (req, res) => {
    try {
        const mouseId = req.params.mouseId;
        const userId = req.user.id;

        // Check if mouse exists
        const mouse = await Mouse.findById(mouseId);
        if (!mouse) return res.status(404).json({ error: 'Mouse not found' });

        // Check if user already reviewed this mouse
        const existingReview = await Review.findOne({ user: userId, mouse: mouseId });
        if (existingReview) {
            return res.json({ canReview: false, reason: 'already_reviewed' });
        }

        // Check for a delivered order containing the mouse
        const purchasedDeliveredOrder = await Order.findOne({
            user: userId,
            'orderItems.mouse': mouseId,
            $or: [ { status: 'delivered' }, { isDelivered: true } ]
        });

        if (!purchasedDeliveredOrder) {
            return res.json({ canReview: false, reason: 'not_purchased_or_not_delivered' });
        }

        return res.json({ canReview: true });
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

        // Check for profanity in comment before validation
        if (req.body.comment && checkProfanity(req.body.comment)) {
            return res.status(400).json({ 
                error: 'Your comment contains inappropriate language. Please remove profanity and try again.',
                profanityDetected: true
            });
        }

        // Validate update data
        const { data: validatedData, error: validationError } = await Review.validate(req.body);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        // Update review
        Object.assign(review, validatedData);
        await review.save();

    // Recalculate mouse rating after update
    await recalcMouseRating(review.mouse);

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
    // Recalculate mouse rating after deletion
    await recalcMouseRating(review.mouse);

    // return the deleted review id so clients can reliably remove it from UI
    res.json({ data: { deletedId: review._id } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export { router as reviewRouter };