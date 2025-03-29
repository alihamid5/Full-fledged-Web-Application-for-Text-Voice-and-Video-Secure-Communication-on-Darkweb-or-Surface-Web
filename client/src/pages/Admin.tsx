import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tab,
  Tabs,
  Button,
  IconButton,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Avatar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Grid,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  BarChart as AnalyticsIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  Check as CheckIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import adminApi, { User, Analytics, SystemSettings } from '../services/adminService';

// Replace mock data with data from service
// const mockUsers = [...]
// const mockAnalytics = {...}
// const initialSettings = {...}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`,
  };
}

const Admin: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>({} as SystemSettings);
  const [initialSettings, setInitialSettings] = useState<SystemSettings>({} as SystemSettings);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from APIs
  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role === 'admin') {
      // Load data from APIs
      const loadAdminData = async () => {
        try {
          const [users, analytics, settings] = await Promise.all([
            adminApi.getUsers(),
            adminApi.getAnalytics(),
            adminApi.getSettings()
          ]);
          
          setFilteredUsers(users);
          setSettings(settings);
          setInitialSettings(settings);
          setIsLoaded(true);
        } catch (error) {
          console.error('Error loading admin data:', error);
          showAlertMessage('Failed to load admin data. Please try again.', 'error');
          setIsLoaded(true);
        }
      };
      
      loadAdminData();
    }
  }, [isLoading, isAuthenticated, user]);

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers([]);
      return;
    }

    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = filteredUsers.filter(
      user => 
        user.username.toLowerCase().includes(lowerCaseQuery) ||
        user.email.toLowerCase().includes(lowerCaseQuery) ||
        user.name.toLowerCase().includes(lowerCaseQuery)
    );
    
    setFilteredUsers(filtered);
  }, [searchQuery, filteredUsers]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // User management functions
  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setUserDialogOpen(true);
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setUserDialogOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleUserSave = async (userData: Partial<User> & { id?: string }) => {
    try {
      if (userData.id) {
        // Update existing user
        const updatedUser = await adminApi.updateUser(userData.id, userData);
        setFilteredUsers(prevUsers =>
          prevUsers.map(user => (user.id === updatedUser.id ? updatedUser : user))
        );
        showAlertMessage('User updated successfully', 'success');
      } else {
        // Create new user
        const newUser = await adminApi.createUser(userData as Omit<User, 'id' | 'createdAt' | 'lastActive'>);
        setFilteredUsers(prevUsers => [...prevUsers, newUser]);
        showAlertMessage('User added successfully', 'success');
      }
      setUserDialogOpen(false);
    } catch (error) {
      console.error('Error saving user:', error);
      showAlertMessage('Failed to save user. Please try again.', 'error');
    }
  };

  const confirmDeleteUser = async () => {
    try {
      await adminApi.deleteUser(selectedUser.id);
      setFilteredUsers(prevUsers => prevUsers.filter(user => user.id !== selectedUser.id));
      setDeleteDialogOpen(false);
      showAlertMessage('User deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting user:', error);
      showAlertMessage('Failed to delete user. Please try again.', 'error');
    }
  };

  const handleUserStatusChange = async (userId: string, newStatus: string) => {
    try {
      const updatedUser = await adminApi.updateUser(userId, { status: newStatus as 'active' | 'inactive' | 'suspended' });
      setFilteredUsers(prevUsers =>
        prevUsers.map(user => (user.id === updatedUser.id ? updatedUser : user))
      );
      showAlertMessage(`User status updated to ${newStatus}`, 'success');
    } catch (error) {
      console.error('Error updating user status:', error);
      showAlertMessage('Failed to update user status. Please try again.', 'error');
    }
  };

  // Settings functions
  const handleSettingChange = (setting: string, value: any) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [setting]: value
    }));
  };

  const saveSettings = async () => {
    try {
      const updatedSettings = await adminApi.updateSettings(settings);
      setSettings(updatedSettings);
      setInitialSettings(updatedSettings);
      showAlertMessage('Settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showAlertMessage('Failed to save settings. Please try again.', 'error');
    }
  };

  // Alert message helper
  const showAlertMessage = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 5000);
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Render user dialog content
  const renderUserDialog = () => {
    const [userData, setUserData] = useState<Partial<User> & { id?: string }>({
      username: selectedUser?.username || '',
      email: selectedUser?.email || '',
      name: selectedUser?.name || '',
      role: selectedUser?.role || 'user',
      status: selectedUser?.status || 'active',
      password: '' // Only for new users
    });

    if (selectedUser) {
      userData.id = selectedUser.id;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setUserData(prev => ({
        ...prev,
        [name]: value
      }));
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleUserSave(userData);
    };

    return (
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" sx={{ mt: 1 }} onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Username"
              name="username"
              value={userData.username}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={userData.email}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Full Name"
              name="name"
              value={userData.name}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              select
              fullWidth
              label="Role"
              name="role"
              value={userData.role}
              onChange={handleChange}
              SelectProps={{
                native: true,
              }}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </TextField>
            <TextField
              margin="normal"
              select
              fullWidth
              label="Status"
              name="status"
              value={userData.status}
              onChange={handleChange}
              SelectProps={{
                native: true,
              }}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </TextField>
            {!selectedUser && (
              <TextField
                margin="normal"
                required
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={userData.password}
                onChange={handleChange}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit}
          >
            {selectedUser ? 'Save Changes' : 'Add User'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Delete confirmation dialog
  const renderDeleteDialog = () => {
    return (
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user {selectedUser?.name} ({selectedUser?.email})?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmDeleteUser}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Users management tab
  const renderUsersTab = () => {
    return (
      <>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '60%' }}>
            <TextField
              placeholder="Search users..."
              variant="outlined"
              size="small"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ mr: 2 }}
            />
            <Button 
              variant="outlined" 
              startIcon={<RefreshIcon />} 
              onClick={() => setSearchQuery('')}
            >
              Reset
            </Button>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddUser}
          >
            Add User
          </Button>
        </Box>

        <TableContainer component={Paper} elevation={2}>
          <Table sx={{ minWidth: 650 }} aria-label="users table">
            <TableHead>
              <TableRow sx={{ bgcolor: theme.palette.primary.main }}>
                <TableCell sx={{ color: 'white' }}>User</TableCell>
                <TableCell sx={{ color: 'white' }}>Email</TableCell>
                <TableCell sx={{ color: 'white' }}>Role</TableCell>
                <TableCell sx={{ color: 'white' }}>Status</TableCell>
                <TableCell sx={{ color: 'white' }}>Last Active</TableCell>
                <TableCell sx={{ color: 'white' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell component="th" scope="row">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                          {user.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">{user.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            @{user.username}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.role === 'admin' ? 'Admin' : 'User'} 
                        color={user.role === 'admin' ? 'secondary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.status.charAt(0).toUpperCase() + user.status.slice(1)} 
                        color={
                          user.status === 'active' 
                            ? 'success' 
                            : user.status === 'inactive' 
                              ? 'warning' 
                              : 'error'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(user.lastActive).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton 
                        size="small" 
                        color="primary" 
                        onClick={() => handleUserClick(user)}
                        title="Edit user"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      {user.status === 'active' ? (
                        <IconButton 
                          size="small" 
                          color="warning" 
                          onClick={() => handleUserStatusChange(user.id, 'suspended')}
                          title="Suspend user"
                        >
                          <BlockIcon fontSize="small" />
                        </IconButton>
                      ) : (
                        <IconButton 
                          size="small" 
                          color="success" 
                          onClick={() => handleUserStatusChange(user.id, 'active')}
                          title="Activate user"
                        >
                          <CheckIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => handleDeleteUser(user)}
                        title="Delete user"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1">No users found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredUsers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      </>
    );
  };

  // Analytics tab
  const renderAnalyticsTab = () => {
    return (
      <Grid container spacing={3}>
        {/* Summary cards */}
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Users
              </Typography>
              <Typography variant="h4" component="div">
                {filteredUsers.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Messages
              </Typography>
              <Typography variant="h4" component="div">
                {/* Placeholder for total messages */}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Active Chats
              </Typography>
              <Typography variant="h4" component="div">
                {/* Placeholder for active chats */}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                File Uploads
              </Typography>
              <Typography variant="h4" component="div">
                {/* Placeholder for file uploads */}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Message activity chart (mock) */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Message Activity (Last 7 Days)</Typography>
                <Button startIcon={<DownloadIcon />} size="small">
                  Export
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {/* Mock chart - In a real app, use a charting library like Recharts or Chart.js */}
              <Box sx={{ height: 250, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                {/* Placeholder for message activity chart */}
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
                  <Box sx={{ width: 12, height: 12, bgcolor: theme.palette.primary.main, borderRadius: '50%', mr: 1 }} />
                  <Typography variant="body2">Messages</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: 12, height: 12, bgcolor: theme.palette.secondary.main, borderRadius: '50%', mr: 1 }} />
                  <Typography variant="body2">Active Users</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* User registration and message types (mock) */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Registrations
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Typography color="text.secondary">
                  User registration chart would go here
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Message Types
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Typography color="text.secondary">
                  Message types pie chart would go here
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Settings tab
  const renderSettingsTab = () => {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Application Settings
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Max File Size (MB)"
                  type="number"
                  value={settings.maxFileSize}
                  onChange={(e) => handleSettingChange('maxFileSize', Number(e.target.value))}
                  InputProps={{ inputProps: { min: 1, max: 100 } }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Message Retention (days)"
                  type="number"
                  value={settings.messageRetentionDays}
                  onChange={(e) => handleSettingChange('messageRetentionDays', Number(e.target.value))}
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Idle Timeout (minutes)"
                  type="number"
                  value={settings.idleTimeoutMinutes}
                  onChange={(e) => handleSettingChange('idleTimeoutMinutes', Number(e.target.value))}
                  InputProps={{ inputProps: { min: 5, max: 120 } }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                {/* Empty space for alignment */}
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Features
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.allowRegistration}
                      onChange={(e) => handleSettingChange('allowRegistration', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Allow New Registrations"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.requireEmailVerification}
                      onChange={(e) => handleSettingChange('requireEmailVerification', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Require Email Verification"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.allowFileSharing}
                      onChange={(e) => handleSettingChange('allowFileSharing', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Allow File Sharing"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.allowVoiceCalls}
                      onChange={(e) => handleSettingChange('allowVoiceCalls', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Allow Voice Calls"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.allowVideoCalls}
                      onChange={(e) => handleSettingChange('allowVideoCalls', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Allow Video Calls"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.maintenanceMode}
                      onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Maintenance Mode"
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="outlined" sx={{ mr: 1 }} onClick={() => setSettings(initialSettings)}>
                Reset
              </Button>
              <Button variant="contained" onClick={saveSettings}>
                Save Settings
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  if (isLoading || !isLoaded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Page header */}
      <Paper 
        elevation={2}
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
          borderRadius: 2,
          backgroundColor: theme.palette.primary.main,
          color: 'white'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <DashboardIcon sx={{ fontSize: 40, mr: 2 }} />
          <Typography variant="h4" component="h1">
            Admin Dashboard
          </Typography>
        </Box>
        <Typography variant="body2">
          Logged in as {user?.name} ({user?.email})
        </Typography>
      </Paper>

      {/* Alert message */}
      {showAlert && (
        <Alert 
          severity={alertSeverity} 
          sx={{ mb: 3 }}
          onClose={() => setShowAlert(false)}
        >
          {alertMessage}
        </Alert>
      )}

      {/* Tabs */}
      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            backgroundColor: theme.palette.background.paper,
            borderRadius: '8px 8px 0 0',
            '& .MuiTab-root': {
              px: 3,
              py: 2
            }
          }}
        >
          <Tab 
            icon={<PeopleIcon />} 
            label="Users" 
            {...a11yProps(0)}
            iconPosition="start"
          />
          <Tab 
            icon={<AnalyticsIcon />} 
            label="Analytics" 
            {...a11yProps(1)}
            iconPosition="start"
          />
          <Tab 
            icon={<SettingsIcon />} 
            label="Settings" 
            {...a11yProps(2)}
            iconPosition="start"
          />
        </Tabs>

        {/* Tab panels */}
        <Box sx={{ px: 3 }}>
          <TabPanel value={tabValue} index={0}>
            {renderUsersTab()}
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            {renderAnalyticsTab()}
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            {renderSettingsTab()}
          </TabPanel>
        </Box>
      </Paper>

      {/* Dialogs */}
      {renderUserDialog()}
      {renderDeleteDialog()}
    </Container>
  );
};

export default Admin; 