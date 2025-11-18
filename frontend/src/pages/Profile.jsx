import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Avatar, Stack, Paper, Alert } from '@mui/material';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext.jsx';
import { authHeaders } from '../services/auth.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Validation schema
const profileSchema = yup.object().shape({
  name: yup
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters')
    .trim(),
  bio: yup
    .string()
    .max(500, 'Bio must not exceed 500 characters'),
});

export default function Profile() {
  const { token, isAuthed, setUserInfo } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    setError('');
    setErrors({});
    setSuccess('');
    
    try {
      // Validate form data
      await profileSchema.validate({ name, bio }, { abortEarly: false });
      
      const url = await uploadProfile();
      const payload = { name: name.trim(), bio };
      if (url) payload.photoUrl = url;
      
      const res = await fetch(`${API_URL}/api/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setPhotoUrl(data.photoUrl || photoUrl);
        setSuccess('✅ Profile updated successfully!');
        // Update the global cached user info so navbar/profile reflect the new name/photo immediately
        if (setUserInfo) {
          // Prefer to re-fetch the authoritative user profile from server so all fields are consistent
          try {
            const meRes = await fetch(`${API_URL}/api/users/me`, { headers: { ...authHeaders(token) } });
            if (meRes.ok) {
              const me = await meRes.json();
              setUserInfo(me);
            } else {
              // fallback to merging the known values
              setUserInfo(prev => ({ ...(prev || {}), name: data.name || name.trim(), photoUrl: data.photoUrl || photoUrl }));
            }
          } catch (e) {
            setUserInfo(prev => ({ ...(prev || {}), name: data.name || name.trim(), photoUrl: data.photoUrl || photoUrl }));
          }
        }
      } else {
        setError(data.message || 'Failed to update');
      }
    } catch (e) {
      if (e.name === 'ValidationError') {
        // Handle Yup validation errors
        const validationErrors = {};
        e.inner.forEach(err => {
          validationErrors[err.path] = err.message;
        });
        setErrors(validationErrors);
      } else {
        setError(e.message || 'Failed to update profile');
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="muted">Loading...</p>;

  return (
    <Paper sx={{ p: 3 }}>
      <h1>My Profile</h1>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
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
        <TextField 
          label="Name" 
          value={name} 
          onChange={(e)=>{setName(e.target.value); setErrors({...errors, name: ''});}}
          error={!!errors.name}
          helperText={errors.name || 'Min 2 characters, max 50 characters'}
        />
        <TextField 
          label="Bio" 
          value={bio} 
          onChange={(e)=>{setBio(e.target.value); setErrors({...errors, bio: ''});}} 
          multiline 
          minRows={3}
          error={!!errors.bio}
          helperText={errors.bio || 'Max 500 characters'}
        />
      </Box>
      <Button sx={{ mt: 2 }} variant="contained" onClick={onSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </Paper>
  );
}


