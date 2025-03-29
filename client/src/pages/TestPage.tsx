import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Paper, 
  AppBar, 
  Toolbar,
  Card,
  CardContent,
  CardActions,
  Grid,
  TextField,
  Alert,
  Divider,
  CircularProgress
} from '@mui/material';
import { 
  Chat as ChatIcon, 
  AdminPanelSettings as AdminIcon,
  PersonAdd as RegisterIcon,
  Login as LoginIcon,
  Code as CodeIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TestPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading, user } = useAuth();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handleQuickLogin = async () => {
    setError('');
    setLoginLoading(true);
    try {
      await login(email, password);
      navigate('/chat');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Advanced Chat Application
          </Typography>
          {isAuthenticated ? (
            <>
              <Button 
                color="inherit" 
                onClick={() => navigate('/chat')}
                startIcon={<ChatIcon />}
              >
                Chat
              </Button>
              {user?.role === 'admin' && (
                <Button 
                  color="inherit" 
                  onClick={() => navigate('/admin')}
                  startIcon={<AdminIcon />}
                >
                  Admin
                </Button>
              )}
            </>
          ) : (
            <>
              <Button 
                color="inherit" 
                onClick={() => navigate('/login')}
                startIcon={<LoginIcon />}
              >
                Login
              </Button>
              <Button 
                color="inherit" 
                onClick={() => navigate('/register')}
                startIcon={<RegisterIcon />}
              >
                Register
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 5, mb: 5 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Welcome to the Advanced Chat App
          </Typography>
          <Typography variant="h5" color="text.secondary" paragraph>
            A full-featured communication platform with real-time messaging, voice/video calls, and file sharing
          </Typography>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : !isAuthenticated ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h5" component="div" gutterBottom>
                    Quick Login
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Use these demo credentials to quickly test the application
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {error}
                    </Alert>
                  )}
                  <TextField
                    label="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    fullWidth
                    margin="normal"
                  />
                </CardContent>
                <CardActions>
                  <Button 
                    variant="contained" 
                    fullWidth
                    onClick={handleQuickLogin}
                    disabled={loginLoading}
                    startIcon={loginLoading ? <CircularProgress size={20} /> : <LoginIcon />}
                  >
                    {loginLoading ? 'Logging in...' : 'Login Now'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h5" component="div" gutterBottom>
                    Admin Access
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Try the admin dashboard with these credentials
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">Email:</Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>admin@example.com</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2">Password:</Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>admin123</Typography>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button 
                    variant="outlined" 
                    fullWidth
                    onClick={() => {
                      setEmail('admin@example.com');
                      setPassword('admin123');
                    }}
                  >
                    Use Admin Credentials
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        ) : (
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Welcome back, {user?.name}!
            </Typography>
            <Typography variant="body1" paragraph>
              You are currently logged in. Continue to the chat application.
            </Typography>
            <Button 
              variant="contained" 
              size="large" 
              onClick={() => navigate('/chat')}
              startIcon={<ChatIcon />}
            >
              Go to Chat
            </Button>
          </Paper>
        )}

        <Grid container spacing={4} sx={{ mt: 4 }}>
          <Grid item xs={12}>
            <Typography variant="h4" gutterBottom>
              Key Features
            </Typography>
            <Divider />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h5" color="primary" gutterBottom>
                  Real-time Messaging
                </Typography>
                <Typography variant="body2">
                  Instant messaging with typing indicators, read receipts, and message history.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h5" color="primary" gutterBottom>
                  Voice & Video Calls
                </Typography>
                <Typography variant="body2">
                  High-quality WebRTC-powered voice and video calling between users.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h5" color="primary" gutterBottom>
                  File Sharing
                </Typography>
                <Typography variant="body2">
                  Share images, videos, documents and other files with preview capabilities.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Box component="footer" sx={{ bgcolor: 'background.paper', py: 6, mt: 5 }}>
        <Container maxWidth="lg">
          <Typography variant="h6" align="center" gutterBottom>
            Advanced Chat Application
          </Typography>
          <Typography
            variant="subtitle1"
            align="center"
            color="text.secondary"
            component="p"
          >
            A demonstration of a modern chat platform built with React and Material UI
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
            <CodeIcon sx={{ mr: 0.5, verticalAlign: 'middle' }} fontSize="small" />
            Demo Version
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default TestPage; 