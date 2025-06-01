import React, { JSX, useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import {
  Tabs,
  Tab,
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
  Typography,
} from '@mui/material';
import { SelectField, Page } from '@/components';
import { ICustomer } from '@common/types';
import { ePaymentTerms } from '@common/types/paymentTerms';
import { ePaymentMethod } from '@common/types/paymentMethod';
import { paymentMethodToLabel, paymentTermToLabel } from '@/utils';
import * as S from './styled';
import customerService from '@/services/customer-service';

const CustomerPage: React.FC<{}> = () => {
  const location = useLocation();
  const customer = location.state?.parameters as ICustomer || undefined;
  const [state, setState] = useState<ICustomer | undefined>(customer as ICustomer);
  const [tabIndex, setTabIndex] = useState(0);
  const [addressTabIndex, setAddressTabIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { id: customerId } = useParams();

  const [sameAsBilling, setSameAsBilling] = useState(
    !!state && JSON.stringify(state.billingAddress) === JSON.stringify(state.shippingAddress)
  );
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!state && !!customerId) {
        const customer = await customerService.getCustomerById(customerId);
        setState(customer);
      }
    }
    run();
  }, [customerId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setState((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddressChange = (
    type: 'billingAddress' | 'shippingAddress',
    field: keyof ICustomer['billingAddress'],
    value: string
  ) => {
    setState((prevState) => ({
      ...prevState,
      [type]: {
        ...prevState[type],
        [field]: value,
      },
    }));
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => setTabIndex(newValue);
  const handleAddressTabChange = (_: React.SyntheticEvent, newValue: number) => setAddressTabIndex(newValue);

  const toggleEdit = () => setIsEditing((prev) => !prev);

  const handleSameAsBillingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSameAsBilling(checked);
    if (checked) {
      setState((prev) => ({
        ...prev,
        shippingAddress: { ...prev.billingAddress },
      }));
    }
  };

  const handleSave = () => {
    setIsEditing(false);
  };
  if (!state) {
    return <Page>
      <Typography variant="h4">Customer not found</Typography>
    </Page>
  }
  const renderAddressFields = (type: 'billingAddress' | 'shippingAddress') => (
    <S.Column>
      {['streetAddress1', 'streetAddress2', 'city', 'state', 'zipCode', 'country'].map((field) => (
        <TextField
          key={field}
          size="small"
          fullWidth
          label={field.replace(/([A-Z])/g, ' $1')}
          name={field}
          value={state[type]?.[field as keyof (typeof state)[typeof type]] || ''}
          onChange={(e) => handleAddressChange(type, field as keyof ICustomer['billingAddress'], e.target.value)}
          InputProps={{ readOnly: !isEditing }}
        />
      ))}
    </S.Column>
  );

  return (
    <Page>
      <S.Container>
        <S.Header>
          <Typography variant="h4">Customer Details</Typography>
        <S.ButtonGroup>
          {isEditing && <Button variant="contained" onClick={handleSave}>Save</Button>}
          <Button variant="outlined" onClick={toggleEdit}>{isEditing ? 'Cancel' : 'Edit'}</Button>
        </S.ButtonGroup>
      </S.Header>

      <Tabs value={tabIndex} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Contact" />
        <Tab label="Address" />
        <Tab label="Payment" />
        <Tab label="Notes" />
      </Tabs>

      {tabIndex === 0 && (
        <S.FlexWrap>
          <TextField size="small" fullWidth label="Display Name" name="displayName" value={state.displayName} onChange={handleChange} InputProps={{ readOnly: !isEditing }} />
          <TextField size="small" fullWidth label="Company Name" name="companyName" value={state.companyName} onChange={handleChange} InputProps={{ readOnly: !isEditing }} />
          <TextField size="small" fullWidth label="First Name" name="givenName" value={state.givenName} onChange={handleChange} InputProps={{ readOnly: !isEditing }} />
          <TextField size="small" fullWidth label="Last Name" name="familyName" value={state.familyName} onChange={handleChange} InputProps={{ readOnly: !isEditing }} />
          <TextField size="small" fullWidth label="Email" name="primaryEmailAddr" value={state.primaryEmailAddr} onChange={handleChange} InputProps={{ readOnly: !isEditing }} />
          <TextField size="small" fullWidth label="Phone" name="primaryPhone" value={state.primaryPhone} onChange={handleChange} InputProps={{ readOnly: !isEditing }} />
          <FormControlLabel control={<Checkbox size="small" name="active" checked={state.active} onChange={handleChange} disabled={!isEditing} />} label="Active" />
        </S.FlexWrap>
      )}

      {tabIndex === 1 && (
        <>
          <Tabs value={addressTabIndex} onChange={handleAddressTabChange} sx={{ mb: 2 }}>
            <Tab label="Billing Address" />
            <Tab label="Shipping Address" disabled={sameAsBilling} />
          </Tabs>

          {addressTabIndex === 0 && (
            <>
              {renderAddressFields('billingAddress')}
              {isEditing && (
                <FormControlLabel
                  control={<Checkbox checked={sameAsBilling} onChange={handleSameAsBillingChange} />}
                  label="Shipping address is same as billing address"
                />
              )}
            </>
          )}

          {addressTabIndex === 1 && !sameAsBilling && renderAddressFields('shippingAddress')}
        </>
      )}

      {tabIndex === 2 && (
        <S.Column>
          <SelectField
            name="paymentTerms"
            label="Payment Terms"
            options={Object.values(ePaymentTerms).map((term) => (paymentTermToLabel(term)))}
            value={state.paymentTerms}
            onChange={(e) => setState((prev) => ({ ...prev, paymentTerms: e.target.value as ePaymentTerms }))}
            disabled={!isEditing}
          />
          <SelectField
            name="paymentMethod"
            label="Payment Method"
            options={Object.values(ePaymentMethod).map((method) => (paymentMethodToLabel(method)))}
            value={state.paymentMethod}
            onChange={(e) => setState((prev) => ({ ...prev, paymentMethod: e.target.value as ePaymentMethod }))}
            disabled={!isEditing}
          />
        </S.Column>
      )}

      {tabIndex === 3 && (
        <TextField
          multiline
          rows={6}
          fullWidth
          label="Notes"
          name="notes"
          value={state.notes || ''}
          onChange={handleChange}
          InputProps={{ readOnly: !isEditing }}
        />
      )}
    </S.Container>
    </Page>
  );
};

export default CustomerPage;