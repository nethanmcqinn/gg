import React, { useEffect, useState } from 'react';
import { 
  Box, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Button, 
  Typography,
  InputAdornment,
  Paper,
  Collapse,
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getMice } from '../services/api.js';

export default function FilterPanel({ filters, onChange, onClear }) {
  const [brands, setBrands] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getMice({ limit: 60 });
        const items = res.items || [];
        const uniq = Array.from(new Set(items.map(i => i.brand).filter(Boolean))).sort();
        if (mounted) setBrands(uniq);

        // derive price range suggestions
        const prices = items.map(i => i.price || 0);
        const min = Math.min(...prices, 0);
        const max = Math.max(...prices, 200);
        if (mounted) setPriceRange([Math.floor(min), Math.ceil(max)]);
      } catch (err) {
        console.error('Failed to load brands for filter', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <Paper elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
      {/* Main Filter Bar */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        gap: 2, 
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        {/* Search */}
        <TextField
          placeholder="Search mice..."
          value={filters.q}
          onChange={(e) => onChange({ q: e.target.value, page: 1 })}
          size="small"
          sx={{ flexGrow: 1, minWidth: '200px' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        {/* Brand */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Brand</InputLabel>
          <Select
            label="Brand"
            value={filters.brand}
            onChange={(e) => onChange({ brand: e.target.value, page: 1 })}
          >
            <MenuItem value="">All Brands</MenuItem>
            {brands.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
          </Select>
        </FormControl>

        {/* Connection */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Connection</InputLabel>
          <Select
            label="Connection"
            value={filters.connection}
            onChange={(e) => onChange({ connection: e.target.value, page: 1 })}
          >
            <MenuItem value="">Any</MenuItem>
            <MenuItem value="wired">Wired</MenuItem>
            <MenuItem value="wireless">Wireless</MenuItem>
          </Select>
        </FormControl>

        {/* Price Range */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Price</InputLabel>
          <Select
            label="Price"
            value={
              filters.minPrice || filters.maxPrice 
                ? `${filters.minPrice || 0}-${filters.maxPrice || 999}` 
                : ''
            }
            onChange={(e) => {
              const val = e.target.value;
              if (val === '') {
                onChange({ minPrice: undefined, maxPrice: undefined, page: 1 });
              } else {
                const [min, max] = val.split('-').map(Number);
                onChange({ minPrice: min, maxPrice: max, page: 1 });
              }
            }}
          >
            <MenuItem value="">Any Price</MenuItem>
            <MenuItem value="0-50">Under ₱50</MenuItem>
            <MenuItem value="50-100">₱50 - ₱100</MenuItem>
            <MenuItem value="100-150">₱100 - ₱150</MenuItem>
            <MenuItem value="150-999">₱150+</MenuItem>
          </Select>
        </FormControl>

        {/* Sort */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Sort By</InputLabel>
          <Select 
            label="Sort By" 
            value={filters.sort} 
            onChange={(e) => onChange({ sort: e.target.value, page: 1 })}
          >
            <MenuItem value="name">Name</MenuItem>
            <MenuItem value="price">Price: Low to High</MenuItem>
            <MenuItem value="-price">Price: High to Low</MenuItem>
            <MenuItem value="rating">Rating</MenuItem>
          </Select>
        </FormControl>

        {/* Min Rating quick filter */}
        {/* <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Min Rating</InputLabel>
          <Select
            label="Min Rating"
            value={filters.minRating || ''}
            onChange={(e) => onChange({ minRating: e.target.value || undefined, page: 1 })}
          >
            <MenuItem value="">Any</MenuItem>
            <MenuItem value={1}>1★+</MenuItem>
            <MenuItem value={2}>2★+</MenuItem>
            <MenuItem value={3}>3★+</MenuItem>
            <MenuItem value={4}>4★+</MenuItem>
            <MenuItem value={5}>5★</MenuItem>
          </Select>
        </FormControl> */}

        {/* Advanced Filters Toggle */}
        <Button
          size="small"
          onClick={() => setShowAdvanced(!showAdvanced)}
          startIcon={<FilterListIcon />}
          endIcon={<ExpandMoreIcon sx={{ 
            transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s'
          }} />}
          sx={{ minWidth: 150 }}
        >
          More Filters
        </Button>

        {/* Clear Button */}
        <Button
          size="small"
          variant="outlined"
          onClick={onClear}
          startIcon={<ClearIcon />}
          sx={{ minWidth: 100 }}
        >
          Clear
        </Button>
      </Box>

      {/* Advanced Filters */}
      <Collapse in={showAdvanced}>
        <Box sx={{ 
          p: 2, 
          pt: 0, 
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mr: 1 }}>
            Advanced:
          </Typography>

          {/* Has reviews */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Reviews</InputLabel>
            <Select
              label="Reviews"
              value={filters.hasReviews === true ? 'has' : filters.hasReviews === 'true' ? 'has' : (filters.hasReviews === false ? 'none' : '')}
              onChange={(e) => {
                const v = e.target.value;
                if (v === 'has') onChange({ hasReviews: 'true', page: 1 });
                else if (v === 'none') onChange({ hasReviews: 'false', page: 1 });
                else onChange({ hasReviews: undefined, page: 1 });
              }}
            >
              <MenuItem value="">Any</MenuItem>
              <MenuItem value="has">Has reviews</MenuItem>
              <MenuItem value="none">No reviews</MenuItem>
            </Select>
          </FormControl>

          {/* RGB Filter */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>RGB</InputLabel>
            <Select
              label="RGB"
              value={filters.rgb || ''}
              onChange={(e) => onChange({ rgb: e.target.value, page: 1 })}
            >
              <MenuItem value="">Any</MenuItem>
              <MenuItem value="true">RGB Only</MenuItem>
            </Select>
          </FormControl>

          {/* DPI Range */}
          <TextField
            label="Min DPI"
            value={filters.minDpi || ''}
            onChange={(e) => onChange({ minDpi: e.target.value, page: 1 })}
            size="small"
            type="number"
            sx={{ width: 120 }}
          />
          <TextField
            label="Max DPI"
            value={filters.maxDpi || ''}
            onChange={(e) => onChange({ maxDpi: e.target.value, page: 1 })}
            size="small"
            type="number"
            sx={{ width: 120 }}
          />

          {/* Weight Range */}
          <TextField
            label="Min Weight (g)"
            value={filters.minWeight || ''}
            onChange={(e) => onChange({ minWeight: e.target.value, page: 1 })}
            size="small"
            type="number"
            sx={{ width: 140 }}
          />
          <TextField
            label="Max Weight (g)"
            value={filters.maxWeight || ''}
            onChange={(e) => onChange({ maxWeight: e.target.value, page: 1 })}
            size="small"
            type="number"
            sx={{ width: 140 }}
          />
        </Box>
      </Collapse>
    </Paper>
  );
}
