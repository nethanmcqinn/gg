import React, { useEffect, useState } from 'react';
import { Box, TextField, Select, MenuItem, FormControl, InputLabel, Button, Slider, Typography, Switch, FormControlLabel } from '@mui/material';
import { getMice } from '../services/api.js';

export default function FilterPanel({ filters, onChange, onClear }) {
  const [brands, setBrands] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 200]);

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
    <Box sx={{ p: 2 }}>
      <TextField
        label="Search"
        value={filters.q}
        onChange={(e) => onChange({ q: e.target.value, page: 1 })}
        fullWidth
        size="small"
        sx={{ mb: 2 }}
      />

      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Brand</InputLabel>
        <Select
          label="Brand"
          value={filters.brand}
          onChange={(e) => onChange({ brand: e.target.value, page: 1 })}
        >
          <MenuItem value="">All</MenuItem>
          {brands.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
        </Select>
      </FormControl>

      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
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

      <FormControlLabel
        control={<Switch checked={filters.rgb === 'true'} onChange={(e) => onChange({ rgb: e.target.checked ? 'true' : '', page: 1 })} />}
        label="RGB"
        sx={{ mb: 2 }}
      />

      <Box sx={{ mb: 2 }}>
        <Typography variant="caption">Price range</Typography>
        <Slider
          value={[filters.minPrice || priceRange[0], filters.maxPrice || priceRange[1]]}
          min={priceRange[0]}
          max={priceRange[1]}
          onChange={(e, value) => {
            const [min, max] = value;
            onChange({ minPrice: min, maxPrice: max, page: 1 });
          }}
          valueLabelDisplay="auto"
        />
      </Box>

      <TextField
        label="Min DPI"
        value={filters.minDpi || ''}
        onChange={(e) => onChange({ minDpi: e.target.value, page: 1 })}
        fullWidth
        size="small"
        sx={{ mb: 2 }}
      />

      <TextField
        label="Max DPI"
        value={filters.maxDpi || ''}
        onChange={(e) => onChange({ maxDpi: e.target.value, page: 1 })}
        fullWidth
        size="small"
        sx={{ mb: 2 }}
      />

      <TextField
        label="Min Weight (g)"
        value={filters.minWeight || ''}
        onChange={(e) => onChange({ minWeight: e.target.value, page: 1 })}
        fullWidth
        size="small"
        sx={{ mb: 2 }}
      />

      <TextField
        label="Max Weight (g)"
        value={filters.maxWeight || ''}
        onChange={(e) => onChange({ maxWeight: e.target.value, page: 1 })}
        fullWidth
        size="small"
        sx={{ mb: 2 }}
      />

      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Sort By</InputLabel>
        <Select label="Sort By" value={filters.sort} onChange={(e) => onChange({ sort: e.target.value, page: 1 })}>
          <MenuItem value="name">Name</MenuItem>
          <MenuItem value="price">Price (asc)</MenuItem>
          <MenuItem value="-price">Price (desc)</MenuItem>
          <MenuItem value="rating">Rating</MenuItem>
        </Select>
      </FormControl>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button variant="outlined" onClick={onClear} fullWidth>Clear</Button>
        <Button variant="contained" onClick={() => onChange({ page: 1 })} fullWidth>Apply</Button>
      </Box>
    </Box>
  );
}
