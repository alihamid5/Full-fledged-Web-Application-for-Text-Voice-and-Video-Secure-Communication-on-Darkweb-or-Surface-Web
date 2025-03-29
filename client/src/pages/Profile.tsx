import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Avatar, 
  Paper, 
  TextField, 
  Button, 
  Grid, 
  IconButton, 
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  Tab,
  Tabs
} from '@mui/material';
import {
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const Profile: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    bio: '',
    avatar: ''
  });
  
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Determine if viewing own profile or someone else's
  const isOwnProfile = !id || (user && id === user._id);
  
  // Load profile data
  useEffect(() => {
    if (user && isOwnProfile) {
      setProfileData({
        username: user.username,
        email: user.email,
        bio: 'Software developer and chat enthusiast', // Mock data
        avatar: user.avatar || ''
      });
    } else if (id) {
      // Mock fetching other user's profile
      setIsLoading(true);
      setTimeout(() => {
        setProfileData({
          username: 'Other User',
          email: 'otheruser@example.com',
          bio: 'Another chat app user',
          avatar: ''
        });
        setIsLoading(false);
      }, 1000);
    }
  }, [user, id, isOwnProfile]);
  
  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle avatar upload
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfileData(prev => ({
            ...prev,
            avatar: event.target.result as string
          }));
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  
  // Handle profile update
  const handleUpdateProfile = async () => {
    if (!isOwnProfile) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await updateProfile({
        username: profileData.username,
        // Email and avatar would typically be updated in a real app
      });
      
      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle going back
  const handleBack = () => {
    navigate(-1);
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSuccess(null);
    setError(null);
  };
  
  if (isLoading && !profileData.username) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        
        <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {/* Profile header */}
          <Box
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              p: 3,
              position: 'relative',
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
            }}
          >
            <Box sx={{ position: 'relative', mb: { xs: 2, sm: 0 } }}>
              <Avatar
                src={profileData.avatar}
                sx={{
                  width: 120,
                  height: 120,
                  border: '4px solid white',
                }}
              >
                {profileData.username.charAt(0).toUpperCase()}
              </Avatar>
              
              {isOwnProfile && isEditing && (
                <IconButton
                  component="label"
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: 'background.paper',
                    '&:hover': { bgcolor: 'background.default' },
                  }}
                >
                  <input
                    hidden
                    accept="image/*"
                    type="file"
                    onChange={handleAvatarUpload}
                  />
                  <PhotoCameraIcon />
                </IconButton>
              )}
            </Box>
            
            <Box sx={{ ml: { xs: 0, sm: 3 }, textAlign: { xs: 'center', sm: 'left' } }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {profileData.username}
              </Typography>
              
              <Typography variant="body1" sx={{ mt: 1, opacity: 0.9 }}>
                {profileData.bio}
              </Typography>
            </Box>
            
            {isOwnProfile && !isEditing && (
              <IconButton
                color="inherit"
                onClick={() => setIsEditing(true)}
                sx={{
                  position: { xs: 'static', sm: 'absolute' },
                  top: 16,
                  right: 16,
                  mt: { xs: 2, sm: 0 }
                }}
              >
                <EditIcon />
              </IconButton>
            )}
          </Box>
          
          {/* Profile tabs */}
          <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="profile tabs"
                centered
              >
                <Tab label="Profile" icon={<EditIcon />} />
                {isOwnProfile && <Tab label="Security" icon={<SecurityIcon />} />}
                {isOwnProfile && <Tab label="Notifications" icon={<NotificationsIcon />} />}
                {isOwnProfile && <Tab label="Appearance" icon={<PaletteIcon />} />}
              </Tabs>
            </Box>
            
            {/* Profile info tab */}
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Username"
                    name="username"
                    value={profileData.username}
                    onChange={handleChange}
                    disabled={!isEditing || !isOwnProfile}
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={profileData.email}
                    onChange={handleChange}
                    disabled={!isEditing || !isOwnProfile}
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bio"
                    name="bio"
                    value={profileData.bio}
                    onChange={handleChange}
                    disabled={!isEditing || !isOwnProfile}
                    margin="normal"
                    multiline
                    rows={3}
                  />
                </Grid>
                
                {isOwnProfile && isEditing && (
                  <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={() => setIsEditing(false)}
                      sx={{ mr: 2 }}
                    >
                      Cancel
                    </Button>
                    
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleUpdateProfile}
                      disabled={isLoading}
                    >
                      {isLoading ? <CircularProgress size={24} /> : 'Save Changes'}
                    </Button>
                  </Grid>
                )}
              </Grid>
            </TabPanel>
            
            {/* Placeholder for other tabs */}
            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" gutterBottom>
                Security Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography>
                Security settings would go here (password change, 2FA, etc.).
              </Typography>
            </TabPanel>
            
            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6" gutterBottom>
                Notification Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography>
                Notification preferences would go here.
              </Typography>
            </TabPanel>
            
            <TabPanel value={tabValue} index={3}>
              <Typography variant="h6" gutterBottom>
                Appearance Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography>
                Theme settings and appearance preferences would go here.
              </Typography>
            </TabPanel>
          </Box>
        </Paper>
      </Box>
      
      {/* Success/Error messages */}
      <Snackbar
        open={!!success || !!error}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={success ? 'success' : 'error'}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {success || error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Profile; 