const express = require('express');
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  getStats,
  updateStatus,
  cancelMyOrder,
} = require('../controllers/order.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/', protect, createOrder);
router.get('/stats', protect, adminOnly, getStats);
router.get('/me', protect, getMyOrders);
router.get('/', protect, adminOnly, getAllOrders);
router.patch('/:id/status', protect, adminOnly, updateStatus);
router.patch('/:id/cancel', protect, cancelMyOrder);

module.exports = router;
