import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  Typography,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Folder,
  FolderOpen,
  ExpandMore,
  ChevronRight,
  Add,
  MoreVert
} from '@mui/icons-material';
import { IDocument } from '@/services/documents-service';
import documentsService from '@/services/documents-service';
import toast from '@/utils/toast';

interface FolderTreeProps {
  onFolderSelect: (folderPath: string, folderId?: string | null) => void;
  selectedFolderPath: string;
  onFolderCreate: (parentPath: string) => void;
  refreshTrigger?: number; // Add refresh trigger prop
}

interface FolderNode {
  id: string;
  name: string;
  path: string;
  children: FolderNode[];
  expanded: boolean;
  childrenCount: number;
}

const FolderTree: React.FC<FolderTreeProps> = ({
  onFolderSelect,
  selectedFolderPath,
  onFolderCreate,
  refreshTrigger
}) => {
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadRootFolders();
  }, [refreshTrigger]);

  const loadRootFolders = async () => {
    try {
      setLoading(true);
      setError(null);
      // Load only root level folders (those with parentFolderId = null)
      const rootItems = await documentsService.getFolderContents('/', null);
      const rootFolders = rootItems
        .filter(item => item.isFolder)
        .map(item => ({
          id: item._id,
          name: item.folderName || item.title,
          path: item.folderPath,
          children: [],
          expanded: false,
          childrenCount: item.childrenCount || 0
        }));
      setFolders(rootFolders);
    } catch (err) {
      console.error('Error loading root folders:', err);
      setError('Failed to load folder structure');
      toast.error('Failed to load folder structure');
    } finally {
      setLoading(false);
    }
  };

  const loadFolderChildren = async (folderId: string, folderPath: string): Promise<FolderNode[]> => {
    try {
      setLoadingFolders(prev => new Set(prev).add(folderId));
      const childItems = await documentsService.getFolderContents(folderPath, folderId);
      const childFolders = childItems
        .filter(item => item.isFolder)
        .map(item => ({
          id: item._id,
          name: item.folderName || item.title,
          path: item.folderPath,
          children: [],
          expanded: false,
          childrenCount: item.childrenCount || 0
        }));
      return childFolders.sort((a, b) => a.name.localeCompare(b.name));
    } catch (err) {
      console.error('Error loading folder children:', err);
      toast.error('Failed to load folder contents');
      return [];
    } finally {
      setLoadingFolders(prev => {
        const newSet = new Set(prev);
        newSet.delete(folderId);
        return newSet;
      });
    }
  };

  const toggleFolder = async (folderPath: string, folderId: string) => {
    const updateExpanded = (folders: FolderNode[]): FolderNode[] => {
      return folders.map(folder => {
        if (folder.path === folderPath) {
          const newExpanded = !folder.expanded;
          
          // If expanding and children haven't been loaded yet, load them
          if (newExpanded && folder.children.length === 0 && folder.childrenCount > 0) {
            loadFolderChildren(folderId, folderPath).then(children => {
              const updateWithChildren = (folders: FolderNode[]): FolderNode[] => {
                return folders.map(f => {
                  if (f.path === folderPath) {
                    return { ...f, children, expanded: newExpanded };
                  }
                  if (f.children.length > 0) {
                    return { ...f, children: updateWithChildren(f.children) };
                  }
                  return f;
                });
              };
              setFolders(currentFolders => updateWithChildren(currentFolders));
            });
          }
          
          return { ...folder, expanded: newExpanded };
        }
        if (folder.children.length > 0) {
          return { ...folder, children: updateExpanded(folder.children) };
        }
        return folder;
      });
    };

    setFolders(currentFolders => updateExpanded(currentFolders));
  };

  const handleFolderClick = (folderPath: string, folderId?: string) => {
    onFolderSelect(folderPath, folderId);
  };

  const renderFolder = (folder: FolderNode, level: number = 0) => {
    const isSelected = folder.path === selectedFolderPath;
    const hasChildren = folder.children.length > 0;

    return (
      <React.Fragment key={folder.id}>
        <ListItem 
          disablePadding 
          sx={{ 
            pl: level * 2,
            '& .MuiListItemButton-root': {
              borderRadius: 1,
              mx: 1,
              mb: 0.5
            }
          }}
        >
          <ListItemButton
            selected={isSelected}
            onClick={() => handleFolderClick(folder.path, folder.id)}
            sx={{
              minHeight: 40,
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
              {hasChildren || folder.childrenCount > 0 ? (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFolder(folder.path, folder.id);
                  }}
                  sx={{ 
                    p: 0.5,
                    color: 'inherit'
                  }}
                  disabled={loadingFolders.has(folder.id)}
                >
                  {loadingFolders.has(folder.id) ? (
                    <CircularProgress size={16} />
                  ) : folder.expanded ? (
                    <ExpandMore fontSize="small" />
                  ) : (
                    <ChevronRight fontSize="small" />
                  )}
                </IconButton>
              ) : (
                <Box sx={{ width: 24, height: 24 }} />
              )}
            </ListItemIcon>
            
            <ListItemIcon sx={{ minWidth: 32, ml: -1 }}>
              {folder.expanded ? (
                <FolderOpen fontSize="small" color="primary" />
              ) : (
                <Folder fontSize="small" color="primary" />
              )}
            </ListItemIcon>
            
            <ListItemText 
              primary={folder.name}
              secondary={
                folder.childrenCount > 0 ? (
                  <Typography variant="caption" color="text.secondary">
                    {folder.childrenCount} item{folder.childrenCount !== 1 ? 's' : ''}
                  </Typography>
                ) : undefined
              }
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: isSelected ? 600 : 400
              }}
            />
          </ListItemButton>
        </ListItem>

        <Collapse in={folder.expanded} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {folder.children.map(child => renderFolder(child, level + 1))}
          </List>
        </Collapse>
      </React.Fragment>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={2}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Typography variant="body2" color="text.secondary" align="center">
          Unable to load folder structure
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
      {/* Root folder */}
      <ListItem disablePadding>
        <ListItemButton
          selected={selectedFolderPath === '/'}
          onClick={() => handleFolderClick('/', null)}
          sx={{
            minHeight: 40,
            borderRadius: 1,
            mx: 1,
            mb: 0.5,
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
            <Folder fontSize="small" color="primary" />
          </ListItemIcon>
          
          <ListItemText 
            primary="Root"
            primaryTypographyProps={{
              fontSize: '0.875rem',
              fontWeight: selectedFolderPath === '/' ? 600 : 400
            }}
          />
        </ListItemButton>
      </ListItem>

      {/* Folder tree */}
      {folders.map(folder => renderFolder(folder))}

      {/* Create folder button */}
      <Box sx={{ p: 2, pt: 1 }}>
        <Tooltip title="Create New Folder">
          <IconButton
            size="small"
            onClick={() => onFolderCreate(selectedFolderPath)}
            sx={{
              width: '100%',
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 1,
              py: 1,
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'primary.50',
              },
            }}
          >
            <Add fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="caption" color="text.secondary">
              New Folder
            </Typography>
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default FolderTree;
