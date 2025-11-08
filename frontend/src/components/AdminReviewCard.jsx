import { useState } from 'react';
import { reviewService } from '../services/review';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Rating,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export default function AdminReviewCard({ review, token, onRemoved, onModerated }) {
  const [isModerating, setIsModerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reason, setReason] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleApprove = async () => {
    setIsModerating(true);
    const { data, error } = await reviewService.moderateReview(review._id, 'approved', reason, token);
    setIsModerating(false);
    if (error) {
      alert(error);
    } else {
      if (onModerated) onModerated(data);
    }
  };

  const handleHide = async () => {
    setIsModerating(true);
    const { data, error } = await reviewService.moderateReview(review._id, 'hidden', reason, token);
    setIsModerating(false);
    if (error) {
      alert(error);
    } else {
      if (onModerated) onModerated(data);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const { data, error } = await reviewService.deleteReview(review._id, token);
    setIsDeleting(false);
    if (error) {
      alert(error);
    } else {
      if (onRemoved) onRemoved(review._id);
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="subtitle1">{review.user?.username} — {review.user?.email}</Typography>
            <Rating value={review.rating} readOnly />
            <Typography variant="body2" color="text.secondary">On: {review.mouse?.name}</Typography>
            <Typography sx={{ mt: 1 }}>{review.comment}</Typography>
          </Box>

          <Box>
            <Stack spacing={1}>
              <Button variant="contained" color="primary" onClick={() => setConfirmOpen(true)}>Moderate</Button>
              <Button variant="outlined" color="error" onClick={handleHide} disabled={isModerating}>Hide</Button>
              <IconButton color="error" onClick={handleDelete} disabled={isDeleting}><DeleteIcon /></IconButton>
            </Stack>
          </Box>
        </Box>

        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
          <DialogTitle>Moderate review</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 1 }}><strong>Review:</strong> {review.comment}</Typography>
            <TextField
              label="Reason (optional)"
              fullWidth
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              multiline
              rows={3}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleApprove} disabled={isModerating} variant="contained">Approve</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}
