import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  IconButton,
  LinearProgress,
  Paper,
  Tooltip,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  Image as ImageIcon,
  InsertDriveFile as FileIcon,
  PictureAsPdf as PdfIcon,
  AudioFile as AudioIcon,
  VideoFile as VideoIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useSocket } from '../../context/SocketContext';

export interface FileData {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface FileUploadProps {
  chatId: string;
  disabled?: boolean;
  onFileUploaded?: (file: FileData) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/ogg'],
  audio: ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]
};

const FileUpload: React.FC<FileUploadProps> = ({ chatId, disabled = false, onFileUploaded }) => {
  const theme = useTheme();
  const { sendFile, connected } = useSocket();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }
    
    const file = files[0];
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
      setDialogOpen(true);
      return;
    }
    
    // Validate file type
    const allowedTypes = [
      ...ALLOWED_FILE_TYPES.image,
      ...ALLOWED_FILE_TYPES.video,
      ...ALLOWED_FILE_TYPES.audio,
      ...ALLOWED_FILE_TYPES.document
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setError('File type not allowed.');
      setDialogOpen(true);
      return;
    }
    
    setSelectedFile(file);
    setError(null);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };
  
  // Open file input
  const handleAttachClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Cancel file selection
  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Toggle preview dialog
  const togglePreviewDialog = () => {
    setPreviewDialogOpen(!previewDialogOpen);
  };
  
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };
  
  // Get file icon based on type
  const getFileIcon = (fileType: string) => {
    if (ALLOWED_FILE_TYPES.image.includes(fileType)) {
      return <ImageIcon color="primary" />;
    } else if (ALLOWED_FILE_TYPES.video.includes(fileType)) {
      return <VideoIcon color="secondary" />;
    } else if (ALLOWED_FILE_TYPES.audio.includes(fileType)) {
      return <AudioIcon color="success" />;
    } else if (fileType === 'application/pdf') {
      return <PdfIcon color="error" />;
    } else {
      return <FileIcon />;
    }
  };
  
  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile || !chatId || !connected) {
      return;
    }
    
    try {
      setUploading(true);
      setUploadProgress(0);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);
      
      // Send file
      const success = await sendFile(chatId, selectedFile);
      
      clearInterval(progressInterval);
      
      if (success) {
        setUploadProgress(100);
        
        // Simulate file upload success
        const mockFileData: FileData = {
          id: `file-${Date.now()}`,
          name: selectedFile.name,
          type: selectedFile.type,
          size: selectedFile.size,
          url: URL.createObjectURL(selectedFile), // In real app, this would be a server URL
          thumbnailUrl: selectedFile.type.startsWith('image/') ? URL.createObjectURL(selectedFile) : undefined,
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'currentUser', // In real app, this would be the actual user ID
        };
        
        // Call callback if provided
        if (onFileUploaded) {
          onFileUploaded(mockFileData);
        }
        
        setTimeout(() => {
          setDialogOpen(false);
          setSelectedFile(null);
          setUploadProgress(0);
          setUploading(false);
        }, 500);
      } else {
        setError('Failed to upload file');
        setUploading(false);
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload file');
      setUploading(false);
    }
  };
  
  // Handle dialog close
  const handleClose = () => {
    if (!uploading) {
      setDialogOpen(false);
      setSelectedFile(null);
      setUploadProgress(0);
      setError(null);
    }
  };
  
  // Handle file preview
  const handlePreview = () => {
    if (selectedFile) {
      if (ALLOWED_FILE_TYPES.image.includes(selectedFile.type)) {
        // Create object URL for preview
        const objectUrl = URL.createObjectURL(selectedFile);
        setPreviewUrl(objectUrl);
        setPreviewDialogOpen(true);
        
        // Free memory when no longer needed
        return () => URL.revokeObjectURL(objectUrl);
      }
    }
  };
  
  // Handle file change
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size exceeds the limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      setDialogOpen(true);
      return;
    }
    
    // Validate file type
    const allowedTypes = [
      ...ALLOWED_FILE_TYPES.image,
      ...ALLOWED_FILE_TYPES.video,
      ...ALLOWED_FILE_TYPES.audio,
      ...ALLOWED_FILE_TYPES.document
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setError('File type not supported');
      setDialogOpen(true);
      return;
    }
    
    setSelectedFile(file);
    setDialogOpen(true);
  };
  
  return (
    <>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        accept={ALLOWED_FILE_TYPES.image.join(',') + ',' + ALLOWED_FILE_TYPES.video.join(',') + ',' + ALLOWED_FILE_TYPES.audio.join(',') + ',' + ALLOWED_FILE_TYPES.document.join(',')}
      />
      
      {/* Attach button */}
      {!selectedFile && (
        <Tooltip title="Attach file">
          <IconButton
            onClick={handleAttachClick}
            disabled={disabled || uploading}
            sx={{
              color: theme.palette.primary.main,
            }}
          >
            <AttachFileIcon />
          </IconButton>
        </Tooltip>
      )}
      
      {/* Selected file preview */}
      {selectedFile && !uploading && (
        <Paper
          elevation={2}
          sx={{
            p: 2,
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
            {getFileIcon(selectedFile.type)}
            
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography variant="body2" noWrap>
                {selectedFile.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatFileSize(selectedFile.size)}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {previewUrl && (
              <Button size="small" onClick={togglePreviewDialog}>
                Preview
              </Button>
            )}
            <Button
              size="small"
              variant="contained"
              onClick={handleUpload}
              disabled={!!error}
            >
              Send
            </Button>
            <IconButton size="small" onClick={handleCancel}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          
          {error && (
            <Typography variant="caption" color="error" sx={{ width: '100%' }}>
              {error}
            </Typography>
          )}
        </Paper>
      )}
      
      {/* Upload progress */}
      {uploading && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            {getFileIcon(selectedFile!.type)}
            <Typography variant="body2" noWrap>
              {selectedFile!.name}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={uploadProgress}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Uploading...
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {uploadProgress}%
            </Typography>
          </Box>
        </Box>
      )}
      
      {/* Preview dialog for images */}
      {previewUrl && (
        <Dialog
          open={previewDialogOpen}
          onClose={togglePreviewDialog}
          maxWidth="md"
        >
          <DialogTitle>
            File Preview
            <IconButton
              aria-label="close"
              onClick={togglePreviewDialog}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Box
              component="img"
              src={previewUrl}
              alt={selectedFile?.name || 'Preview'}
              sx={{
                maxWidth: '100%',
                maxHeight: 'calc(80vh - 64px)',
                objectFit: 'contain',
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={togglePreviewDialog}>Close</Button>
            <Button variant="contained" onClick={handleUpload} disabled={!!error}>
              Send
            </Button>
          </DialogActions>
        </Dialog>
      )}
      
      <Dialog
        open={dialogOpen}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          File Upload
          <IconButton onClick={handleClose} disabled={uploading}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          {error ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="error">{error}</Typography>
            </Box>
          ) : selectedFile ? (
            <Box>
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <List disablePadding>
                  <ListItem disablePadding>
                    <ListItemIcon>
                      {getFileIcon(selectedFile.type)}
                    </ListItemIcon>
                    <ListItemText 
                      primary={selectedFile.name}
                      secondary={`${formatFileSize(selectedFile.size)} • ${selectedFile.type}`}
                      primaryTypographyProps={{ noWrap: true }}
                    />
                  </ListItem>
                </List>
              </Paper>
              
              {uploading && (
                <Box sx={{ width: '100%', mt: 2 }}>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                  <Typography variant="caption" align="center" display="block" sx={{ mt: 1 }}>
                    {uploadProgress < 100 
                      ? `Uploading: ${uploadProgress}%` 
                      : 'Upload complete'}
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ 
              p: 3, 
              textAlign: 'center',
              border: '2px dashed #ddd',
              borderRadius: 2,
              bgcolor: 'background.default'
            }}>
              <AttachFileIcon fontSize="large" color="action" />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Select a file to upload
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Max file size: {MAX_FILE_SIZE / (1024 * 1024)}MB
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={handleClose} 
            color="inherit" 
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            variant="contained" 
            disabled={!selectedFile || uploading || !!error || !connected}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FileUpload; 