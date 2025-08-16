import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material';
import {
  Google as GoogleIcon,
  CloudUpload as CloudUploadIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import apiService from '../../../services/api-service';

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  parents?: string[];
  path?: string;
}

interface ProcessingResult {
  success: boolean;
  processedFiles: string[];
  totalChunks: number;
  errors: string[];
  totalFilesFound: number;
  processingStats?: {
    totalFiles: number;
    processedFiles: number;
    failedFiles: number;
    totalChunks: number;
    processingTime: number;
  };
}

interface GoogleSettingsProps {
  onShowSnackbar: (message: string, severity?: 'success' | 'error' | 'info' | 'warning') => void;
}

const GoogleSettings: React.FC<GoogleSettingsProps> = ({ onShowSnackbar }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [processingDialogOpen, setProcessingDialogOpen] = useState(false);
  
  // Processing options
  const [processingOptions, setProcessingOptions] = useState({
    path: '',
    recursive: false,
    specificFileIds: [] as string[],
    useSpecificFiles: false
  });

  // File selection for specific processing
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState({
    name: true,
    type: true,
    path: true
  });
  
  // Separate search for file processing section
  const [processingSearchQuery, setProcessingSearchQuery] = useState('');

  useEffect(() => {
    checkConnectionStatus();
    loadFiles();
  }, []);

  // Keyboard shortcuts for search
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+F to focus search
      if (event.ctrlKey && event.key === 'f') {
        event.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search files"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
      
      // Escape to clear search
      if (event.key === 'Escape' && searchQuery) {
        setSearchQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  const checkConnectionStatus = async () => {
    try {
      // Try to list files to check if connected
      const response = await apiService.google.listFiles();
      const wasConnected = isConnected;
      setIsConnected(response.success);
      
      // If we just got connected, show success message
      if (!wasConnected && response.success) {
        onShowSnackbar('Google Drive connected successfully! 🎉', 'success');
      }
    } catch (error) {
      setIsConnected(false);
    }
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const response = await apiService.google.connect();
      
      if (response.success && response.redirectUrl) {
        // Open Google OAuth in new window
        const authWindow = window.open(
          response.redirectUrl, 
          'googleOAuth', 
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );
        
        if (authWindow) {
          onShowSnackbar('Google OAuth window opened. Please complete the authorization.', 'info');
          
          // Check if the window was closed or redirected
          const checkWindow = setInterval(() => {
            if (authWindow.closed) {
              clearInterval(checkWindow);
              // Check connection status after window closes
              setTimeout(() => {
                checkConnectionStatus();
                loadFiles();
              }, 1000);
            }
          }, 1000);
        } else {
          onShowSnackbar('Popup blocked! Please allow popups and try again.', 'warning');
        }
      } else {
        onShowSnackbar('Failed to initiate Google connection', 'error');
      }
    } catch (error) {
      console.error('Google connection error:', error);
      onShowSnackbar('Failed to connect to Google', 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  const loadFiles = async () => {
    try {
      setIsLoadingFiles(true);
      const response = await apiService.google.listFiles();
      if (response.success) {
        setFiles(response.files || []);
      }
    } catch (error) {
      onShowSnackbar('Failed to load Google Drive files', 'error');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleProcessFiles = async () => {
    try {
      setIsProcessing(true);
      setProcessingResult(null);
      
      let response;
      if (processingOptions.useSpecificFiles && selectedFiles.length > 0) {
        response = await apiService.google.processFiles({
          fileIds: selectedFiles
        });
      } else {
        response = await apiService.google.processFiles({
          path: processingOptions.path || undefined,
          recursive: processingOptions.recursive
        });
      }

      if (response.success) {
        setProcessingResult(response);
        setProcessingDialogOpen(true);
        onShowSnackbar('Files processed successfully!', 'success');
        loadFiles(); // Refresh file list
      } else {
        onShowSnackbar('Failed to process files', 'error');
      }
    } catch (error) {
      onShowSnackbar('Error processing files', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('folder')) return '📁';
    if (mimeType.includes('document')) return '📄';
    if (mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('image')) return '🖼️';
    return '📎';
  };

  // Filter files based on search query
  const filteredFiles = files.filter(file => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const searchableText = [
      searchFilters.name ? file.name : '',
      searchFilters.type ? file.mimeType : '',
      searchFilters.path ? (file.path || '') : ''
    ].filter(Boolean).join(' ').toLowerCase();
    
    return searchableText.includes(query);
  });

  // Get file type category for better organization
  const getFileTypeCategory = (mimeType: string) => {
    if (mimeType.includes('folder')) return 'Folders';
    if (mimeType.includes('document')) return 'Documents';
    if (mimeType.includes('spreadsheet')) return 'Spreadsheets';
    if (mimeType.includes('image')) return 'Images';
    if (mimeType.includes('video')) return 'Videos';
    if (mimeType.includes('audio')) return 'Audio';
    return 'Other Files';
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <GoogleIcon color="primary" />
        Google Drive Integration
      </Typography>

      {/* Connection Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Connection Status
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Chip
              icon={isConnected ? <CheckCircleIcon /> : <ErrorIcon />}
              label={isConnected ? 'Connected' : 'Not Connected'}
              color={isConnected ? 'success' : 'error'}
              variant="outlined"
            />
            {isConnected && (
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadFiles}
                disabled={isLoadingFiles}
              >
                Refresh Files
              </Button>
            )}
          </Box>
          
          {!isConnected && (
            <Button
              variant="contained"
              startIcon={<GoogleIcon />}
              onClick={handleConnect}
              disabled={isConnecting}
              sx={{ mr: 2 }}
            >
              {isConnecting ? 'Connecting...' : 'Connect to Google Drive'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* File Processing */}
      {isConnected && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Process Google Drive Files
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
              <Box sx={{ minWidth: 200 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={processingOptions.useSpecificFiles}
                      onChange={(e) => setProcessingOptions(prev => ({
                        ...prev,
                        useSpecificFiles: e.target.checked
                      }))}
                    />
                  }
                  label="Process specific files"
                />
              </Box>
              
              {!processingOptions.useSpecificFiles && (
                <>
                  <Box sx={{ minWidth: 200 }}>
                    <TextField
                      fullWidth
                      label="Path (optional)"
                      value={processingOptions.path}
                      onChange={(e) => setProcessingOptions(prev => ({
                        ...prev,
                        path: e.target.value
                      }))}
                      placeholder="e.g., features, docs"
                      helperText="Leave empty to process all files"
                    />
                  </Box>
                  <Box sx={{ minWidth: 200 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={processingOptions.recursive}
                          onChange={(e) => setProcessingOptions(prev => ({
                            ...prev,
                            recursive: e.target.checked
                          }))}
                        />
                      }
                      label="Include subfolders"
                    />
                  </Box>
                </>
              )}
            </Box>

            {processingOptions.useSpecificFiles && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Select files to process:
                </Typography>
                
                {/* Search for specific files */}
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search files to select for processing..."
                    value={processingSearchQuery}
                    onChange={(e) => setProcessingSearchQuery(e.target.value)}
                    sx={{ mb: 1 }}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 1, color: 'text.secondary' }}>
                          🔍
                        </Box>
                      ),
                      endAdornment: processingSearchQuery && (
                        <Box 
                          sx={{ 
                            cursor: 'pointer', 
                            color: 'text.secondary',
                            '&:hover': { color: 'text.primary' }
                          }}
                          onClick={() => setProcessingSearchQuery('')}
                        >
                          ✕
                        </Box>
                      )
                    }}
                  />
                  
                  {/* Quick selection actions */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        const processingFilteredFiles = files.filter(file => {
                          if (!processingSearchQuery.trim()) return true;
                          const query = processingSearchQuery.toLowerCase();
                          const searchableText = [
                            file.name,
                            file.mimeType,
                            file.path || ''
                          ].filter(Boolean).join(' ').toLowerCase();
                          return searchableText.includes(query);
                        });
                        const visibleFileIds = processingFilteredFiles.map(f => f.id);
                        setSelectedFiles(prev => {
                          const newSelection = [...new Set([...prev, ...visibleFileIds])];
                          return newSelection;
                        });
                      }}
                      disabled={files.length === 0}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      Select All Visible ({(() => {
                        const processingFilteredFiles = files.filter(file => {
                          if (!processingSearchQuery.trim()) return true;
                          const query = processingSearchQuery.toLowerCase();
                          const searchableText = [
                            file.name,
                            file.mimeType,
                            file.path || ''
                          ].filter(Boolean).join(' ').toLowerCase();
                          return searchableText.includes(query);
                        });
                        return processingFilteredFiles.length;
                      })()})
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setSelectedFiles([])}
                      disabled={selectedFiles.length === 0}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      Clear Selection ({selectedFiles.length})
                    </Button>
                    {processingSearchQuery && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setProcessingSearchQuery('')}
                        sx={{ fontSize: '0.75rem' }}
                      >
                        Clear Search
                      </Button>
                    )}
                  </Box>
                </Box>
                
                {/* File selection list with search */}
                <Box sx={{ maxHeight: 300, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  {(() => {
                    const processingFilteredFiles = files.filter(file => {
                      if (!processingSearchQuery.trim()) return true;
                      const query = processingSearchQuery.toLowerCase();
                      const searchableText = [
                        file.name,
                        file.mimeType,
                        file.path || ''
                      ].filter(Boolean).join(' ').toLowerCase();
                      return searchableText.includes(query);
                    });
                    
                    if (processingFilteredFiles.length > 0) {
                      return processingFilteredFiles.map((file) => (
                        <Box
                          key={file.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            p: 1.5,
                            cursor: 'pointer',
                            bgcolor: selectedFiles.includes(file.id) ? 'action.selected' : 'transparent',
                            '&:hover': { bgcolor: 'action.hover' },
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            '&:last-child': { borderBottom: 'none' }
                          }}
                          onClick={() => handleFileSelection(file.id)}
                        >
                          <span style={{ fontSize: '1.2rem' }}>{getFileIcon(file.mimeType)}</span>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: processingSearchQuery && file.name.toLowerCase().includes(processingSearchQuery.toLowerCase()) ? 600 : 400,
                                color: processingSearchQuery && file.name.toLowerCase().includes(processingSearchQuery.toLowerCase()) ? 'primary.main' : 'inherit'
                              }}
                            >
                              {file.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {file.mimeType}
                              {file.path && ` • ${file.path}`}
                            </Typography>
                          </Box>
                          <Chip
                            size="small"
                            label={selectedFiles.includes(file.id) ? 'Selected' : 'Click to select'}
                            color={selectedFiles.includes(file.id) ? 'primary' : 'default'}
                            variant={selectedFiles.includes(file.id) ? 'filled' : 'outlined'}
                            sx={{ minWidth: 80 }}
                          />
                        </Box>
                      ));
                    } else if (processingSearchQuery) {
                      return (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            No files match your search "{processingSearchQuery}"
                          </Typography>
                          <Button 
                            size="small" 
                            variant="outlined" 
                            onClick={() => setProcessingSearchQuery('')}
                          >
                            Clear Search
                          </Button>
                        </Box>
                      );
                    } else {
                      return (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            No files available for selection
                          </Typography>
                        </Box>
                      );
                    }
                  })()}
                </Box>
                
                {/* Selection summary */}
                {selectedFiles.length > 0 && (
                  <Box sx={{ mt: 2, p: 1.5, bgcolor: 'success.light', borderRadius: 1, color: 'white' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ✓ {selectedFiles.length} file(s) selected for processing
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            <Button
              variant="contained"
              startIcon={<CloudUploadIcon />}
              onClick={handleProcessFiles}
              disabled={isProcessing || (processingOptions.useSpecificFiles && selectedFiles.length === 0)}
              sx={{ mr: 2 }}
            >
              {isProcessing ? 'Processing...' : 'Process Files'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* File List */}
      {isConnected && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Google Drive Files
            </Typography>
            
            {/* Search and Filter Interface */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                  fullWidth
                  placeholder="Search files by name, type, or path... (Press Ctrl+F to focus)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{ minWidth: 300, flex: 1 }}
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, color: 'text.secondary' }}>
                        🔍
                      </Box>
                    ),
                    endAdornment: searchQuery && (
                      <Box 
                        sx={{ 
                          cursor: 'pointer', 
                          color: 'text.secondary',
                          '&:hover': { color: 'text.primary' }
                        }}
                        onClick={() => setSearchQuery('')}
                      >
                        ✕
                      </Box>
                    )
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={() => setSearchQuery('')}
                  disabled={!searchQuery}
                  size="small"
                >
                  Clear
                </Button>
                <Chip 
                  label={`${filteredFiles.length} files`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                {selectedFiles.length > 0 && (
                  <Chip 
                    label={`${selectedFiles.length} selected`}
                    size="small"
                    color="success"
                    variant="filled"
                  />
                )}
              </Box>
              
              {/* Search Filters */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={searchFilters.name}
                      onChange={(e) => setSearchFilters(prev => ({
                        ...prev,
                        name: e.target.checked
                      }))}
                      size="small"
                    />
                  }
                  label="Search in names"
                  sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={searchFilters.type}
                      onChange={(e) => setSearchFilters(prev => ({
                        ...prev,
                        type: e.target.checked
                      }))}
                      size="small"
                    />
                  }
                  label="Search in types"
                  sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={searchFilters.path}
                      onChange={(e) => setSearchFilters(prev => ({
                        ...prev,
                        path: e.target.checked
                      }))}
                      size="small"
                    />
                  }
                  label="Search in paths"
                  sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
                />
              </Box>
              
              {/* Search Results Summary */}
              {searchQuery && (
                <Box sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Found {filteredFiles.length} of {files.length} files matching "{searchQuery}"
                  </Typography>
                </Box>
              )}
              
              {/* Selected Files Actions */}
              {selectedFiles.length > 0 && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1, color: 'white' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {selectedFiles.length} file(s) selected
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setSelectedFiles([])}
                      sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
                    >
                      Clear Selection
                    </Button>
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Click "Process Files" above to process the selected files
                  </Typography>
                </Box>
              )}
            </Box>
            
            {isLoadingFiles ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : filteredFiles.length > 0 ? (
              <Box>
                {/* File Type Categories */}
                {(() => {
                  const categories = {};
                  filteredFiles.forEach(file => {
                    const category = getFileTypeCategory(file.mimeType);
                    if (!categories[category]) categories[category] = [];
                    categories[category].push(file);
                  });
                  
                  return Object.entries(categories).map(([category, categoryFiles]) => (
                    <Box key={category} sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 600, 
                        mb: 1, 
                        color: 'text.secondary',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        pb: 0.5
                      }}>
                        {category} ({categoryFiles.length})
                      </Typography>
                      <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                        {categoryFiles.map((file) => (
                          <ListItem 
                            key={file.id} 
                            divider 
                            sx={{ 
                              '&:hover': { bgcolor: 'action.hover' },
                              cursor: 'pointer'
                            }}
                            onClick={() => handleFileSelection(file.id)}
                          >
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <span>{getFileIcon(file.mimeType)}</span>
                                  <Typography 
                                    variant="body1" 
                                    sx={{ 
                                      fontWeight: searchQuery && file.name.toLowerCase().includes(searchQuery.toLowerCase()) ? 600 : 400,
                                      color: searchQuery && file.name.toLowerCase().includes(searchQuery.toLowerCase()) ? 'primary.main' : 'inherit'
                                    }}
                                  >
                                    {file.name}
                                  </Typography>
                                  {selectedFiles.includes(file.id) && (
                                    <Chip 
                                      label="Selected" 
                                      size="small" 
                                      color="primary" 
                                      variant="filled"
                                    />
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.secondary">
                                    Type: {file.mimeType}
                                  </Typography>
                                  {file.size && (
                                    <Typography variant="body2" color="text.secondary">
                                      Size: {file.size}
                                    </Typography>
                                  )}
                                  {file.path && (
                                    <Typography variant="body2" color="text.secondary">
                                      Path: {file.path}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  ));
                })()}
              </Box>
            ) : searchQuery ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No files found
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  No files match your search "{searchQuery}"
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={() => setSearchQuery('')}
                  sx={{ mt: 1 }}
                >
                  Clear Search
                </Button>
              </Box>
            ) : (
              <Typography color="text.secondary" align="center">
                No files found in Google Drive
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Processing Results Dialog */}
      <Dialog
        open={processingDialogOpen}
        onClose={() => setProcessingDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Processing Results</DialogTitle>
        <DialogContent>
          {processingResult && (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                Processing completed successfully!
              </Alert>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ minWidth: 150, flex: '1 1 150px' }}>
                  <Typography variant="subtitle2">Total Files Found:</Typography>
                  <Typography variant="h6">{processingResult.totalFilesFound}</Typography>
                </Box>
                <Box sx={{ minWidth: 150, flex: '1 1 150px' }}>
                  <Typography variant="subtitle2">Processed Files:</Typography>
                  <Typography variant="h6">{processingResult.processedFiles.length}</Typography>
                </Box>
                <Box sx={{ minWidth: 150, flex: '1 1 150px' }}>
                  <Typography variant="subtitle2">Total Chunks:</Typography>
                  <Typography variant="h6">{processingResult.totalChunks}</Typography>
                </Box>
                <Box sx={{ minWidth: 150, flex: '1 1 150px' }}>
                  <Typography variant="subtitle2">Errors:</Typography>
                  <Typography variant="h6" color="error">
                    {processingResult.errors.length}
                  </Typography>
                </Box>
              </Box>

              {processingResult.errors.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="error" gutterBottom>
                    Errors:
                  </Typography>
                  <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
                    {processingResult.errors.map((error, index) => (
                      <Typography key={index} variant="body2" color="error">
                        • {error}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}

              {processingResult.processingStats && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Processing Statistics:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ minWidth: 100, flex: '1 1 100px' }}>
                      <Typography variant="body2">Total: {processingResult.processingStats.totalFiles}</Typography>
                    </Box>
                    <Box sx={{ minWidth: 100, flex: '1 1 100px' }}>
                      <Typography variant="body2">Processed: {processingResult.processingStats.processedFiles}</Typography>
                    </Box>
                    <Box sx={{ minWidth: 100, flex: '1 1 100px' }}>
                      <Typography variant="body2">Failed: {processingResult.processingStats.failedFiles}</Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Processing Time: {processingResult.processingStats.processingTime}ms
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProcessingDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GoogleSettings;
