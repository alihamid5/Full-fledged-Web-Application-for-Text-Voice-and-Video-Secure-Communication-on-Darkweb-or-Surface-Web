import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  useTheme,
  Grid,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  FileDownload as DownloadIcon,
  OpenInNew as OpenIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  AudioFile as AudioIcon,
  VideoFile as VideoIcon,
  InsertDriveFile as FileIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { FileData } from './FileUpload';

interface FileMessageProps {
  file: FileData;
  isOwnMessage?: boolean;
}

const FileMessage: React.FC<FileMessageProps> = ({ file, isOwnMessage = false }) => {
  const theme = useTheme();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Determine if file is a specific type
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  const isAudio = file.type.startsWith('audio/');
  const isPdf = file.type === 'application/pdf';
  
  // Open file preview
  const handleOpenPreview = () => {
    setPreviewOpen(true);
    setZoomLevel(1);
  };
  
  // Close file preview
  const handleClosePreview = () => {
    setPreviewOpen(false);
  };
  
  // Download file
  const handleDownload = () => {
    setLoading(true);
    
    // Create an anchor element
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };
  
  // Zoom in on image
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };
  
  // Zoom out on image
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };
  
  // Get appropriate icon based on file type
  const getFileIcon = () => {
    if (isImage) return <ImageIcon color="primary" fontSize="large" />;
    if (isVideo) return <VideoIcon color="secondary" fontSize="large" />;
    if (isAudio) return <AudioIcon color="success" fontSize="large" />;
    if (isPdf) return <PdfIcon color="error" fontSize="large" />;
    return <FileIcon color="info" fontSize="large" />;
  };
  
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  return (
    <>
      <Paper
        elevation={3}
        sx={{
          p: 1.5,
          maxWidth: '100%',
          width: 'fit-content',
          borderRadius: 2,
          bgcolor: isOwnMessage ? theme.palette.primary.main : theme.palette.background.paper,
          color: isOwnMessage ? theme.palette.primary.contrastText : theme.palette.text.primary,
          ml: isOwnMessage ? 'auto' : 0,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Grid container spacing={1} alignItems="center">
          {/* File preview thumbnail for images */}
          {isImage && file.thumbnailUrl && (
            <Grid item xs={12}>
              <Box
                sx={{
                  width: '100%',
                  height: 150,
                  overflow: 'hidden',
                  borderRadius: 1,
                  cursor: 'pointer',
                  mb: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(0,0,0,0.05)'
                }}
                onClick={handleOpenPreview}
              >
                <img
                  src={file.thumbnailUrl}
                  alt={file.name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                />
              </Box>
            </Grid>
          )}
          
          {/* File icon */}
          <Grid item>
            <Box sx={{ p: 1 }}>
              {getFileIcon()}
            </Box>
          </Grid>
          
          {/* File details */}
          <Grid item xs>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 'bold',
                wordBreak: 'break-word',
                mb: 0.5
              }}
              noWrap
            >
              {file.name}
            </Typography>
            <Typography
              variant="caption"
              display="block"
              sx={{
                opacity: 0.8
              }}
            >
              {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleTimeString()}
            </Typography>
          </Grid>
          
          {/* Actions */}
          <Grid item>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {/* Download button */}
              <Tooltip title="Download">
                <IconButton
                  size="small"
                  onClick={handleDownload}
                  disabled={loading}
                  sx={{
                    color: isOwnMessage ? 'rgba(255,255,255,0.8)' : theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                    },
                    mb: 1
                  }}
                >
                  {loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <DownloadIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
              
              {/* Preview button for viewable content */}
              {(isImage || isVideo || isAudio || isPdf) && (
                <Tooltip title="Open preview">
                  <IconButton
                    size="small"
                    onClick={handleOpenPreview}
                    sx={{
                      color: isOwnMessage ? 'rgba(255,255,255,0.8)' : theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                      }
                    }}
                  >
                    <OpenIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={handleClosePreview}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: isVideo || isAudio ? 'auto' : '80vh'
          }
        }}
      >
        <Box sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          p: 1,
          position: 'absolute',
          right: 0,
          zIndex: 1
        }}>
          {isImage && (
            <>
              <IconButton onClick={handleZoomIn}>
                <ZoomInIcon />
              </IconButton>
              <IconButton onClick={handleZoomOut}>
                <ZoomOutIcon />
              </IconButton>
            </>
          )}
          <IconButton onClick={handleClosePreview}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        <DialogContent
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
            height: '100%',
            overflow: 'auto'
          }}
        >
          {/* Image Preview */}
          {isImage && (
            <img
              src={file.url}
              alt={file.name}
              style={{
                maxWidth: `${100 * zoomLevel}%`,
                maxHeight: `${100 * zoomLevel}%`,
                objectFit: 'contain',
                transition: 'transform 0.2s'
              }}
            />
          )}
          
          {/* Video Preview */}
          {isVideo && (
            <video
              controls
              autoPlay
              style={{ maxWidth: '100%', maxHeight: '70vh' }}
            >
              <source src={file.url} type={file.type} />
              Your browser does not support the video tag.
            </video>
          )}
          
          {/* Audio Preview */}
          {isAudio && (
            <Box sx={{ width: '100%', textAlign: 'center' }}>
              <AudioIcon sx={{ fontSize: 80, mb: 2, color: theme.palette.success.main }} />
              <Typography variant="h6" gutterBottom>
                {file.name}
              </Typography>
              <audio controls style={{ width: '100%', maxWidth: 500 }}>
                <source src={file.url} type={file.type} />
                Your browser does not support the audio element.
              </audio>
            </Box>
          )}
          
          {/* PDF Preview - In a real app, you'd use a PDF viewer */}
          {isPdf && (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="body1" gutterBottom>
                PDF preview is not available in this demo. You can download the file instead.
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                sx={{ mt: 2 }}
              >
                Download PDF
              </Button>
            </Box>
          )}
          
          {/* Other file types */}
          {!isImage && !isVideo && !isAudio && !isPdf && (
            <Box sx={{ textAlign: 'center' }}>
              <FileIcon sx={{ fontSize: 80, mb: 2, color: theme.palette.info.main }} />
              <Typography variant="h6" gutterBottom>
                {file.name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                This file type cannot be previewed.
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                sx={{ mt: 2 }}
              >
                Download File
              </Button>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ justifyContent: 'space-between', px: 3, py: 2 }}>
          <Typography variant="caption">
            {formatFileSize(file.size)} • Uploaded {new Date(file.uploadedAt).toLocaleString()}
          </Typography>
          <Button onClick={handleClosePreview} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FileMessage; 