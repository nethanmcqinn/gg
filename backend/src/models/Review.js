import mongoose from 'mongoose';
import yup from 'yup';

// Yup validation schema
export const reviewValidationSchema = yup.object().shape({
    rating: yup
        .number()
        .required('Rating is required')
        .min(1, 'Rating must be at least 1')
        .max(5, 'Rating must not exceed 5'),
    comment: yup
        .string()
        .required('Comment is required')
        .min(3, 'Comment must be at least 3 characters')
        .max(500, 'Comment must not exceed 500 characters'),
});

// Mongoose schema
const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    mouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mouse',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 500
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

// Moderation fields
reviewSchema.add({
    status: {
        type: String,
        enum: ['approved', 'pending', 'hidden'],
        default: 'approved'
    },
    moderatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    moderatedAt: {
        type: Date,
        default: null
    },
    moderationReason: {
        type: String,
        default: null
    }
});

// Static method to validate review data
reviewSchema.statics.validate = async function(reviewData) {
    try {
        const validatedData = await reviewValidationSchema.validate(reviewData, {
            abortEarly: false,
            stripUnknown: true
        });
        return { data: validatedData, error: null };
    } catch (error) {
        return { 
            data: null, 
            error: error.errors 
        };
    }
};

// Method to check if user owns this review
reviewSchema.methods.isOwner = function(userId) {
    return this.user.toString() === userId.toString();
};

// Virtual field for average rating
reviewSchema.virtual('formattedDate').get(function() {
    return this.date.toLocaleDateString();
});

export const Review = mongoose.model('Review', reviewSchema);