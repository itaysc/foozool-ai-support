import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  DriveFileMove,
  Folder,
  FolderOpen,
  Home,
  ChevronRight,
  Check
} from '@mui/icons-material';
import { IDocument } from '@/services/documents-service';
import documentsService from '@/services/documents-service';
import toast from '@/utils/toast';

interface MoveDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: {
    id: string;
    name: string;
    isFolder: boolean;
    currentPath: string;
  } | null;
}

interface FolderNode {
  id: string;
  name: string;
  path: string;
  children: FolderNode[];
  expanded: boolean;
}

const MoveDialog: React.FC<MoveDialogProps> = ({
  open,
  onClose,
  onSuccess,
  item
}) => {
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>('/');
  const [loading, setLoading] = useState(false);
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      setSelectedPath('/');
      setError(null);
      setExpandedFolders(new Set());
      loadFolderTree();
    }
  }, [open]);

  const loadFolderTree = async () => {
    try {
      setLoading(true);
      const folderList = await documentsService.getFolderTree();
      const folderTree = buildFolderTree(folderList);
      setFolders(folderTree);
    } catch (err) {
      console.error('Error loading folder tree:', err);
      toast.error('Failed to load folder tree');
    } finally {
      setLoading(false);
    }
  };

  const buildFolderTree = (folderList: IDocument[]): FolderNode[] => {
    const folderMap = new Map<string, FolderNode>();
    const rootFolders: FolderNode[] = [];

    // Create folder nodes
    folderList.forEach(folder => {
      if (folder.isFolder && folder.folderName) {
        folderMap.set(folder.folderPath, {
          id: folder._id,
          name: folder.folderName,
          path: folder.folderPath,
          children: [],
          expanded: false
        });
      }
    });

    // Build tree structure
    folderMap.forEach((folder, path) => {
      const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
      
      if (parentPath === '/' && path !== '/') {
        // Root level folder
        rootFolders.push(folder);
      } else if (folderMap.has(parentPath)) {
        // Child folder
        folderMap.get(parentPath)!.children.push(folder);
      }
    });

    // Sort folders alphabetically
    const sortFolders = (folders: FolderNode[]) => {
      folders.sort((a, b) => a.name.localeCompare(b.name));
      folders.forEach(folder => sortFolders(folder.children));
    };

    sortFolders(rootFolders);
    return rootFolders;
  };

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
      }
      return newSet;
    });
  };

  const handleMove = async () => {
    if (!item) return;

    // Check if trying to move to the same location
    if (selectedPath === item.currentPath) {
      setError('Item is already in this location');
      return;
    }

    // Check if trying to move folder into itself or its subfolder
    if (item.isFolder && selectedPath.startsWith(item.currentPath + '/')) {
      setError('Cannot move folder into itself or its subfolder');
      return;
    }

    try {
      setMoving(true);
      setError(null);

      await documentsService.moveItem(item.id, selectedPath);
      
      toast.success(`${item.isFolder ? 'Folder' : 'Document'} moved successfully`);
      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error('Error moving item:', err);
      const errorMessage = err.response?.data?.message || 'Failed to move item';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setMoving(false);
    }
  };

  const handleClose = () => {
    setSelectedPath('/');
    setError(null);
    setExpandedFolders(new Set());
    onClose();
  };

  const renderFolder = (folder: FolderNode, level: number = 0) => {
    const isSelected = folder.path === selectedPath;
    const isExpanded = expandedFolders.has(folder.path);
    const hasChildren = folder.children.length > 0;

    return (
      <React.Fragment key={folder.id}>
        <ListItem disablePadding>
          <ListItemButton
            selected={isSelected}
            onClick={() => setSelectedPath(folder.path)}
            sx={{
              pl: level * 2 + 2,
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                '& .MuiListItemIcon-root': {
                  color: 'primary.contrastText',
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              {hasChildren ? (
                <ChevronRight 
                  fontSize="small" 
                  sx={{ 
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}
                />
              ) : (
                <Box sx={{ width: 24, height: 24 }} />
              )}
            </ListItemIcon>
            
            <ListItemIcon sx={{ minWidth: 32, ml: -1 }}>
              {isExpanded ? (
                <FolderOpen fontSize="small" />
              ) : (
                <Folder fontSize="small" />
              )}
            </ListItemIcon>
            
            <ListItemText 
              primary={folder.name}
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: isSelected ? 600 : 400
              }}
            />

            {isSelected && (
              <Check fontSize="small" color="inherit" />
            )}
          </ListItemButton>
        </ListItem>

        {hasChildren && isExpanded && (
          <List component="div" disablePadding>
            {folder.children.map(child => renderFolder(child, level + 1))}
          </List>
        )}
      </React.Fragment>
    );
  };

  if (!item) return null;

  const getSelectedFolderName = () => {
    if (selectedPath === '/') return 'Root folder';
    const segments = selectedPath.split('/').filter(s => s.length > 0);
    return segments[segments.length - 1] || 'Root folder';
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, height: '80vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <DriveFileMove color="primary" />
          <Box>
            <Typography variant="h6">
              Move {item.isFolder ? 'Folder' : 'Document'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {item.name}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 2, pb: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select a destination folder for "{item.name}"
          </Typography>
        </Box>

        <Divider />

        <Box sx={{ height: 400, overflow: 'auto' }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {/* Root folder */}
              <ListItem disablePadding>
                <ListItemButton
                  selected={selectedPath === '/'}
                  onClick={() => setSelectedPath('/')}
                  sx={{
                    pl: 2,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'primary.contrastText',
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Box sx={{ width: 24, height: 24 }} />
                  </ListItemIcon>
                  
                  <ListItemIcon sx={{ minWidth: 32, ml: -1 }}>
                    <Home fontSize="small" />
                  </ListItemIcon>
                  
                  <ListItemText 
                    primary="Root folder"
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: selectedPath === '/' ? 600 : 400
                    }}
                  />

                  {selectedPath === '/' && (
                    <Check fontSize="small" color="inherit" />
                  )}
                </ListItemButton>
              </ListItem>

              {/* Folder tree */}
              {folders.map(folder => {
                const renderFolderWithToggle = (folder: FolderNode, level: number = 0) => {
                  const isSelected = folder.path === selectedPath;
                  const isExpanded = expandedFolders.has(folder.path);
                  const hasChildren = folder.children.length > 0;

                  return (
                    <React.Fragment key={folder.id}>
                      <ListItem disablePadding>
                        <ListItemButton
                          selected={isSelected}
                          onClick={() => setSelectedPath(folder.path)}
                          sx={{
                            pl: level * 2 + 2,
                            '&.Mui-selected': {
                              backgroundColor: 'primary.main',
                              color: 'primary.contrastText',
                              '&:hover': {
                                backgroundColor: 'primary.dark',
                              },
                              '& .MuiListItemIcon-root': {
                                color: 'primary.contrastText',
                              },
                            },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            {hasChildren ? (
                              <ChevronRight 
                                fontSize="small" 
                                sx={{ 
                                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.2s'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFolder(folder.path);
                                }}
                              />
                            ) : (
                              <Box sx={{ width: 24, height: 24 }} />
                            )}
                          </ListItemIcon>
                          
                          <ListItemIcon sx={{ minWidth: 32, ml: -1 }}>
                            {isExpanded ? (
                              <FolderOpen fontSize="small" />
                            ) : (
                              <Folder fontSize="small" />
                            )}
                          </ListItemIcon>
                          
                          <ListItemText 
                            primary={folder.name}
                            primaryTypographyProps={{
                              fontSize: '0.875rem',
                              fontWeight: isSelected ? 600 : 400
                            }}
                          />

                          {isSelected && (
                            <Check fontSize="small" color="inherit" />
                          )}
                        </ListItemButton>
                      </ListItem>

                      {hasChildren && isExpanded && (
                        <List component="div" disablePadding>
                          {folder.children.map(child => renderFolderWithToggle(child, level + 1))}
                        </List>
                      )}
                    </React.Fragment>
                  );
                };

                return renderFolderWithToggle(folder);
              })}
            </List>
          )}
        </Box>

        <Divider />

        <Box sx={{ p: 2, pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Destination:</strong> {getSelectedFolderName()}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button 
          onClick={handleClose}
          disabled={moving}
          sx={{ borderRadius: 1 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleMove}
          variant="contained"
          disabled={moving || selectedPath === item.currentPath}
          sx={{ borderRadius: 1 }}
        >
          {moving ? 'Moving...' : 'Move'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MoveDialog;
