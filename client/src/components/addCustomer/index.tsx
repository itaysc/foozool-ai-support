import React, { useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Tabs,
  Tab,
} from '@mui/material';
import { SelectField } from '@/components';
import { ICustomer } from '@common/types';
import customerService from '@/services/customer-service';
import authStore from '@/stores/auth.store';
import { ePaymentTerms } from '@common/types/paymentTerms';
import { ePaymentMethod } from '@common/types/paymentMethod';
import { paymentMethodToLabel, paymentTermToLabel } from '@/utils';

interface AddCustomerModalProps {
  open: boolean;
  onClose: () => void;
  onSaveCallback?: (customer: ICustomer) => void;
}

const modalStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  bgcolor: 'background.paper',
  boxShadow: 24,
  borderRadius: 2,
  p: 4,
};

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ open, onClose, onSaveCallback }) => {
  const [state, setState] = useState<ICustomer>({
    displayName: '',
    organization: authStore.user?.organization._id as string,
    companyName: '',
    givenName: '',
    familyName: '',
    primaryEmailAddr: '',
    primaryPhone: '',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    billingAddress: {},
    shippingAddress: {},
    paymentMethod: ePaymentMethod.CREDIT_CARD,
    paymentTerms: ePaymentTerms.IMMEDIATE,
    notes: '',
  });

  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [addressTabIndex, setAddressTabIndex] = useState(0);

  const onSave = async () => {
    const customer = await customerService.addCustomer(state);
    onSaveCallback?.(customer);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setState((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddressChange = (type: 'billingAddress' | 'shippingAddress', field: keyof ICustomer['billingAddress'], value: string) => {
    setState((prevState) => ({
      ...prevState,
      [type]: {
        ...prevState[type],
        [field]: value,
      },
    }));
  };

  const handleSameAsBillingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSameAsBilling(checked);
    if (checked) {
      setState((prevState) => ({
        ...prevState,
        shippingAddress: { ...prevState.billingAddress },
      }));
      if (addressTabIndex === 1) {
        setAddressTabIndex(0);
      }
    } else {
      setState((prevState) => ({
        ...prevState,
        shippingAddress: {},
      }));
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const handleAddressTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setAddressTabIndex(newValue);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <Typography variant="h3" mb={2}>
          Add Customer
        </Typography>
        <Tabs value={tabIndex} style={{ marginBottom: 20 }} onChange={handleTabChange} indicatorColor="primary" textColor="primary" aria-label="Customer Tabs">
          <Tab label="Contact" />
          <Tab label="Address" />
          <Tab label="Payment" />
          <Tab label="Notes" />
        </Tabs>

        {tabIndex === 0 && (
          <Box display="flex" flexWrap="wrap" gap={2}>
            <TextField size="small" fullWidth label="Display Name" name="displayName" value={state.displayName} onChange={onChange} />
            <TextField size="small" fullWidth label="Company Name" name="companyName" value={state.companyName} onChange={onChange} />
            <TextField size="small" fullWidth label="First Name" name="givenName" value={state.givenName} onChange={onChange} />
            <TextField size="small" fullWidth label="Last Name" name="familyName" value={state.familyName} onChange={onChange} />
            <TextField size="small" fullWidth label="Email" name="primaryEmailAddr" value={state.primaryEmailAddr} onChange={onChange} />
            <TextField size="small" fullWidth label="Phone" name="primaryPhone" value={state.primaryPhone} onChange={onChange} />
            <FormControlLabel control={<Checkbox size="small" name="active" checked={state.active} onChange={onChange} />} label="Active" />
          </Box>
        )}

        {tabIndex === 1 && (
          <Box>
            <Tabs value={addressTabIndex} onChange={handleAddressTabChange} indicatorColor="primary" textColor="primary" aria-label="Address Tabs" sx={{ marginBottom: 2 }}>
              <Tab label="Billing Address" />
              <Tab label="Shipping Address" disabled={sameAsBilling} />
            </Tabs>

            {addressTabIndex === 0 && (
              <Box display="flex" flexDirection="column" gap={2}>
                <TextField size="small" fullWidth label="Street Address 1" name="streetAddress1" value={state.billingAddress?.streetAddress1 || ''} onChange={(e) => handleAddressChange('billingAddress', 'streetAddress1', e.target.value)} />
                <TextField size="small" fullWidth label="Street Address 2" name="streetAddress2" value={state.billingAddress?.streetAddress2 || ''} onChange={(e) => handleAddressChange('billingAddress', 'streetAddress2', e.target.value)} />
                <TextField size="small" fullWidth label="City" name="city" value={state.billingAddress?.city || ''} onChange={(e) => handleAddressChange('billingAddress', 'city', e.target.value)} />
                <TextField size="small" fullWidth label="State" name="state" value={state.billingAddress?.state || ''} onChange={(e) => handleAddressChange('billingAddress', 'state', e.target.value)} />
                <TextField size="small" fullWidth label="Zip Code" name="zipCode" value={state.billingAddress?.zipCode || ''} onChange={(e) => handleAddressChange('billingAddress', 'zipCode', e.target.value)} />
                <TextField size="small" fullWidth label="Country" name="country" value={state.billingAddress?.country || ''} onChange={(e) => handleAddressChange('billingAddress', 'country', e.target.value)} />
                <FormControlLabel control={<Checkbox checked={sameAsBilling} onChange={handleSameAsBillingChange} />} label="Shipping address is same as billing address" />
              </Box>
            )}

            {addressTabIndex === 1 && !sameAsBilling && (
              <Box display="flex" flexDirection="column" gap={2}>
                <TextField size="small" fullWidth label="Street Address 1" name="streetAddress1" value={state.shippingAddress?.streetAddress1 || ''} onChange={(e) => handleAddressChange('shippingAddress', 'streetAddress1', e.target.value)} />
                <TextField size="small" fullWidth label="Street Address 2" name="streetAddress2" value={state.shippingAddress?.streetAddress2 || ''} onChange={(e) => handleAddressChange('shippingAddress', 'streetAddress2', e.target.value)} />
                <TextField size="small" fullWidth label="City" name="city" value={state.shippingAddress?.city || ''} onChange={(e) => handleAddressChange('shippingAddress', 'city', e.target.value)} />
                <TextField size="small" fullWidth label="State" name="state" value={state.shippingAddress?.state || ''} onChange={(e) => handleAddressChange('shippingAddress', 'state', e.target.value)} />
                <TextField size="small" fullWidth label="Zip Code" name="zipCode" value={state.shippingAddress?.zipCode || ''} onChange={(e) => handleAddressChange('shippingAddress', 'zipCode', e.target.value)} />
                <TextField size="small" fullWidth label="Country" name="country" value={state.shippingAddress?.country || ''} onChange={(e) => handleAddressChange('shippingAddress', 'country', e.target.value)} />
              </Box>
            )}
          </Box>
        )}

        {tabIndex === 2 && (
          <Box display="flex" flexWrap="wrap" gap={2}>
            <SelectField name="paymentMethod" label="Payment Method" options={Object.values(ePaymentMethod).map(paymentMethodToLabel)} value={state.paymentMethod} onChange={onChange} />
            <SelectField name="paymentTerms" label="Payment Terms" options={Object.values(ePaymentTerms).map(paymentTermToLabel)} value={state.paymentTerms} onChange={onChange} />
          </Box>
        )}

        {tabIndex === 3 && (
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField size="small" fullWidth label="Notes" name="notes" value={state.notes} onChange={onChange} multiline rows={4} />
          </Box>
        )}

        <Box mt={3} display="flex" justifyContent="flex-end" gap={1}>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="contained" onClick={onSave}>
            Save
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default AddCustomerModal;
