import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Button,
  IconButton,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  FilterList,
  Refresh,
  TrendingUp,
  Business,
  People,
  Assessment,
  ClearAll
} from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import { ICustomer, CustomerFilters, CustomerStats } from '@/types';
import customersStore from '@/stores/customers.store';
import SelectBase from '@/components/base/Select';
import industriesStore from '@/stores/industries.store';

const companySizeOptions = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '500+', label: '500+ employees' },
];

const sortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'healthScore', label: 'Health Score' },
  { value: 'contractValue', label: 'Contract Value' },
  { value: 'startDate', label: 'Start Date' },
  { value: 'createdAt', label: 'Created Date' },
  { value: 'updatedAt', label: 'Updated Date' },
];

const getHealthScoreColor = (score: number) => {
  if (score >= 8) return 'success';
  if (score >= 6) return 'warning';
  if (score >= 4) return 'info';
  return 'error';
};

const getHealthScoreLabel = (score: number) => {
  if (score >= 8) return 'Excellent';
  if (score >= 6) return 'Good';
  if (score >= 4) return 'Fair';
  return 'Poor';
};

const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [companySizeFilter, setCompanySizeFilter] = useState('');
  const [healthScoreMinFilter, setHealthScoreMinFilter] = useState<number | ''>('');
  const [healthScoreMaxFilter, setHealthScoreMaxFilter] = useState<number | ''>('');

  const healthScoreOptions = [
    { value: 1, label: '1 - Critical' },
    { value: 2, label: '2 - Poor' },
    { value: 3, label: '3 - Fair' },
    { value: 4, label: '4 - Below Average' },
    { value: 5, label: '5 - Average' },
    { value: 6, label: '6 - Above Average' },
    { value: 7, label: '7 - Good' },
    { value: 8, label: '8 - Very Good' },
    { value: 9, label: '9 - Excellent' },
    { value: 10, label: '10 - Outstanding' },
  ];
  
  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<ICustomer | null>(null);

  useEffect(() => {
    customersStore.fetchCustomers();
    customersStore.fetchStats();
    industriesStore.ensureLoaded();
  }, []);

  const handlePageChange = (event: unknown, newPage: number) => {
    customersStore.setPage(newPage + 1);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    customersStore.setRowsPerPage(newRowsPerPage);
    customersStore.setPage(1);
  };

  const handleSort = (field: string) => {
    const newSortOrder = customersStore.filters.sortBy === field && customersStore.filters.sortOrder === 'asc' ? 'desc' : 'asc';
    customersStore.setSort(field, newSortOrder);
  };

  const applyFilters = () => {
    const newFilters: Partial<CustomerFilters> = {
      page: 1,
      industry: industryFilter || undefined,
      companySize: companySizeFilter || undefined,
      healthScoreMin: healthScoreMinFilter !== '' ? healthScoreMinFilter : undefined,
      healthScoreMax: healthScoreMaxFilter !== '' ? healthScoreMaxFilter : undefined,
    };
    customersStore.updateFilters(newFilters);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setIndustryFilter('');
    setCompanySizeFilter('');
    setHealthScoreMinFilter('');
    setHealthScoreMaxFilter('');

    customersStore.updateFilters({
      page: 1,
      industry: undefined,
      companySize: undefined,
      healthScoreMin: undefined,
      healthScoreMax: undefined,
    });
    customersStore.fetchCustomers();
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;
    
    try {
      await customersStore.deleteCustomer(customerToDelete._id);
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    } catch (err: any) {
      // Error is already handled in the store
    }
  };

  const openDeleteDialog = (customer: ICustomer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const filteredCustomers = customersStore.customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.accountManager?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Customer Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/customers/new')}
        >
          Add Customer
        </Button>
      </Box>

      {customersStore.error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {customersStore.error}
        </Alert>
      )}

      {/* Stats Cards */}
      {customersStore.stats && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center',
            height: '120px',
            boxShadow: 1,
            '&:hover': { boxShadow: 3 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <People sx={{ fontSize: 24, color: 'primary.main' }} />
            </Box>
            <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {customersStore.stats.totalCustomers}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
              Total Customers
            </Typography>
          </Paper>
          
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center',
            height: '120px',
            boxShadow: 1,
            '&:hover': { boxShadow: 3 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <Assessment sx={{ fontSize: 24, color: 'success.main' }} />
            </Box>
            <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {customersStore.stats.averageHealthScore.toFixed(1)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
              Avg Health Score
            </Typography>
          </Paper>
          
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center',
            height: '120px',
            boxShadow: 1,
            '&:hover': { boxShadow: 3 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <Business sx={{ fontSize: 24, color: 'info.main' }} />
            </Box>
            <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {customersStore.stats.customersByIndustry.length > 0 ? customersStore.stats.customersByIndustry[0].industry : 'N/A'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
              Top Industry
            </Typography>
          </Paper>
          
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center',
            height: '120px',
            boxShadow: 1,
            '&:hover': { boxShadow: 3 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <TrendingUp sx={{ fontSize: 24, color: 'warning.main' }} />
            </Box>
            <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {customersStore.stats.customersBySize.length > 0 ? customersStore.stats.customersBySize[0].size : 'N/A'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
              Most Common Size
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 2, 
          alignItems: 'center',
          '& > *': { flex: '1 1 200px', minWidth: '200px' }
        }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by name, industry, account manager..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); }}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              endAdornment: searchTerm ? (
                <IconButton size="small" onClick={() => { setSearchTerm(''); }}>
                  <CloseIcon sx={{ fontSize: 18 }} />
                </IconButton>
              ) : undefined,
            }}
            sx={{ height: 40 }}
            onBlur={applyFilters}
            onKeyUp={applyFilters}
          />
          
          <Box sx={{ position: 'relative' }}>
            <SelectBase
              value={industryFilter}
              onChange={(v) => { setIndustryFilter(v as string); applyFilters(); }}
              size="small"
              fullWidth
              label="Industry"
              placeholder="Industry"
              allowOther={false}
              allowClear
              options={industriesStore.industries.length ? industriesStore.industries : []}
            />
          </Box>
          
          <SelectBase
            value={companySizeFilter}
            onChange={(v) => { setCompanySizeFilter(v as string); applyFilters(); }}
            size="small"
            fullWidth
            label="Company Size"
            placeholder="All"
            allowClear
            allowOther={false}
            options={companySizeOptions.map(o => ({ value: o.value, label: o.label }))}
          />
          
          <SelectBase
            value={healthScoreMinFilter === '' ? '' : healthScoreMinFilter}
            onChange={(v) => { setHealthScoreMinFilter(v === '' ? '' : Number(v)); applyFilters(); }}
            size="small"
            fullWidth
            label="Min Health Score"
            placeholder="Any"
            allowClear
            allowOther={false}
            options={healthScoreOptions.map(o => ({ value: o.value, label: o.label }))}
          />
          
          <SelectBase
            value={healthScoreMaxFilter === '' ? '' : healthScoreMaxFilter}
            onChange={(v) => { setHealthScoreMaxFilter(v === '' ? '' : Number(v)); applyFilters(); }}
            size="small"
            fullWidth
            label="Max Health Score"
            placeholder="Any"
            allowClear
            allowOther={false}
            options={healthScoreOptions.map(o => ({ value: o.value, label: o.label }))}
          />
          
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<ClearAll />}
            onClick={handleClearFilters}
            sx={{ height: 40, minWidth: 100 }}
          >
            CLEAR
          </Button>
        </Box>
      </Paper>

      {/* Customers Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Button
                    onClick={() => handleSort('name')}
                    sx={{ fontWeight: 'bold', textTransform: 'none' }}
                  >
                    Customer Name
                    {customersStore.filters.sortBy === 'name' && (
                      <span>{customersStore.filters.sortOrder === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </Button>
                </TableCell>
                <TableCell>Industry</TableCell>
                <TableCell>Company Size</TableCell>
                <TableCell>
                  <Button
                    onClick={() => handleSort('contractValue')}
                    sx={{ fontWeight: 'bold', textTransform: 'none' }}
                  >
                    Contract Value
                    {customersStore.filters.sortBy === 'contractValue' && (
                      <span>{customersStore.filters.sortOrder === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </Button>
                </TableCell>
                <TableCell>Account Manager</TableCell>
                <TableCell>
                  <Button
                    onClick={() => handleSort('healthScore')}
                    sx={{ fontWeight: 'bold', textTransform: 'none' }}
                  >
                    Health Score
                    {customersStore.filters.sortBy === 'healthScore' && (
                      <span>{customersStore.filters.sortOrder === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    onClick={() => handleSort('startDate')}
                    sx={{ fontWeight: 'bold', textTransform: 'none' }}
                  >
                    Start Date
                    {customersStore.filters.sortBy === 'startDate' && (
                      <span>{customersStore.filters.sortOrder === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </Button>
                </TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customersStore.isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : customersStore.customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body1" color="text.secondary">
                      No customers found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                customersStore.customers.map((customer) => (
                  <TableRow key={customer._id} hover>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {customer.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{customer.industry || '-'}</TableCell>
                    <TableCell>{customer.companySize || '-'}</TableCell>
                    <TableCell>
                      {customer.contractValue ? `$${customer.contractValue.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell>{customer.accountManager || '-'}</TableCell>
                    <TableCell>
                      {customer.healthScore ? (
                        <Chip
                          label={`${customer.healthScore} - ${getHealthScoreLabel(customer.healthScore)}`}
                          color={getHealthScoreColor(customer.healthScore) as any}
                          size="small"
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {customer.startDate ? new Date(customer.startDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Edit Customer">
                          <IconButton
                            size="medium"
                            onClick={() => navigate(`/customers/edit/${customer._id}`)}
                          >
                            <Edit sx={{ fontSize: 22 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Customer">
                          <IconButton
                            size="medium"
                            color="error"
                            onClick={() => openDeleteDialog(customer)}
                          >
                            <Delete sx={{ fontSize: 22 }} />
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
          count={customersStore.totalCustomers}
          rowsPerPage={customersStore.rowsPerPage}
          page={customersStore.currentPage - 1}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Customer</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{customerToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default observer(CustomersPage);
