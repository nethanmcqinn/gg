import React, { useEffect, useMemo, useState } from 'react';
import { Box, Grid, Container, Pagination } from '@mui/material';
import { getMice } from '../services/api.js';
import MouseCard from '../components/MouseCard.jsx';
import Skeleton from '../components/Skeleton.jsx';
import FilterPanel from '../components/FilterPanel.jsx';

export default function Catalog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    q: '',
    brand: '',
    connection: '',
    rgb: '',
    sort: 'name',
    page: 1,
    limit: 12,
    minPrice: undefined,
    maxPrice: undefined,
    minDpi: undefined,
    maxDpi: undefined,
    minWeight: undefined,
    maxWeight: undefined,
    hasReviews: undefined,
  });

  const [totalPages, setTotalPages] = useState(1);

  const params = useMemo(() => {
    // map local filter names to backend query params
    const p = {
      q: filters.q || undefined,
      brand: filters.brand || undefined,
      connection: filters.connection || undefined,
      rgb: filters.rgb || undefined,
      hasReviews: filters.hasReviews || undefined,
      sort: filters.sort || undefined,
      page: filters.page || 1,
      limit: filters.limit || 12,
    };
    if (filters.minPrice !== undefined) p.minPrice = filters.minPrice;
    if (filters.maxPrice !== undefined) p.maxPrice = filters.maxPrice;
    // backend doesn't support dpi/weight yet — we'll filter client-side
    return p;
  }, [filters]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await getMice(params);
        let list = res.items || [];

        // client-side DPI/weight filtering
        if (filters.minDpi) list = list.filter(i => (i.dpiMax || 0) >= Number(filters.minDpi));
        if (filters.maxDpi) list = list.filter(i => (i.dpiMax || 0) <= Number(filters.maxDpi));
        if (filters.minWeight) list = list.filter(i => (i.weightGrams || 0) >= Number(filters.minWeight));
        if (filters.maxWeight) list = list.filter(i => (i.weightGrams || 0) <= Number(filters.maxWeight));

        if (mounted) {
          setItems(list);
          setTotalPages(res.totalPages || 1);
        }
      } catch (err) {
        console.error('Failed to load catalog', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [params, filters.minDpi, filters.maxDpi, filters.minWeight, filters.maxWeight]);

  function handleFilterChange(patch) {
    setFilters(f => ({ ...f, ...patch }));
  }

  function handleClear() {
    setFilters({
      q: '', brand: '', connection: '', rgb: '', sort: 'name', page: 1, limit: 12,
    });
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 5 }}>
      {/* Filter Panel at Top */}
      <FilterPanel filters={filters} onChange={handleFilterChange} onClear={handleClear} />

      {/* Product Grid */}
      <Box sx={{ mb: 2 }}>
        {loading ? (
          <Grid container spacing={2}>
            {Array.from({ length: 12 }).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={i}><Skeleton /></Grid>
            ))}
          </Grid>
        ) : (
          <Grid container spacing={2}>
            {items.map(m => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={m._id || m.slug}>
                <MouseCard mouse={m} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Pagination */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Pagination
          count={totalPages}
          page={filters.page}
          onChange={(e, p) => handleFilterChange({ page: p })}
          color="primary"
          size="large"
        />
      </Box>
    </Container>
  );
}


