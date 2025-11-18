import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useAuth } from '../context/AuthContext';

const statusColors = {
  pending: 'warning',
  processing: 'info',
  shipped: 'primary',
  delivered: 'success',
  cancelled: 'error'
};

export default function AdminOrders() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const url = statusFilter === 'all' 
        ? 'http://localhost:5000/api/orders'
        : `http://localhost:5000/api/orders?status=${statusFilter}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expired. Please login again.');
          return;
        }
        throw new Error(data.message || 'Failed to fetch orders');
      }

      const rawOrders = Array.isArray(data.orders) ? data.orders : [];
      
      console.log('RAW ORDER DATA:', rawOrders[0]); // Debug first order

      const formattedOrders = rawOrders.map((order) => {
        const fallbackId = order._id ? order._id.slice(-8).toUpperCase() : '';

        const itemsTotal = (order.orderItems || []).reduce((sum, item) => {
          const price = Number(item.price) || 0;
          const qty = Number(item.quantity) || 0;
          console.log(`Item: ${item.name}, price: ${price}, qty: ${qty}, subtotal: ${price * qty}`);
          return sum + price * qty;
        }, 0);

        const computedTotal = (() => {
          const total = Number(order.totalPrice);
          const shipping = Number(order.shippingPrice) || 0;
          const tax = Number(order.taxPrice) || 0;
          console.log(`Order totals - stored: ${total}, items: ${itemsTotal}, shipping: ${shipping}, tax: ${tax}`);
          if (Number.isFinite(total) && total > 0) return total;
          return itemsTotal + shipping + tax;
        })();

        const formattedDate = order.createdAt
          ? new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
          : '—';

        console.log(`Final computed total for ${fallbackId}: ${computedTotal}`);

        return {
          ...order,
          orderNumberDisplay: order.orderNumber || (fallbackId ? `ORD-${fallbackId}` : 'N/A'),
          customerName: order.user?.name || 'N/A',
          customerEmail: order.user?.email || 'N/A',
          orderDateDisplay: formattedDate,
          itemCount: order.orderItems?.length || 0,
          status: order.status || 'pending',
          totalAmount: computedTotal
        };
      });

      console.log('Formatted orders with totals:', formattedOrders.map(o => ({ id: o._id, total: o.totalAmount })));
      setOrders(formattedOrders);
    } catch (err) {
      console.error('Fetch orders error:', err);
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    if (!token) {
      setError('Please login again to update orders');
      return;
    }

    if (!orderId) {
      setError('Missing order identifier');
      return;
    }

    setUpdating((prev) => ({ ...prev, [orderId]: true }));
    
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expired. Please login again.');
          return;
        }
        throw new Error(data.message || 'Failed to update order status');
      }

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (err) {
      console.error('Update status error:', err);
      setError(err.message || 'Failed to update order status');
    } finally {
      setUpdating((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const columns = [
    {
      field: 'orderNumberDisplay',
      headerName: 'Order #',
      width: 160
    },
    {
      field: 'customerEmail',
      headerName: 'Email',
      width: 280
    },
    {
      field: 'totalAmount',
      headerName: 'Total',
      width: 120,
      renderCell: (params = {}) => {
        const raw = params.value;
        const numeric = Number(raw);
        const amount = Number.isFinite(numeric) ? numeric.toFixed(2) : '0.00';
        return `₱${amount}`;
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 180,
      renderCell: (params = {}) => {
        const row = params.row || {};
        const orderId = row._id;
        const isUpdating = orderId ? updating[orderId] : false;

        return orderId ? (
          <FormControl size="small" fullWidth disabled={isUpdating}>
            <Select
              value={params.value || row.status || 'pending'}
              onChange={(e) => handleStatusChange(orderId, e.target.value)}
              sx={{ fontSize: '0.875rem' }}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="processing">Processing</MenuItem>
              <MenuItem value="shipped">Shipped</MenuItem>
              <MenuItem value="delivered">Delivered</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        ) : null;
      }
    },
    {
      field: 'isDelivered',
      headerName: 'Delivery',
      width: 120,
      renderCell: (params = {}) => (
        <Chip
          label={params.value ? 'Delivered' : 'Pending'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'orderDateDisplay',
      headerName: 'Order Date',
      width: 150
    },
    {
      field: 'itemCount',
      headerName: 'Items',
      width: 80,
      type: 'number'
    }
  ];

  if (loading) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Order Management
        </Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select
            value={statusFilter}
            label="Filter by Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All Orders</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="processing">Processing</MenuItem>
            <MenuItem value="shipped">Shipped</MenuItem>
            <MenuItem value="delivered">Delivered</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={orders}
          columns={columns}
          getRowId={(row) => row._id}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          sx={{
            '& .MuiDataGrid-cell': {
              py: 1
            }
          }}
        />
      </Paper>

      {/* Order Statistics */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2, mt: 3 }}>
        {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => {
          const count = orders.filter((order) => order.status === status).length;
          return (
            <Paper key={status} sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color={statusColors[status] + '.main'}>
                {count}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                {status}
              </Typography>
            </Paper>
          );
        })}
      </Box>
    </Container>
  );
}
