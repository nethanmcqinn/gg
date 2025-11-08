import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
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
  Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useAuth } from '../context/AuthContext.jsx';
import { authHeaders } from '../services/auth.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [expandedRows, setExpandedRows] = useState(new Set());

  useEffect(() => {
    if (!isAuthed) navigate('/admin');
  }, [isAuthed, navigate]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/mice?limit=100`);
      const data = await res.json();
      setItems(data.items || []);
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
    setSaving(true);
    try {
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
      console.error('Save error:', e);
      alert('Failed to save mouse');
    } finally {
      setSaving(false);
    }
  }

  function handleOpenDialog(mouse = null) {
    if (mouse) {
      setEditingId(mouse._id);
      setForm({
        name: mouse.name || '',
        brand: mouse.brand || '',
        slug: mouse.slug || '',
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
    if (selectedRows.length === 0) return;
    if (!confirm(`Delete ${selectedRows.length} selected mice?`)) return;
    try {
      await fetch(`${API_URL}/api/mice/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
        body: JSON.stringify({ ids: selectedRows }),
      });
      setSelectedRows([]);
      await load();
    } catch (e) {
      console.error('Bulk delete error:', e);
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
          {selectedRows.length > 0 && (
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={bulkDelete}
            >
              Delete Selected ({selectedRows.length})
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Mouse
          </Button>
          <Button variant="outlined" onClick={() => { setToken(''); navigate('/admin'); }}>
            Logout
          </Button>
        </Stack>
      </Box>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          checkboxSelection
          hideFooterSelectedRowCount
          onRowSelectionModelChange={(newSelection) => {
            // Uncontrolled selection: we capture selected ids without controlling the grid state
            setSelectedRows(Array.isArray(newSelection) ? newSelection : []);
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
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
            <TextField name="name" label="Name" value={form.name} onChange={handleChange} fullWidth />
            <TextField name="brand" label="Brand" value={form.brand} onChange={handleChange} fullWidth />
            <TextField name="slug" label="Slug" value={form.slug} onChange={handleChange} fullWidth />
            <TextField name="price" type="number" label="Price" value={form.price} onChange={handleChange} fullWidth />
            <TextField name="sensor" label="Sensor" value={form.sensor} onChange={handleChange} fullWidth />
            <TextField name="dpiMax" type="number" label="Max DPI" value={form.dpiMax} onChange={handleChange} fullWidth />
            <TextField name="weightGrams" type="number" label="Weight (g)" value={form.weightGrams} onChange={handleChange} fullWidth />
            <FormControl fullWidth>
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