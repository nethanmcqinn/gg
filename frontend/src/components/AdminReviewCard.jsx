import { useState } from 'react';
import { reviewService } from '../services/review';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Rating,
  IconButton,
  Stack
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export default function AdminReviewCard({ review, token, onRemoved, onModerated }) {
  const [isDeleting, setIsDeleting] = useState(false);

  // keeping only delete functionality for admins in this card

  const handleDelete = async () => {
    setIsDeleting(true);
    const { data, error } = await reviewService.deleteReview(review._id, token);
    setIsDeleting(false);
    if (error) {
      alert(error);
    } else {
      const deletedId = data?.deletedId || review._id;
      if (onRemoved) onRemoved(deletedId);
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
              <IconButton color="error" onClick={handleDelete} disabled={isDeleting}><DeleteIcon /></IconButton>
            </Stack>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
