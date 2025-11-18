import { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import * as yup from 'yup';
import { 
  Box, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  FormControlLabel, 
  Checkbox, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Stack,
  ImageList,
  ImageListItem,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { authHeaders } from '../services/auth.js';
import { brandService } from '../services/brand';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Validation schema for product form
const productSchema = yup.object().shape({
  name: yup
    .string()
    .required('Product name is required')
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must not exceed 100 characters'),
  brand: yup
    .string()
    .required('Brand is required')
    .min(2, 'Brand must be at least 2 characters')
    .max(50, 'Brand must not exceed 50 characters'),
  slug: yup
    .string()
    .required('Slug is required')
    .matches(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only')
    .min(3, 'Slug must be at least 3 characters'),
  price: yup
    .number()
    .required('Price is required')
    .positive('Price must be positive')
    .max(9999, 'Price must not exceed 9999'),
  sensor: yup
    .string()
    .max(100, 'Sensor must not exceed 100 characters'),
  dpiMax: yup
    .number()
    .positive('DPI must be positive')
    .max(50000, 'DPI seems unrealistic'),
  weightGrams: yup
    .number()
    .positive('Weight must be positive')
    .max(1000, 'Weight seems unrealistic'),
  connection: yup
    .string()
    .oneOf(['wired', 'wireless'], 'Connection must be wired or wireless'),
});

export default function AdminMice() {
  const { token, isAuthed, setToken } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '', brand: '', slug: '', price: '', sensor: '', 
    dpiMax: '', weightGrams: '', connection: 'wired', rgb: false, images: []
  });
  const [brands, setBrands] = useState([]);
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [formErrors, setFormErrors] = useState({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/mice?limit=100`);
      const data = await res.json();
      setItems(data.items || []);
      // load brands for brand dropdown
      try {
        const { data: bdata } = await brandService.getAll();
        setBrands(bdata || []);
      } catch (e) {
        console.warn('Failed to load brands', e);
      }
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    // Clear error for this field
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  }

  function handleFileChange(e) {
    setFiles(Array.from(e.target.files || []));
  }

  async function uploadImages() {
    if (files.length === 0) return [];
    
    try {
      const fd = new FormData();
      files.forEach(file => fd.append('files', file));
      
      const res = await fetch(`${API_URL}/api/upload/images`, {
        method: 'POST',
        headers: { ...authHeaders(token) },
        body: fd,
      });
      
      if (!res.ok) {
        console.error('Upload failed:', await res.text());
        return [];
      }
      
      const { urls } = await res.json();
      return urls || [];
    } catch (e) {
      console.error('Upload error:', e);
      return [];
    }
  }

  async function saveMouse() {
    setHasSubmitted(true);
    setSaving(true);
    setFormErrors({});
    
    try {
      // Validate form data
      await productSchema.validate({
        name: form.name,
        brand: form.brand,
        slug: form.slug,
        price: Number(form.price) || 0,
        sensor: form.sensor,
        dpiMax: Number(form.dpiMax) || 0,
        weightGrams: Number(form.weightGrams) || 0,
        connection: form.connection,
      }, { abortEarly: false });
      
      const imageUrls = await uploadImages();
      const payload = {
        ...form,
        price: Number(form.price) || 0,
        dpiMax: Number(form.dpiMax) || 0,
        weightGrams: Number(form.weightGrams) || 0,
      };
      
      if (imageUrls.length > 0) {
        payload.images = [...form.images, ...imageUrls];
      }
      
      const url = editingId 
        ? `${API_URL}/api/mice/${editingId}`
        : `${API_URL}/api/mice`;
      
      const method = editingId ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) throw new Error('Save failed');
      
      handleCloseDialog();
      await load();
    } catch (e) {
      if (e.name === 'ValidationError') {
        // Handle Yup validation errors
        const validationErrors = {};
        e.inner.forEach(err => {
          validationErrors[err.path] = err.message;
        });
        setFormErrors(validationErrors);
      } else {
        console.error('Save error:', e);
        alert('Failed to save mouse: ' + e.message);
      }
    } finally {
      setSaving(false);
    }
  }

  // mouse: optional mouse object to prefill
  // options: { createCopy: boolean } - if true, open dialog in CREATE mode but prefill form from mouse
  function handleOpenDialog(mouse = null, options = {}) {
    setFormErrors({}); // Clear validation errors
    setHasSubmitted(false); // Reset submission state
    setHasSubmitted(false); // Reset submission state
    const createCopy = options.createCopy === true;
    if (mouse) {
      // If createCopy is true, we prefill form but keep editingId null so it creates a new mouse
      setEditingId(createCopy ? null : mouse._id);
      setForm({
        name: mouse.name || '',
        brand: mouse.brand || '',
        slug: createCopy ? `${mouse.slug}-copy` : mouse.slug || '',
        price: mouse.price || '',
        sensor: mouse.sensor || '',
        dpiMax: mouse.dpiMax || '',
        weightGrams: mouse.weightGrams || '',
        connection: mouse.connection || 'wired',
        rgb: mouse.rgb || false,
        images: mouse.images || []
      });
    } else {
      setEditingId(null);
      setForm({
        name: '', brand: '', slug: '', price: '', sensor: '',
        dpiMax: '', weightGrams: '', connection: 'wired', rgb: false, images: []
      });
    }
    setFiles([]);
    setOpenDialog(true);
  }

  function handleCloseDialog() {
    setOpenDialog(false);
    setEditingId(null);
    setFiles([]);
  }

  async function deleteMouse(id) {
    if (!confirm('Delete this mouse?')) return;
    try {
      await fetch(`${API_URL}/api/mice/${id}`, {
        method: 'DELETE',
        headers: { ...authHeaders(token) },
      });
      await load();
    } catch (e) {
      console.error('Delete error:', e);
    }
  }

  async function bulkDelete() {
    if (selectedRows.length === 0) {
      alert('Please select mice to delete');
      return;
    }
    
    if (!confirm(`⚠️ Are you sure you want to delete ${selectedRows.length} selected ${selectedRows.length === 1 ? 'mouse' : 'mice'}?\n\nThis action cannot be undone.`)) {
      return;
    }
      try {
        setLoading(true);
        const uniqueIds = Array.from(new Set(selectedRows.map(String)));
        if (!token) {
          alert('You must be logged in as admin to delete mice');
          return;
        }

        // Try server bulk endpoint first
        try {
          const bulkRes = await fetch(`${API_URL}/api/mice/bulk-delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
            body: JSON.stringify({ ids: uniqueIds }),
          });
          if (bulkRes.ok) {
            const result = await bulkRes.json();
            // If server deleted all, we're done
            if (result.deletedCount === uniqueIds.length) {
              alert(`✅ Deleted ${result.deletedCount} / ${uniqueIds.length} mice`);
              setSelectedRows([]);
              await load();
              return;
            }
            // If partial, determine which remain and fall back to per-id deletes for them
            // Fetch current list and compute remaining ids
            const listRes = await fetch(`${API_URL}/api/mice?limit=200`);
            const listJson = await listRes.json();
            const items = listJson.items || listJson;
            const remaining = uniqueIds.filter(id => items.some(it => String(it._id) === String(id)));
            if (remaining.length === 0) {
              alert(`✅ Deleted ${result.deletedCount} / ${uniqueIds.length} mice`);
              setSelectedRows([]);
              await load();
              return;
            }
            // Replace uniqueIds with remaining to delete individually
            uniqueIds.splice(0, uniqueIds.length, ...remaining);
          }
        } catch (e) {
          console.warn('Bulk endpoint failed or returned non-ok; will delete per-id', e);
        }

        // Now delete remaining ids individually (concurrent)
        const promises = uniqueIds.map(async (id) => {
          try {
            const res = await fetch(`${API_URL}/api/mice/${id}`, {
              method: 'DELETE',
              headers: { ...authHeaders(token) },
            });
            if (!res.ok) {
              let msg = 'Failed';
              try { const j = await res.json(); msg = j.message || msg; } catch {}
              return { id, ok: false, status: res.status, message: msg };
            }
            return { id, ok: true };
          } catch (err) {
            return { id, ok: false, status: 0, message: err.message || 'Network error' };
          }
        });

        const results = await Promise.all(promises);
        const failed = results.filter(r => !r.ok);
        const successCount = results.length - failed.length;

        if (failed.length === 0) {
          alert(`✅ Deleted ${successCount} / ${results.length} mice`);
        } else {
          alert(`✅ Deleted ${successCount} / ${results.length} mice\nFailed: ${failed.map(f => `${f.id} (${f.message})`).join(', ')}`);
        }

        setSelectedRows([]);
        await load();
      } catch (e) {
        console.error('Bulk delete error:', e);
        alert(`❌ Error: ${e.message}`);
      } finally {
        setLoading(false);
      }
  }

  function handleRemoveImage(index) {
    setForm(f => ({
      ...f,
      images: f.images.filter((_, i) => i !== index)
    }));
  }

  function toggleExpand(id) {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const columns = [
    { field: 'name', headerName: 'Name', width: 200, flex: 1 },
    { field: 'brand', headerName: 'Brand', width: 150 },
    { 
      field: 'price', 
      headerName: 'Price', 
      width: 120,
      valueFormatter: (value) => `$${value?.toFixed(2) || 0}`
    },
    { field: 'connection', headerName: 'Connection', width: 120 },
    {
      field: 'expand',
      headerName: '',
      width: 80,
      sortable: false,
      renderCell: (params) => {
        const expanded = expandedRows.has(params.row._id);
        return (
          <IconButton
            size="small"
            onClick={() => toggleExpand(params.row._id)}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      sortable: false,
      renderCell: (params) => {
        const mouse = params.row;
        return (
          <Stack direction="row" spacing={1}>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => handleOpenDialog(mouse)}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                size="small"
                color="error"
                onClick={() => deleteMouse(mouse._id)}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        );
      }
    }
  ];

  const rows = items.map(mouse => ({
    id: mouse._id,
    _id: mouse._id,
    name: mouse.name,
    brand: mouse.brand,
    price: mouse.price,
    connection: mouse.connection,
    ...mouse
  }));

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <h1>Admin • Mice Management</h1>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            color="error"
            size="large"
            startIcon={<DeleteSweepIcon />}
            onClick={bulkDelete}
            disabled={selectedRows.length === 0}
            sx={{
              animation: selectedRows.length > 0 ? 'pulse 2s infinite' : 'none',
              '@keyframes pulse': {
                '0%, 100%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.02)' }
              }
            }}
          >
            Bulk Delete
            <Chip 
              label={selectedRows.length} 
              size="small" 
              sx={{ ml: 1, bgcolor: 'white', color: 'error.main', fontWeight: 'bold' }}
            />
          </Button>
          {/* <Tooltip title={`Delete ${selectedRows.length} selected`}>
            <span>
              <IconButton
                color="error"
                onClick={bulkDelete}
                size="large"
                sx={{ ml: 1 }}
                disabled={selectedRows.length === 0}
              >
                <DeleteIcon />
              </IconButton>
            </span>
          </Tooltip> */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              // If exactly one row is selected, prefill create form from it (duplicate)
              if (selectedRows.length === 1) {
                const sel = items.find(it => String(it._id) === String(selectedRows[0]));
                if (sel) {
                  // open dialog in create (not edit) mode but with form prefilled
                  handleOpenDialog(sel, { createCopy: true });
                  return;
                }
              }
              handleOpenDialog();
            }}
          >
            Add Mouse
          </Button>
          {/* <Button variant="outlined" onClick={() => { setToken(''); navigate('/admin'); }}>
            Logout
          </Button> */}
        </Stack>
      </Box>

      {selectedRows.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {selectedRows.length} {selectedRows.length === 1 ? 'mouse' : 'mice'} selected. Click "Bulk Delete" to remove them.
        </Alert>
      )}

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          checkboxSelection
          disableRowSelectionOnClick
          getRowId={(row) => row._id}
          onRowSelectionModelChange={(newSelection) => {
            console.log('Selection changed:', newSelection);
            
            const selectedIds = newSelection?.ids 
              ? Array.from(newSelection.ids) 
              : (Array.isArray(newSelection) ? newSelection : []);
            setSelectedRows(selectedIds);
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } }
          }}
        />
      </Paper>

      {/* Expandable rows for details */}
      {items.map(mouse => {
        if (!expandedRows.has(mouse._id)) return null;
        return (
          <Paper key={mouse._id} sx={{ p: 2, mt: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <strong>Details:</strong>
                <Box sx={{ mt: 1 }}>
                  <p><strong>Sensor:</strong> {mouse.sensor || 'N/A'}</p>
                  <p><strong>Max DPI:</strong> {mouse.dpiMax || 'N/A'}</p>
                  <p><strong>Weight:</strong> {mouse.weightGrams}g</p>
                  <p><strong>RGB:</strong> {mouse.rgb ? 'Yes' : 'No'}</p>
                  <p><strong>Rating:</strong> {mouse.rating || 0}/5</p>
                  <p><strong>Slug:</strong> {mouse.slug}</p>
                </Box>
              </Box>
              <Box>
                <strong>Images:</strong>
                {mouse.images && mouse.images.length > 0 ? (
                  <ImageList cols={3} rowHeight={100} sx={{ mt: 1 }}>
                    {mouse.images.map((img, idx) => (
                      <ImageListItem key={idx}>
                        <img src={img} alt={`${mouse.name} ${idx + 1}`} loading="lazy" />
                      </ImageListItem>
                    ))}
                  </ImageList>
                ) : (
                  <p style={{ color: '#999' }}>No images</p>
                )}
              </Box>
            </Box>
          </Paper>
        );
      })}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? 'Edit Mouse' : 'Create Mouse'}</DialogTitle>
        <DialogContent>
          {hasSubmitted && Object.keys(formErrors).length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Please fix the validation errors below
            </Alert>
          )}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
            <TextField 
              name="name" 
              label="Name" 
              value={form.name} 
              onChange={handleChange} 
              fullWidth 
              error={!!formErrors.name}
              helperText={formErrors.name || 'Required'}
            />
            <FormControl fullWidth error={!!formErrors.brand}>
              <InputLabel id="brand-select-label">Brand</InputLabel>
              <Select
                labelId="brand-select-label"
                label="Brand"
                name="brand"
                value={form.brand}
                onChange={handleChange}
              >
                {brands.map(b => (
                  <MenuItem key={b._id} value={b.name}>{b.name}</MenuItem>
                ))}
              </Select>
              {formErrors.brand ? (
                <p style={{ color: '#f44336', fontSize: 12, margin: '6px 14px 0' }}>{formErrors.brand}</p>
              ) : (
                <p style={{ color: '#999', fontSize: 12, margin: '6px 14px 0' }}>Required</p>
              )}
            </FormControl>
            <TextField 
              name="slug" 
              label="Slug" 
              value={form.slug} 
              onChange={handleChange} 
              fullWidth 
              error={!!formErrors.slug}
              helperText={formErrors.slug || 'Lowercase, numbers, hyphens only'}
            />
            <TextField 
              name="price" 
              type="number" 
              label="Price" 
              value={form.price} 
              onChange={handleChange} 
              fullWidth 
              error={!!formErrors.price}
              helperText={formErrors.price || 'Required'}
            />
            <TextField 
              name="sensor" 
              label="Sensor" 
              value={form.sensor} 
              onChange={handleChange} 
              fullWidth 
              error={!!formErrors.sensor}
              helperText={formErrors.sensor}
            />
            <TextField 
              name="dpiMax" 
              type="number" 
              label="Max DPI" 
              value={form.dpiMax} 
              onChange={handleChange} 
              fullWidth 
              error={!!formErrors.dpiMax}
              helperText={formErrors.dpiMax}
            />
            <TextField 
              name="weightGrams" 
              type="number" 
              label="Weight (g)" 
              value={form.weightGrams} 
              onChange={handleChange} 
              fullWidth 
              error={!!formErrors.weightGrams}
              helperText={formErrors.weightGrams}
            />
            <FormControl fullWidth error={!!formErrors.connection}>
              <InputLabel>Connection</InputLabel>
              <Select name="connection" value={form.connection} onChange={handleChange} label="Connection">
                <MenuItem value="wired">Wired</MenuItem>
                <MenuItem value="wireless">Wireless</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={<Checkbox name="rgb" checked={form.rgb} onChange={handleChange} />}
              label="RGB"
            />
            <Box>
              <input
                accept="image/*"
                multiple
                type="file"
                onChange={handleFileChange}
                style={{ marginTop: '8px' }}
              />
              <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Select up to 10 images
              </p>
            </Box>
          </Box>

          {form.images.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <strong>Current Images:</strong>
              <ImageList cols={4} rowHeight={100} sx={{ mt: 1 }}>
                {form.images.map((img, idx) => (
                  <ImageListItem key={idx}>
                    <img src={img} alt={`Image ${idx + 1}`} />
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleRemoveImage(idx)}
                      sx={{ position: 'absolute', top: 0, right: 0 }}
                    >
                      ×
                    </Button>
                  </ImageListItem>
                ))}
              </ImageList>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={saveMouse} variant="contained" disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}