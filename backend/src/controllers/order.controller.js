import Order, { orderValidationSchema } from '../models/Order.js';
import { Mouse } from '../models/Mouse.js';
import { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } from '../services/email.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (authenticated users)
export const createOrder = async (req, res) => {
  try {
    // Validate request body
    await orderValidationSchema.validate(req.body, { abortEarly: false });

    const { orderItems, shippingAddress, paymentMethod, itemsPrice, shippingPrice, taxPrice, totalPrice } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items provided' });
    }

    // Verify all products exist and are still available
    for (const item of orderItems) {
      const mouse = await Mouse.findById(item.mouse);
      if (!mouse) {
        return res.status(404).json({ message: `Product ${item.mouse} not found` });
      }
    }

    // Create order
    const order = await Order.create({
      user: req.user._id,
      orderItems: orderItems.map(item => ({
        mouse: item.mouse,
        name: item.name,
        brand: item.brand,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      })),
      shippingAddress,
      paymentMethod,
      itemsPrice: itemsPrice || 0,
      shippingPrice: shippingPrice || 0,
      taxPrice: taxPrice || 0,
      totalPrice: totalPrice || 0
    });

    const populatedOrder = await Order.findById(order._id).populate('user', 'name email');

    // Send order confirmation email
    try {
      await sendOrderConfirmationEmail(req.user.email, {
        orderNumber: populatedOrder.orderNumber || `ORD-${order._id.toString().slice(-8).toUpperCase()}`,
        orderItems: populatedOrder.orderItems,
        shippingAddress: populatedOrder.shippingAddress,
        totalPrice: populatedOrder.totalPrice,
        itemsPrice: populatedOrder.itemsPrice,
        shippingPrice: populatedOrder.shippingPrice,
        taxPrice: populatedOrder.taxPrice,
        status: populatedOrder.status,
        createdAt: populatedOrder.createdAt,
        paymentMethod: populatedOrder.paymentMethod
      });
      console.log('Order confirmation email sent to:', req.user.email);
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
      // Don't fail the order creation if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: populatedOrder
    });
  } catch (error) {
    console.error('Create order error:', error);
    
    // Handle Yup validation errors
    if (error.name === 'ValidationError' && error.errors) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: error.errors 
      });
    }

    res.status(500).json({ 
      message: 'Failed to create order', 
      error: error.message 
    });
  }
};

// @desc    Get logged in user's orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('orderItems.mouse', 'name brand slug')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch orders', 
      error: error.message 
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('orderItems.mouse', 'name brand slug images');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns the order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch order', 
      error: error.message 
    });
  }
};

// @desc    Get all orders (Admin only)
// @route   GET /api/orders
// @access  Private/Admin
export const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email')
        .populate('orderItems.mouse', 'name brand')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query)
    ]);

    res.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch orders', 
      error: error.message 
    });
  }
};

// @desc    Update order status (Admin only)
// @route   PATCH /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;

    // Update delivery status
    if (status === 'delivered' && !order.isDelivered) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('orderItems.mouse', 'name brand');

    // Send status update email
    try {
      await sendOrderStatusUpdateEmail(updatedOrder.user.email, {
        orderNumber: updatedOrder.orderNumber || `ORD-${order._id.toString().slice(-8).toUpperCase()}`,
        status: updatedOrder.status,
        totalPrice: updatedOrder.totalPrice,
        orderItems: updatedOrder.orderItems,
        shippingAddress: updatedOrder.shippingAddress,
        itemsPrice: updatedOrder.itemsPrice,
        shippingPrice: updatedOrder.shippingPrice,
        taxPrice: updatedOrder.taxPrice,
        paymentMethod: updatedOrder.paymentMethod,
        createdAt: updatedOrder.createdAt
      });
      console.log('Order status update email sent to:', updatedOrder.user.email);
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError);
      // Don't fail the status update if email fails
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ 
      message: 'Failed to update order status', 
      error: error.message 
    });
  }
};

// @desc    Update order to paid (Admin only)
// @route   PATCH /api/orders/:id/pay
// @access  Private/Admin
export const updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.isPaid = true;
    order.paidAt = Date.now();

    await order.save();

    res.json({
      success: true,
      message: 'Order marked as paid',
      order
    });
  } catch (error) {
    console.error('Update order to paid error:', error);
    res.status(500).json({ 
      message: 'Failed to update order', 
      error: error.message 
    });
  }
};

// @desc    Delete order (Admin only)
// @route   DELETE /api/orders/:id
// @access  Private/Admin
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await order.deleteOne();

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ 
      message: 'Failed to delete order', 
      error: error.message 
    });
  }
};
