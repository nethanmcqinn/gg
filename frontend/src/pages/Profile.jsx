import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Avatar, Stack, Paper } from '@mui/material';
import { useAuth } from '../context/AuthContext.jsx';
import { authHeaders } from '../services/auth.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Profile() {
  const { token, isAuthed } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (!isAuthed) navigate('/login');
  }, [isAuthed, navigate]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/users/me`, { headers: { ...authHeaders(token) } });
        const data = await res.json();
        if (res.ok) {
          setName(data.name || '');
          setBio(data.bio || '');
          setPhotoUrl(data.photoUrl || '');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  async function uploadProfile() {
    if (!file) return null;
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API_URL}/api/upload/profile`, {
      method: 'POST',
      headers: { ...authHeaders(token) },
      body: fd,
    });
    if (!res.ok) return null;
    const { url } = await res.json();
    return url;
  }

  async function onSave() {
    setSaving(true);
    try {
      const url = await uploadProfile();
      const payload = { name, bio };
      if (url) payload.photoUrl = url;
      const res = await fetch(`${API_URL}/api/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setPhotoUrl(data.photoUrl || photoUrl);
        alert('Profile updated');
      } else {
        alert(data.message || 'Failed to update');
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="muted">Loading...</p>;

  return (
    <Paper sx={{ p: 3 }}>
      <h1>My Profile</h1>
      <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 3 }}>
        <Avatar src={photoUrl} sx={{ width: 96, height: 96 }} />
        <div>
          <Button variant="outlined" component="label">
            Change Photo
            <input hidden accept="image/*" type="file" onChange={(e)=>setFile(e.target.files?.[0]||null)} />
          </Button>
          {file && <p className="muted" style={{ marginTop: 6 }}>{file.name}</p>}
        </div>
      </Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        <TextField label="Name" value={name} onChange={(e)=>setName(e.target.value)} />
        <TextField label="Bio" value={bio} onChange={(e)=>setBio(e.target.value)} multiline minRows={3} />
      </Box>
      <Button sx={{ mt: 2 }} variant="contained" onClick={onSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </Paper>
  );
}


