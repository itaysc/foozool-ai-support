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
  onFolderSelect: (folderPath: string) => void;
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

  useEffect(() => {
    loadFolderTree();
  }, [refreshTrigger]);

  const loadFolderTree = async () => {
    try {
      setLoading(true);
      setError(null);
      const folderList = await documentsService.getFolderTree();
      const folderTree = buildFolderTree(folderList);
      setFolders(folderTree);
    } catch (err) {
      console.error('Error loading folder tree:', err);
      setError('Failed to load folder tree');
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
          expanded: false,
          childrenCount: folder.childrenCount || 0
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
        // Child folder - parent exists
        folderMap.get(parentPath)!.children.push(folder);
      } else if (parentPath !== '/' && path !== '/') {
        // Handle malformed paths - if parent doesn't exist, treat as root level
        console.warn(`Folder "${path}" has parent "${parentPath}" which doesn't exist. Treating as root level.`);
        rootFolders.push(folder);
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
    const updateExpanded = (folders: FolderNode[]): FolderNode[] => {
      return folders.map(folder => {
        if (folder.path === folderPath) {
          return { ...folder, expanded: !folder.expanded };
        }
        if (folder.children.length > 0) {
          return { ...folder, children: updateExpanded(folder.children) };
        }
        return folder;
      });
    };

    setFolders(updateExpanded(folders));
  };

  const handleFolderClick = (folderPath: string) => {
    onFolderSelect(folderPath);
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
            onClick={() => handleFolderClick(folder.path)}
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
              {hasChildren ? (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFolder(folder.path);
                  }}
                  sx={{ 
                    p: 0.5,
                    color: 'inherit'
                  }}
                >
                  {folder.expanded ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />}
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
          onClick={() => handleFolderClick('/')}
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
            primary="All Documents"
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
