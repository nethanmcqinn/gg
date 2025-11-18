import { useEffect, useState } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, 
  Toolbar, AppBar, Typography, Button, Paper, Grid, Card, CardContent,
  FormControl, InputLabel, Select, MenuItem, CircularProgress, Alert, TextField
} from '@mui/material';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import RateReviewIcon from '@mui/icons-material/RateReview';
import LabelIcon from '@mui/icons-material/Label';
import PeopleIcon from '@mui/icons-material/People';
import LogoutIcon from '@mui/icons-material/Logout';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
  { text: 'Products', icon: <InventoryIcon />, path: '/admin/mice' },
  { text: 'Brands', icon: <LabelIcon />, path: '/admin/brands' },
  { text: 'Orders', icon: <ShoppingCartIcon />, path: '/admin/orders' },
  { text: 'Reviews', icon: <RateReviewIcon />, path: '/admin/reviews' },
  { text: 'Users', icon: <PeopleIcon />, path: '/admin/users' },
];

// Dashboard Home Component
function DashboardHome() {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalUsers: 0
  });
  const [chartType, setChartType] = useState('line');
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const COLORS = ['#6ee7ff', '#4caf50', '#ff9800'];

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      const ordersRes = await fetch('http://localhost:5000/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const ordersData = await ordersRes.json();
      const allOrders = ordersData.orders || [];

      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999);

      const filteredOrders = allOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= startDate && orderDate <= endDate;
      });

      const totalRevenue = filteredOrders.reduce((sum, order) => sum + (Number(order.totalPrice) || 0), 0);
      
      const productsRes = await fetch('http://localhost:5000/api/mice');
      const productsData = await productsRes.json();
      const totalProducts = productsData.total || productsData.mice?.length || 0;

      let totalUsers = 0;
      try {
        const usersRes = await fetch('http://localhost:5000/api/users/count', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          totalUsers = usersData.count || 0;
        }
      } catch (err) {
        console.log('User count not available');
      }

      setStats({
        totalOrders: filteredOrders.length,
        totalRevenue: totalRevenue,
        totalProducts: totalProducts,
        totalUsers: totalUsers
      });

      const monthlySales = processMonthlyData(filteredOrders);
      setMonthlyData(monthlySales);

    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const processMonthlyData = (orders) => {
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    
    const isFullYear = startDate.getMonth() === 0 && 
                      startDate.getDate() === 1 && 
                      endDate >= new Date(startDate.getFullYear(), 11, 31);

    if (isFullYear) {
      const year = startDate.getFullYear();
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      const monthlyMap = {};
      months.forEach((month, index) => {
        monthlyMap[index] = { month: month, sales: 0, orders: 0, revenue: 0 };
      });

      orders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        if (orderDate.getFullYear() === year) {
          const monthIndex = orderDate.getMonth();
          monthlyMap[monthIndex].orders += 1;
          monthlyMap[monthIndex].revenue += Number(order.totalPrice) || 0;
          monthlyMap[monthIndex].sales += 1;
        }
      });

      return Object.values(monthlyMap).map(data => ({
        month: data.month,
        sales: data.sales,
        revenue: parseFloat(data.revenue.toFixed(2))
      }));
    } else {
      const monthlyMap = {};

      orders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = orderDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = { month: monthLabel, sales: 0, revenue: 0 };
        }

        monthlyMap[monthKey].sales += 1;
        monthlyMap[monthKey].revenue += Number(order.totalPrice) || 0;
      });

      return Object.keys(monthlyMap)
        .sort()
        .map(key => ({
          month: monthlyMap[key].month,
          sales: monthlyMap[key].sales,
          revenue: parseFloat(monthlyMap[key].revenue.toFixed(2))
        }));
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ 
        mb: 4, 
        pb: 3, 
        borderBottom: '1px solid rgba(110, 231, 255, 0.2)'
      }}>
        <Typography variant="h4" gutterBottom sx={{ 
          mb: 1, 
          fontWeight: 600,
          background: 'linear-gradient(90deg, #6ee7ff 0%, #4caf50 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Dashboard Overview
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
          Monitor your business metrics and performance
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            bgcolor: 'rgba(0, 0, 0, 0.4)', 
            border: '1px solid rgba(110, 231, 255, 0.2)',
            borderRadius: 2,
            transition: 'all 0.3s ease',
            '&:hover': {
              border: '1px solid rgba(110, 231, 255, 0.5)',
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 24px rgba(110, 231, 255, 0.15)'
            }
          }}>
            <CardContent sx={{ position: 'relative', overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ zIndex: 2 }}>
                  <Typography color="text.secondary" variant="body2" sx={{ mb: 1, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>Total Orders</Typography>
                  <Typography variant="h3" sx={{ color: '#6ee7ff', fontWeight: 600 }}>{stats.totalOrders}</Typography>
                </Box>
                <ShoppingCartIcon sx={{ fontSize: 60, color: '#6ee7ff', opacity: 0.15, position: 'absolute', right: 16, top: 16 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            bgcolor: 'rgba(0, 0, 0, 0.4)', 
            border: '1px solid rgba(76, 175, 80, 0.2)',
            borderRadius: 2,
            transition: 'all 0.3s ease',
            '&:hover': {
              border: '1px solid rgba(76, 175, 80, 0.5)',
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 24px rgba(76, 175, 80, 0.15)'
            }
          }}>
            <CardContent sx={{ position: 'relative', overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ zIndex: 2 }}>
                  <Typography color="text.secondary" variant="body2" sx={{ mb: 1, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>Total Revenue</Typography>
                  <Typography variant="h3" sx={{ color: '#4caf50', fontWeight: 600 }}>₱{stats.totalRevenue.toFixed(2)}</Typography>
                </Box>
                <AttachMoneyIcon sx={{ fontSize: 60, color: '#4caf50', opacity: 0.15, position: 'absolute', right: 16, top: 16 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            bgcolor: 'rgba(0, 0, 0, 0.4)', 
            border: '1px solid rgba(206, 147, 216, 0.2)',
            borderRadius: 2,
            transition: 'all 0.3s ease',
            '&:hover': {
              border: '1px solid rgba(206, 147, 216, 0.5)',
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 24px rgba(206, 147, 216, 0.15)'
            }
          }}>
            <CardContent sx={{ position: 'relative', overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ zIndex: 2 }}>
                  <Typography color="text.secondary" variant="body2" sx={{ mb: 1, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>Total Products</Typography>
                  <Typography variant="h3" sx={{ color: '#ce93d8', fontWeight: 600 }}>{stats.totalProducts}</Typography>
                </Box>
                <InventoryIcon sx={{ fontSize: 60, color: '#ce93d8', opacity: 0.15, position: 'absolute', right: 16, top: 16 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            bgcolor: 'rgba(0, 0, 0, 0.4)', 
            border: '1px solid rgba(255, 152, 0, 0.2)',
            borderRadius: 2,
            transition: 'all 0.3s ease',
            '&:hover': {
              border: '1px solid rgba(255, 152, 0, 0.5)',
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 24px rgba(255, 152, 0, 0.15)'
            }
          }}>
            <CardContent sx={{ position: 'relative', overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ zIndex: 2 }}>
                  <Typography color="text.secondary" variant="body2" sx={{ mb: 1, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>Total Users</Typography>
                  <Typography variant="h3" sx={{ color: '#ff9800', fontWeight: 600 }}>{stats.totalUsers}</Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 60, color: '#ff9800', opacity: 0.15, position: 'absolute', right: 16, top: 16 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ 
        p: 3, 
        mb: 3, 
        bgcolor: 'rgba(0, 0, 0, 0.4)', 
        border: '1px solid rgba(110, 231, 255, 0.1)',
        borderRadius: 2,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 500, color: '#6ee7ff' }}>Sales Chart</Typography>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              label="Start Date"
              type="date"
              size="small"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              sx={{ 
                minWidth: 150,
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(0, 0, 0, 0.3)',
                  '&:hover fieldset': { borderColor: '#6ee7ff' }
                }
              }}
            />
            <TextField
              label="End Date"
              type="date"
              size="small"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              sx={{ 
                minWidth: 150,
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(0, 0, 0, 0.3)',
                  '&:hover fieldset': { borderColor: '#6ee7ff' }
                }
              }}
            />
            
            <FormControl size="small" sx={{ 
              minWidth: 120,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(0, 0, 0, 0.3)',
                '&:hover fieldset': { borderColor: '#6ee7ff' }
              }
            }}>
              <InputLabel>Chart Type</InputLabel>
              <Select value={chartType} label="Chart Type" onChange={(e) => setChartType(e.target.value)}>
                <MenuItem value="line">Line Chart</MenuItem>
                <MenuItem value="bar">Bar Chart</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        <ResponsiveContainer width="100%" height={400}>
          {chartType === 'line' ? (
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="month" stroke="#999" tick={{ fill: '#999' }} />
              <YAxis stroke="#999" tick={{ fill: '#999' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} labelStyle={{ color: '#6ee7ff' }} />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#6ee7ff" strokeWidth={2} name="Orders" dot={{ fill: '#6ee7ff', r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="revenue" stroke="#4caf50" strokeWidth={2} name="Revenue (₱)" dot={{ fill: '#4caf50', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          ) : (
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="month" stroke="#999" tick={{ fill: '#999' }} />
              <YAxis stroke="#999" tick={{ fill: '#999' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} labelStyle={{ color: '#6ee7ff' }} />
              <Legend />
              <Bar dataKey="sales" fill="#6ee7ff" name="Orders" />
              <Bar dataKey="revenue" fill="#4caf50" name="Revenue (₱)" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </Paper>

      <Paper sx={{ 
        p: 3, 
        bgcolor: 'rgba(0, 0, 0, 0.4)', 
        border: '1px solid rgba(110, 231, 255, 0.1)',
        borderRadius: 2,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}>
        <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', fontWeight: 500, color: '#6ee7ff', mb: 3 }}>System Overview</Typography>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={[
            { name: 'Orders', value: stats.totalOrders },
            { name: 'Products', value: stats.totalProducts },
            { name: 'Users', value: stats.totalUsers }
          ]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="name" stroke="#999" tick={{ fill: '#999' }} />
            <YAxis stroke="#999" tick={{ fill: '#999' }} />
            <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} labelStyle={{ color: '#6ee7ff' }} />
            <Legend />
            <Bar dataKey="value" fill="#6ee7ff" name="Count" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
}

export default function AdminDashboard() {
  const { userInfo, setToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!userInfo || !userInfo.isAdmin) {
      navigate('/login');
    }
  }, [userInfo, navigate]);

  const handleLogout = () => {
    setToken('');
    navigate('/login');
  };

  if (!userInfo || !userInfo.isAdmin) {
    return null;
  }

  // Check if we're on the main /admin route or /admin/dashboard
  const isDashboardRoute = location.pathname === '/admin' || location.pathname === '/admin/dashboard';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1, 
        bgcolor: '#12161a',
        boxShadow: '0 2px 20px rgba(0, 0, 0, 0.5)',
        borderBottom: '1px solid rgba(110, 231, 255, 0.1)'
      }}>
        <Toolbar>
          <DashboardIcon sx={{ mr: 2, color: '#6ee7ff' }} />
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600, letterSpacing: 0.5 }}>
            Admin Dashboard
          </Typography>
          <Button 
            color="inherit" 
            startIcon={<LogoutIcon />} 
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              px: 2,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'rgba(110, 231, 255, 0.1)',
                color: '#6ee7ff'
              }
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: '#12161a',
            borderRight: '1px solid rgba(110, 231, 255, 0.2)',
            backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(110,231,255,0.03) 100%)'
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  selected={location.pathname === item.path}
                  sx={{
                    mx: 1,
                    borderRadius: 1,
                    transition: 'all 0.2s ease',
                    '&.Mui-selected': {
                      bgcolor: 'rgba(110, 231, 255, 0.15)',
                      borderLeft: '3px solid #6ee7ff',
                      '&:hover': {
                        bgcolor: 'rgba(110, 231, 255, 0.2)',
                      }
                    },
                    '&:hover': {
                      bgcolor: 'rgba(110, 231, 255, 0.08)',
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: '#6ee7ff', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ 
                      fontSize: '0.9rem', 
                      fontWeight: location.pathname === item.path ? 600 : 400 
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      
      <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: '#0b0d10' }}>
        <Toolbar />
        {isDashboardRoute ? <DashboardHome /> : <Outlet />}
      </Box>
    </Box>
  );
}
