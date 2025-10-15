import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  CircularProgress,
  InputAdornment,
  Button,
} from '@mui/material';
import {
  Search,
  Description,
  Visibility,
  Edit,
  Delete,
} from '@mui/icons-material';
import documentsStore from '@/stores/documents.store';
import customersStore from '@/stores/customers.store';
import { IDocument } from '@/services/documents-service';
import { ICustomer } from '@/types';
import toast from '@/utils/toast';
import DocumentViewModal from '@/components/DocumentViewModal';
import DocumentEditModal from '@/components/DocumentEditModal';

const DocsPage: React.FC = () => {
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'title'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Filtered and sorted documents
  const [filteredDocuments, setFilteredDocuments] = useState<IDocument[]>([]);
  
  // View modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<IDocument | null>(null);
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState<IDocument | null>(null);

  // Load documents on component mount
  useEffect(() => {
    loadDocuments();
    loadCustomers();
  }, []);

  // Load customers for filter dropdown
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      await documentsStore.loadDocuments();
    } catch (err) {
      setError('Failed to load documents');
      console.error('Error loading documents:', err);
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

  // Filter and sort documents
  useEffect(() => {
    let filtered = [...documentsStore.documents];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply customer filter
    if (customerFilter) {
      filtered = filtered.filter(doc => doc.customerId === customerFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
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

    setFilteredDocuments(filtered);
  }, [documentsStore.documents, searchTerm, customerFilter, sortBy, sortOrder]);

  // Pagination handlers
  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Sort handlers
  const handleSort = (field: 'createdAt' | 'updatedAt' | 'title') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Get customer name by ID
  const getCustomerName = (customerId?: string): string => {
    if (!customerId) return 'No Customer';
    const customer = customersStore.customers.find(c => c._id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };

  // Handle view document
  const handleViewDocument = (document: IDocument) => {
    setSelectedDocument(document);
    setViewModalOpen(true);
  };

  // Handle close view modal
  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedDocument(null);
  };

  // Handle edit document
  const handleEditDocument = (document: IDocument) => {
    setDocumentToEdit(document);
    setEditModalOpen(true);
  };

  // Handle close edit modal
  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setDocumentToEdit(null);
  };

  // Handle document saved
  const handleDocumentSaved = async () => {
    await loadDocuments();
  };

  // Format date
  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get document type color
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

  // Paginated documents
  const paginatedDocuments = filteredDocuments.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading && documentsStore.documents.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        <Description sx={{ mr: 2, verticalAlign: 'middle' }} />
        Documents
      </Typography>

      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
          {/* Search */}
          <TextField
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />

          {/* Customer Filter */}
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Customer</InputLabel>
            <Select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              label="Customer"
            >
              <MenuItem value="">
                <em>All Customers</em>
              </MenuItem>
              {customersStore.customers.map((customer) => (
                <MenuItem key={customer._id} value={customer._id}>
                  {customer.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Sort By */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'createdAt' | 'updatedAt' | 'title')}
              label="Sort By"
            >
              <MenuItem value="createdAt">Created Date</MenuItem>
              <MenuItem value="updatedAt">Updated Date</MenuItem>
              <MenuItem value="title">Title</MenuItem>
            </Select>
          </FormControl>

          {/* Sort Order */}
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <InputLabel>Order</InputLabel>
            <Select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              label="Order"
            >
              <MenuItem value="desc">Newest First</MenuItem>
              <MenuItem value="asc">Oldest First</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Documents Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f0f8ff', height: 'auto' }}>
                <TableCell sx={{ backgroundColor: '#f0f8ff', py: 0.25, px: 2 }}>
                  <Button
                    onClick={() => handleSort('title')}
                    sx={{ fontWeight: 'bold', textTransform: 'none', py: 0 }}
                  >
                    Title
                    {sortBy === 'title' && (
                      <span>{sortOrder === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </Button>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#f0f8ff', py: 0.25, px: 2 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#f0f8ff', py: 0.25, px: 2 }}>Customer</TableCell>
                <TableCell sx={{ backgroundColor: '#f0f8ff', py: 0.25, px: 2 }}>
                  <Button
                    onClick={() => handleSort('createdAt')}
                    sx={{ fontWeight: 'bold', textTransform: 'none', py: 0 }}
                  >
                    Created Date
                    {sortBy === 'createdAt' && (
                      <span>{sortOrder === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </Button>
                </TableCell>
                <TableCell sx={{ backgroundColor: '#f0f8ff', py: 0.25, px: 2 }}>
                  <Button
                    onClick={() => handleSort('updatedAt')}
                    sx={{ fontWeight: 'bold', textTransform: 'none', py: 0 }}
                  >
                    Updated Date
                    {sortBy === 'updatedAt' && (
                      <span>{sortOrder === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </Button>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#f0f8ff', py: 0.25, px: 2 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No documents found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedDocuments.map((document) => (
                  <TableRow key={document._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {document.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={document.documentType.replace('_', ' ')}
                        color={getDocumentTypeColor(document.documentType)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getCustomerName(document.customerId)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(document.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(document.updatedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Document">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleViewDocument(document)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Document">
                          <IconButton 
                            size="small" 
                            color="secondary"
                            onClick={() => handleEditDocument(document)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Document">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => {
                              // TODO: Implement delete functionality
                              toast.warning('Delete functionality not yet implemented');
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredDocuments.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Paper>

      {/* Loading overlay */}
      {loading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {/* Document View Modal */}
      <DocumentViewModal
        open={viewModalOpen}
        onClose={handleCloseViewModal}
        document={selectedDocument}
      />

      {/* Document Edit Modal */}
      <DocumentEditModal
        open={editModalOpen}
        onClose={handleCloseEditModal}
        document={documentToEdit}
        onSaved={handleDocumentSaved}
      />
    </Box>
  );
};

export default observer(DocsPage);
