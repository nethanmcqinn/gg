import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { API_URL } from '../services/api.js';
import { reviewService } from '../services/review';
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar
} from '@mui/material';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import RateReviewIcon from '@mui/icons-material/RateReview';

export default function AdminLanding() {
  const { user, isAuthed, token } = useAuth();
  const [miceCount, setMiceCount] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/mice?limit=100`);
        const json = await res.json();
        const items = json.items || (Array.isArray(json) ? json : []);
        if (mounted) setMiceCount(items.length || 0);

        const { data, error } = await reviewService.getAllReviews(token);
        if (!error && mounted) setReviews(Array.isArray(data) ? data.slice(0, 6) : []);
      } catch (err) {
        console.error('Admin dashboard load error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [token]);

  if (!isAuthed) {
    return (
      <Container sx={{ mt: 6 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>Admin</Typography>
          <Typography sx={{ mb: 2 }}>You must be logged in as an admin to access admin tools.</Typography>
          <Button component={Link} to="/login" variant="contained">Go to Login</Button>
        </Paper>
      </Container>
    );
  }

  if (!user?.isAdmin) {
    return (
      <Container sx={{ mt: 6 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>Admin</Typography>
          <Typography sx={{ mb: 2 }}>Access denied. Admins only.</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }} maxWidth="lg">
      <Grid container spacing={3}>
        {/* Sidebar */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                <ManageSearchIcon />
              </Avatar>
              <Box>
                <Typography variant="subtitle1">Welcome, {user.email}</Typography>
                <Typography variant="caption" color="text.secondary">Administrator</Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Button component={Link} to="/admin/mice" variant="contained" fullWidth startIcon={<Inventory2Icon />} sx={{ mb: 1 }}>Manage Mice</Button>
            <Button component={Link} to="/admin/reviews" variant="outlined" fullWidth startIcon={<RateReviewIcon />}>Manage Reviews</Button>
          </Paper>
        </Grid>

        {/* Main */}
        <Grid item xs={12} md={9}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Mice in catalog</Typography>
                <Typography variant="h4">{loading ? '—' : miceCount}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Total reviews</Typography>
                <Typography variant="h4">{loading ? '—' : (reviews.length ? reviews.length : '—')}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Quick Actions</Typography>
                <Box sx={{ mt: 1 }}>
                  <Button component={Link} to="/admin/mice" variant="contained" sx={{ mr: 1 }}>Add Mouse</Button>
                  <Button component={Link} to="/admin/reviews" variant="outlined">Review Moderation</Button>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6">Recent Reviews</Typography>
                <List>
                  {loading ? (
                    <ListItem><ListItemText primary="Loading..." /></ListItem>
                  ) : reviews.length === 0 ? (
                    <ListItem><ListItemText primary="No recent reviews" /></ListItem>
                  ) : (
                    reviews.map((r) => (
                      <ListItem key={r._id} alignItems="flex-start">
                        <ListItemText
                          primary={`${r.user?.username || r.user?.email || 'User'} — ${r.mouse?.name || ''}`}
                          secondary={r.comment}
                        />
                      </ListItem>
                    ))
                  )}
                </List>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
}
