import React from 'react';
import {
  Box,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Stack
} from '@mui/material';

interface InsightTablePaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  pageSizeOptions?: number[];
}

const InsightTablePagination: React.FC<InsightTablePaginationProps> = ({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [10, 25, 50, 100]
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      p: 2,
      borderTop: '1px solid',
      borderColor: 'divider',
      backgroundColor: 'background.paper'
    }}>
      {/* Items per page selector */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Items per page:
        </Typography>
        <FormControl size="small" sx={{ minWidth: 80 }}>
          <Select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            displayEmpty
            sx={{ fontSize: '0.875rem' }}
          >
            {pageSizeOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Page info and pagination */}
      <Stack direction="row" alignItems="center" spacing={2}>
        <Typography variant="body2" color="text.secondary">
          {totalItems > 0 ? `${startItem}-${endItem} of ${totalItems}` : '0 items'}
        </Typography>
        
        {totalPages > 1 && (
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => onPageChange(page)}
            color="primary"
            size="small"
            showFirstButton
            showLastButton
            siblingCount={1}
            boundaryCount={1}
          />
        )}
      </Stack>
    </Box>
  );
};

export default InsightTablePagination;
