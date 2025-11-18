import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  updateOrderToPaid,
  deleteOrder
} from '../controllers/order.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// User routes (protected)
router.post('/', authenticate, createOrder);
router.get('/myorders', authenticate, getMyOrders);
router.get('/:id', authenticate, getOrderById);

// Admin routes
router.get('/', authenticate, requireAdmin, getAllOrders);
router.patch('/:id/status', authenticate, requireAdmin, updateOrderStatus);
router.patch('/:id/pay', authenticate, requireAdmin, updateOrderToPaid);
router.delete('/:id', authenticate, requireAdmin, deleteOrder);

export default router;
