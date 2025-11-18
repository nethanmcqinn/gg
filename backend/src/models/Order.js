import mongoose from 'mongoose';
import * as Yup from 'yup';

const orderItemSchema = new mongoose.Schema({
  mouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mouse',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  image: String
});

const shippingAddressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  postalCode: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  }
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    orderItems: [orderItemSchema],
    shippingAddress: {
      type: shippingAddressSchema,
      required: true
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['credit-card', 'debit-card', 'paypal', 'cash-on-delivery'],
      default: 'credit-card'
    },
    itemsPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    shippingPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    taxPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    paidAt: Date,
    isDelivered: {
      type: Boolean,
      default: false
    },
    deliveredAt: Date,
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

// Indexes for better query performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

// Yup validation schema for order creation
export const orderValidationSchema = Yup.object({
  orderItems: Yup.array()
    .of(
      Yup.object({
        mouse: Yup.string().required('Product is required'),
        quantity: Yup.number().min(1, 'Quantity must be at least 1').required('Quantity is required'),
        price: Yup.number().min(0, 'Price must be positive').required('Price is required')
      })
    )
    .min(1, 'Order must have at least one item')
    .required('Order items are required'),
  shippingAddress: Yup.object({
    fullName: Yup.string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name cannot exceed 100 characters')
      .required('Full name is required'),
    address: Yup.string()
      .min(5, 'Address must be at least 5 characters')
      .max(200, 'Address cannot exceed 200 characters')
      .required('Address is required'),
    city: Yup.string()
      .min(2, 'City must be at least 2 characters')
      .max(50, 'City cannot exceed 50 characters')
      .required('City is required'),
    postalCode: Yup.string()
      .min(3, 'Postal code must be at least 3 characters')
      .max(10, 'Postal code cannot exceed 10 characters')
      .required('Postal code is required'),
    country: Yup.string()
      .min(2, 'Country must be at least 2 characters')
      .max(50, 'Country cannot exceed 50 characters')
      .required('Country is required'),
    phone: Yup.string()
      .min(7, 'Phone number must be at least 7 characters')
      .max(20, 'Phone number cannot exceed 20 characters')
      .required('Phone number is required')
  }).required('Shipping address is required'),
  paymentMethod: Yup.string()
    .oneOf(['credit-card', 'debit-card', 'paypal', 'cash-on-delivery'], 'Invalid payment method')
    .required('Payment method is required')
});

// Virtual for order number
orderSchema.virtual('orderNumber').get(function() {
  return `ORD-${this._id.toString().slice(-8).toUpperCase()}`;
});

// Ensure virtuals are included in JSON
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

const Order = mongoose.model('Order', orderSchema);

export default Order;
