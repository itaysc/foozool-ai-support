import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Folder,
  Description,
  Search,
  MoreVert,
  Edit,
  Delete,
  DriveFileMove,
  Visibility,
  Add,
  GridView,
  ViewList,
  SortByAlpha,
  DateRange,
  CloudQueue,
  Link,
  DriveFileRenameOutline,
  Psychology,
  Info
} from '@mui/icons-material';
import { IDocument } from '@/services/documents-service';
import documentsService from '@/services/documents-service';
import customersStore from '@/stores/customers.store';
import toast from '@/utils/toast';

interface FolderViewProps {
  currentPath: string;
  currentFolderId?: string | null;
  onDocumentView: (document: IDocument) => void;
  onDocumentEdit: (document: IDocument) => void;
  onDocumentRename: (document: IDocument) => void;
  onDocumentMove: (document: IDocument) => void;
  onDocumentDelete: (document: IDocument) => void;
  onFolderCreate: (parentPath: string) => void;
  onFolderEdit: (folder: IDocument) => void;
  onFolderRename: (folder: IDocument) => void;
  onFolderMove: (folder: IDocument) => void;
  onFolderDelete: (folder: IDocument) => void;
  onFolderNavigate: (folder: IDocument) => void;
  refreshTrigger?: number; // Add refresh trigger prop
}

type ViewMode = 'grid' | 'list';
type SortField = 'title' | 'createdAt' | 'updatedAt' | 'documentType';
type SortOrder = 'asc' | 'desc';

const FolderView: React.FC<FolderViewProps> = ({
  currentPath,
  currentFolderId,
  onDocumentView,
  onDocumentEdit,
  onDocumentRename,
  onDocumentMove,
  onDocumentDelete,
  onFolderCreate,
  onFolderEdit,
  onFolderRename,
  onFolderMove,
  onFolderDelete,
  onFolderNavigate,
  refreshTrigger
}) => {
  const [items, setItems] = useState<IDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterType, setFilterType] = useState<string>('all');
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    item: IDocument | null;
  } | null>(null);

  useEffect(() => {
    loadFolderContents();
  }, [currentPath, currentFolderId, refreshTrigger]);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadFolderContents = async () => {
    try {
      setLoading(true);
      setError(null);
      const contents = await documentsService.getFolderContents(currentPath, currentFolderId);
      setItems(contents);
    } catch (err) {
      console.error('Error loading folder contents:', err);
      setError('Failed to load folder contents');
      toast.error('Failed to load folder contents');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      await customersStore.fetchCustomers();
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  };

  const getCustomerName = (customerId?: string): string => {
    if (!customerId) return 'No Customer';
    const customer = customersStore.customers.find(c => c._id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };

  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDocumentTypeColor = (type: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' => {
    switch (type) {
      case 'meeting_summary':
        return 'primary';
      case 'note':
        return 'secondary';
      case 'report':
        return 'success';
      default:
        return 'default';
    }
  };

  const getDocumentIcon = (document: IDocument) => {
    if (document.isFolder) {
      return <Folder color="primary" />;
    }
    
    switch (document.documentType) {
      case 'google_doc':
        return <CloudQueue color="primary" />;
      case 'link':
        return <Link color="primary" />;
      default:
        return <Description color="action" />;
    }
  };

  const filteredAndSortedItems = items
    .filter(item => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!item.title.toLowerCase().includes(searchLower) && 
            !item.content.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Type filter
      if (filterType !== 'all') {
        if (filterType === 'folders' && !item.isFolder) return false;
        if (filterType === 'documents' && item.isFolder) return false;
        if (filterType !== 'folders' && filterType !== 'documents' && item.documentType !== filterType) return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Folders first
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;

      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case 'documentType':
          aValue = a.documentType.toLowerCase();
          bValue = b.documentType.toLowerCase();
          break;
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleAnalyzeDocument = async (document: IDocument) => {
    try {
      console.log(`🔍 Analyzing document: ${document.title}`);
      toast.info('Starting document analysis...', { autoHideDuration: 3000 });
      
      const result = await documentsService.analyzeDocument(document._id);
      
      console.log('Analysis result:', result);
      toast.success(result.message || 'Document analysis completed successfully!', {
        autoHideDuration: 5000,
        persist: false,
      });
      
      // Refresh the document list to show updated analysis data
      window.location.reload();
      
    } catch (error: any) {
      console.error('Error analyzing document:', error);
      toast.error(error.response?.data?.error || 'Failed to analyze document. Please try again.', {
        autoHideDuration: 5000,
        persist: false,
      });
    }
  };

  const handleContextMenu = (event: React.MouseEvent, item: IDocument) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
      item,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleContextMenuAction = (action: string, item: IDocument) => {
    handleCloseContextMenu();
    
    switch (action) {
      case 'view':
        if (!item.isFolder) onDocumentView(item);
        break;
      case 'edit':
        if (item.isFolder) onFolderEdit(item);
        else onDocumentEdit(item);
        break;
      case 'rename':
        if (item.isFolder) onFolderRename(item);
        else onDocumentRename(item);
        break;
      case 'move':
        if (item.isFolder) onFolderMove(item);
        else onDocumentMove(item);
        break;
      case 'analyze':
        if (!item.isFolder) handleAnalyzeDocument(item);
        break;
      case 'delete':
        if (item.isFolder) {
          onFolderDelete(item);
        } else {
          onDocumentDelete(item);
        }
        break;
    }
  };

  const renderGridView = () => (
    <Grid container spacing={2}>
      {filteredAndSortedItems.map((item) => (
        // @ts-ignore
        <Grid item key={item._id} xs={12} sm={6} md={4} lg={3}>
          <Tooltip 
            title={
              item.isFolder 
                ? `Open folder: ${item.title}`
                : item.documentType === 'google_doc' 
                  ? `Open in Google Docs: ${item.title}`
                  : item.documentType === 'link'
                    ? `Open link: ${item.title}`
                    : `View document: ${item.title}`
            }
            placement="top"
          >
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                  borderColor: 'primary.main',
                },
              }}
              onContextMenu={(e) => handleContextMenu(e, item)}
              onClick={() => {
                if (item.isFolder) {
                  onFolderNavigate(item);
                } else {
                  onDocumentView(item);
                }
              }}
            >
            <CardContent sx={{ flexGrow: 1, pb: 2, px: 2 }}>
              <Box display="flex" alignItems="flex-start" mb={1.5}>
                <Box sx={{ mr: 1.5, mt: 0.5 }}>
                  {getDocumentIcon(item)}
                </Box>
                <Box flexGrow={1} minWidth={0}>
                  <Typography
                    variant="subtitle1"
                    noWrap
                    title={item.title}
                    sx={{ 
                      fontWeight: 600, 
                      mb: 1,
                      fontSize: '1rem',
                      lineHeight: 1.3
                    }}
                  >
                    {item.title}
                  </Typography>
                  {!item.isFolder && (
                    <Chip
                      label={item.documentType.replace('_', ' ')}
                      size="small"
                      color={getDocumentTypeColor(item.documentType)}
                      sx={{ mb: 1.5 }}
                    />
                  )}
                  
                  {/* Customer badge - only show if customer exists and is valid */}
                  {item.customerId && getCustomerName(item.customerId) !== 'Unknown Customer' && (
                    <Chip
                      label={getCustomerName(item.customerId)}
                      size="small"
                      variant="outlined"
                      color="primary"
                      sx={{ mb: 1.5, mr: 1 }}
                    />
                  )}
                  
                  {/* Date - smaller font */}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ 
                      fontSize: '0.75rem',
                      display: 'block'
                    }}
                  >
                    Created: {formatDate(item.createdAt)}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContextMenu(e, item);
                  }}
                >
                  <MoreVert fontSize="small" />
                </IconButton>
              </Box>

              {item.isFolder && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {item.childrenCount || 0} item{(item.childrenCount || 0) !== 1 ? 's' : ''}
                  </Typography>
                </Box>
              )}
            </CardContent>
            </Card>
          </Tooltip>
        </Grid>
      ))}
    </Grid>
  );

  const renderListView = () => (
    <List>
      {filteredAndSortedItems.map((item) => (
        <ListItem
          key={item._id}
          disablePadding
          onContextMenu={(e) => handleContextMenu(e, item)}
        >
          <ListItemButton
            onClick={() => {
              if (item.isFolder) {
                onFolderNavigate(item);
              } else {
                onDocumentView(item);
              }
            }}
            sx={{
              borderRadius: 1,
              mb: 0.25,
              alignItems: 'center',
              py: 0.75,
              minHeight: 48,
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              {getDocumentIcon(item)}
            </ListItemIcon>
            
            <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 500, 
                    fontSize: '0.875rem',
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {item.title}
                </Typography>
                
                {/* Document type and customer chips - inline */}
                {!item.isFolder && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                    <Chip
                      label={item.documentType.replace('_', ' ')}
                      size="small"
                      color={getDocumentTypeColor(item.documentType)}
                      sx={{ height: 20, fontSize: '0.6875rem' }}
                    />
                    {item.customerId && getCustomerName(item.customerId) !== 'Unknown Customer' && (
                      <Chip
                        label={getCustomerName(item.customerId)}
                        size="small"
                        variant="outlined"
                        color="primary"
                        sx={{ height: 20, fontSize: '0.6875rem' }}
                      />
                    )}
                  </Box>
                )}
              </Box>
              
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ fontSize: '0.6875rem' }}
              >
                Created: {formatDate(item.createdAt)}
                {item.isFolder && ` • ${item.childrenCount || 0} items`}
              </Typography>
            </Box>
          </ListItemButton>
          
          <ListItemSecondaryAction>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleContextMenu(e, item);
              }}
            >
              <MoreVert fontSize="small" />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={loadFolderContents}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Toolbar */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
          {/* Search */}
          <TextField
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200 }}
          />

          {/* Filter */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Filter</InputLabel>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              label="Filter"
            >
              <MenuItem value="all">All Items</MenuItem>
              <MenuItem value="folders">Folders</MenuItem>
              <MenuItem value="documents">Documents</MenuItem>
              <MenuItem value="meeting_summary">Meeting Summary</MenuItem>
              <MenuItem value="note">Note</MenuItem>
              <MenuItem value="report">Report</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>

          {/* Sort */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              label="Sort By"
            >
              <MenuItem value="title">Title</MenuItem>
              <MenuItem value="createdAt">Created Date</MenuItem>
              <MenuItem value="updatedAt">Updated Date</MenuItem>
              <MenuItem value="documentType">Type</MenuItem>
            </Select>
          </FormControl>

          {/* Sort Order */}
          <IconButton
            size="small"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            <SortByAlpha fontSize="small" />
          </IconButton>
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          {/* View Mode Toggle */}
          <IconButton
            size="small"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            title={`Switch to ${viewMode === 'grid' ? 'List' : 'Grid'} View`}
          >
            {viewMode === 'grid' ? <ViewList fontSize="small" /> : <GridView fontSize="small" />}
          </IconButton>

        </Box>
      </Box>

      {/* Content */}
      {filteredAndSortedItems.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Folder sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchTerm || filterType !== 'all' ? 'No items match your filters' : 'This folder is empty'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchTerm || filterType !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Create a new folder or add documents to get started'
            }
          </Typography>
        </Box>
      ) : (
        viewMode === 'grid' ? renderGridView() : renderListView()
      )}

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        {contextMenu?.item && !contextMenu.item.isFolder && (
          <MenuItem onClick={() => handleContextMenuAction('view', contextMenu.item!)}>
            <Visibility fontSize="small" sx={{ mr: 1 }} />
            View
          </MenuItem>
        )}
        <MenuItem onClick={() => handleContextMenuAction('edit', contextMenu?.item!)}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => handleContextMenuAction('rename', contextMenu?.item!)}>
          <DriveFileRenameOutline fontSize="small" sx={{ mr: 1 }} />
          Rename
        </MenuItem>
        <MenuItem onClick={() => handleContextMenuAction('move', contextMenu?.item!)}>
          <DriveFileMove fontSize="small" sx={{ mr: 1 }} />
          Move
        </MenuItem>
        {contextMenu?.item && !contextMenu.item.isFolder && (
          <Tooltip title="Analyze document content using AI to extract topics, sentiment, and business insights for better customer understanding" placement="left">
            <MenuItem onClick={() => handleContextMenuAction('analyze', contextMenu.item!)}>
              <Psychology fontSize="small" sx={{ mr: 1 }} />
              Analyze
              <Info fontSize="small" sx={{ ml: 1, opacity: 0.6 }} />
            </MenuItem>
          </Tooltip>
        )}
        <MenuItem onClick={() => handleContextMenuAction('delete', contextMenu?.item!)}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default FolderView;
