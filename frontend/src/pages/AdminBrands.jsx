import { useEffect, useState } from 'react';
import { Container, Typography, Box, TextField, Button, Stack, IconButton, Paper } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../context/AuthContext.jsx';
import { brandService } from '../services/brand';

export default function AdminBrands() {
  const { token, userInfo } = useAuth();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await brandService.getAll();
      if (!error) setBrands(data || []);
      setLoading(false);
    })();
  }, []);

  const refresh = async () => {
    const { data } = await brandService.getAll();
    setBrands(data || []);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    if (editing) {
      await brandService.update(editing._id, { name: name.trim() }, token);
      setEditing(null);
    } else {
      await brandService.create({ name: name.trim() }, token);
    }
    setName('');
    await refresh();
  };

  const startEdit = (b) => { setEditing(b); setName(b.name); };

  const handleDelete = async (b) => {
    await brandService.delete(b._id, token);
    await refresh();
  };

  if (!userInfo?.isAdmin) return <Container><Typography variant="h5">Access denied</Typography></Container>;

  return (
    <Container>
      <Typography variant="h4" sx={{ mt: 2, mb: 2 }}>Manage Brands</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField label="Brand name" value={name} onChange={e=>setName(e.target.value)} />
          <Button variant="contained" onClick={handleSave}>{editing ? 'Save' : 'Add Brand'}</Button>
          {editing && <Button onClick={()=>{setEditing(null); setName('');}}>Cancel</Button>}
        </Stack>
      </Paper>

      <Box>
        {brands.map(b => (
          <Paper key={b._id} sx={{ p: 2, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography><strong>{b.name}</strong></Typography>
              <Typography variant="caption" color="text.secondary">{b.slug}</Typography>
            </Box>
            <Box>
              <IconButton onClick={()=>startEdit(b)}><EditIcon /></IconButton>
              <IconButton onClick={()=>handleDelete(b)} color="error"><DeleteIcon /></IconButton>
            </Box>
          </Paper>
        ))}
      </Box>
    </Container>
  );
}
