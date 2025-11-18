import { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  Chip,
  Select,
  MenuItem,
  Avatar,
  Typography
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { authHeaders } from '../services/auth.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AdminUsers() {
  const { token, userInfo, setToken } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]);
  const [roleDialog, setRoleDialog] = useState({ open: false, user: null, newRole: '' });

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/users?limit=200`, {
        headers: { ...authHeaders(token) }
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) {
      console.error('Load error:', e);
      alert('Failed to load users: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!userInfo?.isAdmin) {
      navigate('/admin/dashboard');
      return;
    }
    loadUsers();
  }, [userInfo, token, navigate]);

  async function deleteUser(id) {
    if (id === userInfo.id) {
      alert('Cannot delete your own account!');
      return;
    }
    if (!confirm('Delete this user? This action cannot be undone.')) return;
    
    try {
      const res = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: { ...authHeaders(token) },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete');
      }
      await loadUsers();
    } catch (e) {
      console.error('Delete error:', e);
      alert('Error: ' + e.message);
    }
  }

  async function bulkDelete() {
    if (selectedRows.length === 0) {
      alert('Please select users to delete');
      return;
    }

    if (selectedRows.includes(userInfo.id)) {
      alert('Cannot delete your own account!');
      return;
    }

    if (!confirm(`⚠️ Delete ${selectedRows.length} selected user(s)?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/users/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
        body: JSON.stringify({ ids: selectedRows }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Bulk delete failed');
      }

      const result = await res.json();
      alert(`✅ Deleted ${result.deletedCount} user(s)`);
      setSelectedRows([]);
      await loadUsers();
    } catch (e) {
      console.error('Bulk delete error:', e);
      alert(`❌ Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  function openRoleDialog(user) {
    setRoleDialog({ open: true, user, newRole: user.role });
  }

  async function updateRole() {
    if (!roleDialog.user) return;

    try {
      const res = await fetch(`${API_URL}/api/users/${roleDialog.user._id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
        body: JSON.stringify({ role: roleDialog.newRole }),
      });

      if (!res.ok) throw new Error('Failed to update role');
      
      setRoleDialog({ open: false, user: null, newRole: '' });
      await loadUsers();
    } catch (e) {
      console.error('Role update error:', e);
      alert('Failed to update role: ' + e.message);
    }
  }

  async function toggleUserActive(userId, currentStatus) {
    const newStatus = !currentStatus;
    const action = newStatus ? 'activate' : 'deactivate';
    const user = users.find(u => u._id === userId);
    
    if (!confirm(`Are you sure you want to ${action} ${user?.email}?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/users/${userId}/active`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update user status');
      
      await loadUsers();
      alert(`✅ User ${action}d successfully`);
    } catch (e) {
      console.error('Status update error:', e);
      alert('Failed to update user status: ' + e.message);
    }
  }

  const columns = [
    {
      field: 'photoUrl',
      headerName: 'Photo',
      width: 80,
      renderCell: (params) => (
        <Avatar src={params.value} alt={params.row.name || params.row.email}>
          {(params.row.name || params.row.email || '?')[0].toUpperCase()}
        </Avatar>
      )
    },
    { field: 'email', headerName: 'Email', width: 250, flex: 1 },
    { field: 'name', headerName: 'Name', width: 180 },
    {
      field: 'role',
      headerName: 'Role',
      width: 120,
      renderCell: (params) => (
        <Chip
          icon={params.value === 'admin' ? <AdminPanelSettingsIcon /> : <PersonIcon />}
          label={params.value}
          color={params.value === 'admin' ? 'error' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'isVerified',
      headerName: 'Verified',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Yes' : 'No'}
          color={params.value ? 'success' : 'warning'}
          size="small"
        />
      )
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          icon={params.value ? <CheckCircleIcon /> : <BlockIcon />}
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'error'}
          size="small"
        />
      )
    },
    {
      field: 'createdAt',
      headerName: 'Joined',
      width: 150,
      valueFormatter: (value) => new Date(value).toLocaleDateString()
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      renderCell: (params) => {
        const isCurrentUser = params.row._id === userInfo?.id;
        const isActive = params.row.isActive;
        return (
          <Stack direction="row" spacing={1}>
            <Tooltip title="Change Role">
              <span>
                <IconButton
                  size="small"
                  onClick={() => openRoleDialog(params.row)}
                  disabled={isCurrentUser}
                >
                  <AdminPanelSettingsIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={isCurrentUser ? "Can't toggle yourself" : (isActive ? "Deactivate User" : "Activate User")}>
              <span>
                <IconButton
                  size="small"
                  color={isActive ? "warning" : "success"}
                  onClick={() => toggleUserActive(params.row._id, isActive)}
                  disabled={isCurrentUser}
                >
                  {isActive ? <BlockIcon /> : <CheckCircleIcon />}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={isCurrentUser ? "Can't delete yourself" : "Delete User"}>
              <span>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => deleteUser(params.row._id)}
                  disabled={isCurrentUser}
                >
                  <DeleteIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        );
      }
    }
  ];

  const rows = users.map(user => ({
    id: user._id,
    _id: user._id,
    email: user.email,
    name: user.name || '',
    role: user.role,
    isVerified: user.isVerified,
    isActive: user.isActive,
    photoUrl: user.photoUrl || '',
    createdAt: user.createdAt,
    ...user
  }));

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <h1>Admin • User Management</h1>
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
          {/* <Button variant="outlined" onClick={() => { setToken(''); navigate('/admin'); }}>
            Logout
          </Button> */}
        </Stack>
      </Box>

      {selectedRows.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {selectedRows.length} user(s) selected. Click "Bulk Delete" to remove them.
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
            const selectedIds = newSelection?.ids
              ? Array.from(newSelection.ids)
              : (Array.isArray(newSelection) ? newSelection : []);
            setSelectedRows(selectedIds);
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } }
          }}
        />
      </Paper>

      {/* Role Change Dialog */}
      <Dialog open={roleDialog.open} onClose={() => setRoleDialog({ open: false, user: null, newRole: '' })}>
        <DialogTitle>Change User Role</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, minWidth: 300 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              User: <strong>{roleDialog.user?.email}</strong>
            </Typography>
            <Select
              fullWidth
              value={roleDialog.newRole}
              onChange={(e) => setRoleDialog({ ...roleDialog, newRole: e.target.value })}
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialog({ open: false, user: null, newRole: '' })}>
            Cancel
          </Button>
          <Button onClick={updateRole} variant="contained">
            Update Role
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
