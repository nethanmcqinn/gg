import { useState, useEffect } from 'react';
import { Box, IconButton } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export default function ImageSlideshow({ images = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  if (!images || images.length === 0) {
    return (
      <Box className="product-media">
        <Box
          sx={{
            width: '100%',
            height: 400,
            backgroundColor: '#0f1317',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '16px',
            border: '1px solid var(--border)',
          }}
        >
          <span style={{ color: 'var(--muted)' }}>No images available</span>
        </Box>
      </Box>
    );
  }

  // Single image - no slideshow needed
  if (images.length === 1) {
    return (
      <Box className="product-media">
        <img
          src={images[0]}
          alt="Product"
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: 400,
            objectFit: 'contain',
          }}
        />
      </Box>
    );
  }

  // Multiple images - show slideshow
  return (
    <Box className="product-media">
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: 400,
          backgroundColor: '#0f1317',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Main Image */}
        <Box
          component="img"
          src={images[currentIndex]}
          alt={`Slide ${currentIndex + 1}`}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            animation: 'fadeIn 0.3s ease-in-out',
          }}
        />

        {/* Previous Button */}
        <IconButton
          onClick={goToPrevious}
          sx={{
            position: 'absolute',
            left: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'var(--acc)',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: '#fff',
            },
            zIndex: 10,
          }}
        >
          <ChevronLeftIcon />
        </IconButton>

        {/* Next Button */}
        <IconButton
          onClick={goToNext}
          sx={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'var(--acc)',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: '#fff',
            },
            zIndex: 10,
          }}
        >
          <ChevronRightIcon />
        </IconButton>

        {/* Image Counter */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            color: 'var(--fg)',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '0.9em',
            fontWeight: 600,
            zIndex: 10,
          }}
        >
          {currentIndex + 1} / {images.length}
        </Box>
      </Box>

      {/* Thumbnail Navigation */}
      <Box
        sx={{
          display: 'flex',
          gap: 10,
          marginTop: 20,
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        {images.map((image, index) => (
          <Box
            key={index}
            component="img"
            src={image}
            alt={`Thumbnail ${index + 1}`}
            onClick={() => goToSlide(index)}
            sx={{
              width: 80,
              height: 80,
              objectFit: 'contain',
              borderRadius: '8px',
              border: currentIndex === index ? '3px solid var(--acc)' : '1px solid var(--border)',
              cursor: 'pointer',
              transition: 'all 0.3s',
              backgroundColor: '#0f1317',
              padding: '4px',
              '&:hover': {
                borderColor: 'var(--acc)',
                transform: 'scale(1.05)',
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
