import React, { useState } from 'react';
import { Button, Box, Typography, CircularProgress } from '@mui/material';
import { Description } from '@mui/icons-material';
import Modal from '@/components/Modal';
import Select from '@/components/base/Select';

interface Customer {
  _id: string;
  name: string;
}

interface CustomerMeetingPrepModalProps {
  open: boolean;
  onClose: () => void;
  customers: Customer[];
  onGenerate: (customerId: string) => Promise<void>;
}

const CustomerMeetingPrepModal: React.FC<CustomerMeetingPrepModalProps> = ({
  open,
  onClose,
  customers,
  onGenerate
}) => {
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }

    try {
      setLoading(true);
      await onGenerate(selectedCustomer);
      // Reset and close modal
      setSelectedCustomer('');
      onClose();
    } catch (error) {
      console.error('Error generating meeting prep:', error);
      alert('Failed to generate meeting prep document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedCustomer('');
      onClose();
    }
  };

  // Convert customers to options for Select component
  const customerOptions = customers.map(customer => ({
    value: customer._id,
    label: customer.name
  }));

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={loading ? "Generating Document..." : "Generate Meeting Prep Document"}
      maxWidth="sm"
      actions={
        <>
          <Button
            onClick={handleClose}
            disabled={loading}
            sx={{ mr: 1 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Description />}
            onClick={handleGenerate}
            disabled={!selectedCustomer || loading}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              },
              '&:disabled': {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                opacity: 0.5
              }
            }}
          >
            {loading ? 'Generating...' : 'Generate Doc'}
          </Button>
        </>
      }
    >
      <Box sx={{ minHeight: 120, py: 2 }}>
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
              Generating Meeting Prep Document
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Analyzing customer data, health scores, and recent news. Please wait...
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select a customer to generate a comprehensive meeting preparation document.
            </Typography>
            
            <Select
              value={selectedCustomer}
              onChange={(val) => setSelectedCustomer(String(val))}
              label="Select Customer"
              options={customerOptions}
              searchable={true}
              placeholder="Choose a customer..."
              fullWidth={true}
              size="medium"
            />
          </>
        )}
      </Box>
    </Modal>
  );
};

export default CustomerMeetingPrepModal;

