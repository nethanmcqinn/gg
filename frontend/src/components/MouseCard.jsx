import { Link } from 'react-router-dom';
import { Button } from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import { useCart } from '../context/CartContext.jsx';
import { useState, useEffect } from 'react';

export default function MouseCard({ mouse }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // Auto-rotate images on hover
  useEffect(() => {
    if (!isHovering || !mouse.images || mouse.images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % mouse.images.length);
    }, 800); // Change image every 800ms

    return () => clearInterval(interval);
  }, [isHovering, mouse.images]);

  const handleAddToCart = (e) => {
    e.preventDefault(); // Prevent navigation to product page
    addToCart(mouse);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
    setCurrentImageIndex(0);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setCurrentImageIndex(0);
  };

  // Get the current image to display
  const currentImage = mouse.images?.[currentImageIndex] || mouse.images?.[0];
  const totalImages = mouse.images?.length || 0;
  const hasMultipleImages = totalImages > 1;

  return (
    <div className="card" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <Link to={`/product/${mouse.slug}`} className="card-media">
        <img src={currentImage} alt={mouse.name} loading="lazy" />
        
        {/* Image Counter - Only show when hovering and multiple images */}
        {isHovering && hasMultipleImages && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: '#6ee7ff',
            padding: '4px 10px',
            borderRadius: '4px',
            fontSize: '0.85em',
            fontWeight: 600,
            zIndex: 5,
            pointerEvents: 'none',
          }}>
            {currentImageIndex + 1} / {totalImages}
          </div>
        )}
      </Link>
      <div className="card-body">
        <h3 className="card-title">{mouse.name}</h3>
        <p className="muted">{mouse.brand}</p>
        <div className="card-meta">
          <span>${mouse.price?.toFixed(2)}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Show stars only when there are reviews; otherwise show 'No reviews' */}
            { (mouse.reviewCount ?? 0) > 0 ? (
              <>
                <span>⭐ {Number(mouse.rating || 0).toFixed(1)}</span>
                <small style={{ color: 'rgba(255,255,255,0.7)' }}>({mouse.reviewCount})</small>
              </>
            ) : (
              <small style={{ color: 'rgba(255,255,255,0.6)' }}>No reviews</small>
            )}
          </span>
        </div>
        <Button
          variant={added ? 'outlined' : 'contained'}
          size="small"
          startIcon={<AddShoppingCartIcon />}
          onClick={handleAddToCart}
          fullWidth
          sx={{ mt: 1 }}
        >
          {added ? 'Added!' : 'Add to Cart'}
        </Button>
      </div>
    </div>
  );
}


