import { useMemo, useState } from "react";
import { observer } from 'mobx-react';
import { IInvoice, IInvoiceItem, IField } from "@common/types";
import { eInvoiceCategory, eInvoiceStatus } from "@common/types/invoice";
import { ePaymentTerms } from "@common/types/paymentTerms";
import { eRegion } from "@common/types/region";
import configStore from '@/stores/config.store';
import { Box, Checkbox, FormControl, FormControlLabel, InputAdornment, SelectChangeEvent, Tab, Tabs, TextField } from "@mui/material";
import useTags from "./useTags";
import { TagsInput, CurrencyPicker, SelectField } from "@/components";
import { paymentTermToLabel, regionToLabel, categoryToLabel, statusToLabel } from "./utils";
import customerStore from "@/stores/customer.store";
interface InvoiceFormFieldsProps {
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | SelectChangeEvent>, index?: number) => void;
    addNewCustomer: () => void;
    state: IInvoice;
}
const InvoiceFormFields = observer(({ handleChange, state, addNewCustomer }: InvoiceFormFieldsProps) => {
  const invoiceConfig = configStore.getConfig()?.invoice;
  const customers = customerStore.customers;

  const {
    tags,
    handleTagsChange,
    tagSuggestions,
  } = useTags();

  const [selectedTab, setSelectedTab] = useState(0);

  const sortedFields: IField[] = useMemo(() => {
    if (!invoiceConfig) return [];
    return [...invoiceConfig].sort((a, b) => a.order - b.order);
  }, [invoiceConfig]);

  const groupedFields = useMemo(() => {
    const groups: Record<string, IField[]> = {};
    for (const field of sortedFields) {
      const tab = field.tab || 'main';
      if (!groups[tab]) groups[tab] = [];
      groups[tab].push(field);
    }
    return groups;
  }, [sortedFields]);

  const tabLabels = Object.keys(groupedFields);

  const renderDateField = (name: string, label: string) => (
    <Box flex="1 1 48%">
      <TextField
        size='small'
        label={label}
        variant="outlined"
        fullWidth
        margin="normal"
        type="date"
        name={name}
        value={state[name]}
        onChange={handleChange}
        InputLabelProps={{ shrink: true }}
      />
    </Box>
  );

  const renderTextField = (name: string, label: string, index?: number, overrideValue?: string) => (
    <Box flex="1 1 48%">
      <TextField
        size='small'
        label={label}
        variant="outlined"
        fullWidth
        margin="normal"
        name={name}
        value={overrideValue || state[name]}
        onChange={e => handleChange(e, index)}
      />
    </Box>
  );

  const renderNumericField = (name: string, label: string, showCurrency = true, index?: number, overrideValue?: number) => (
    <Box flex="1 1 48%">
      <TextField
        size='small'
        label={label}
        variant="outlined"
        fullWidth
        margin="normal"
        type="number"
        name={name}
        value={overrideValue || state[name]}
        onChange={e => handleChange(e, index)}
        InputProps={{
          startAdornment: showCurrency ? <InputAdornment position="start">{state.currency}</InputAdornment> : undefined,
        }}
      />
    </Box>
  );

  const renderEmailField = (name: string, label: string) => (
    <Box flex="1 1 48%">
      <TextField
        size='small'
        label={label}
        variant="outlined"
        fullWidth
        margin="normal"
        type="email"
        name={name}
        value={state[name]}
        onChange={handleChange}
      />
    </Box>
  );

  const renderMultiLineTextField = (name: string, label: string) => (
    <Box flex="100%">
      <TextField
        size='small'
        label={label}
        variant="outlined"
        fullWidth
        margin="normal"
        multiline
        rows={4}
        name={name}
        value={state[name]}
        onChange={handleChange}
      />
    </Box>
  );

  const renderTagsField = (name: string, label: string) => (
    <Box flex="100%">
      {/* <Typography variant="body2">{label}</Typography> */}
      <TagsInput
        tags={tags}
        onChange={handleTagsChange}
        possibleSuggestions={tagSuggestions}
        label={label}
        disabled={state.status !== eInvoiceStatus.DRAFT}
        required={state.status !== eInvoiceStatus.DRAFT}
      />
    </Box>
  );


  const renderBooleanField = (name: string, label: string) => (
    <Box flex="1 1 48%">
      <FormControl fullWidth margin="normal">
        <FormControlLabel
          control={
            <Checkbox
              // checked={state[name]}
              onChange={(e) => handleChange(e)}
            />
          }
          label={label}
        />
      </FormControl>
    </Box>
  );
  

  const renderSelectField = (
    name: string,
    label: string,
    options: string[],
    showAddBtn?: boolean,
    addLabel?: string,
    onAddClick?: () => void
  ) => {
    return <SelectField searchable={true} name={name} label={label} options={options} value={state[name]} onChange={handleChange as any} showAddBtn={showAddBtn} addLabel={addLabel} onAddClick={onAddClick} />
  };
  
  

  const renderCurrencyField = (name: string, label: string) => (
    <Box flex="1 1 48%" sx={{ mt: 2, mb: 1 }}>
      <CurrencyPicker label={label} name={name} onChange={e => handleChange(e as any)} />
    </Box>
  );


  const renderItemsField = (items: IInvoiceItem[]) => (
    <>
      {items.map((item, index) => (
        <Box key={index} display="flex" flexWrap="wrap" gap={2}>
          {renderNumericField(undefined, 'Price', true, index, item.price)}
          {renderTextField('itemName', 'Name', index, item.name)}
          {renderTextField('itemDescription', 'Description', index, item.description)}
          {renderNumericField('itemQuantity', 'Quantity', false, index, item.quantity)}
        </Box>
      ))}
    </>
  );

  const renderOneItem = (item: IField) => {
    switch(item?.type) {
      case 'string': return renderTextField(item.name, item.label);
      case 'currency': return renderCurrencyField(item.name, item.label);
      case 'email': return renderEmailField(item.name, item.label);
      case 'textbox': return renderMultiLineTextField(item.name, item.label);
      case 'tags': return renderTagsField(item.name, item.label);
      case 'date': return renderDateField(item.name, item.label);
      case 'number': return renderNumericField(item.name, item.label);
      case 'boolean': return renderBooleanField(item.name, item.label);
      case 'custom': return renderTextField(item.name, item.label);
      case 'items': return renderItemsField(state.items);
      case 'paymentTerms': return renderSelectField(item.name, item.label, Object.values(ePaymentTerms).map(paymentTermToLabel));
      case 'region': return renderSelectField(item.name, item.label, Object.values(eRegion).map(regionToLabel));
      case 'invoiceCategory': return renderSelectField(item.name, item.label, Object.values(eInvoiceCategory).map(categoryToLabel));
      case 'invoiceStatus': return renderSelectField(item.name, item.label, Object.values(eInvoiceStatus).map(statusToLabel));
      case 'customerId': return renderSelectField(item.name, item.label, customers.map(customer => customer.displayName), true, 'Add Customer', addNewCustomer);
      default: return null;
    }
  }

  const renderTabContent = (tabName: string) => {
    const fields = groupedFields[tabName] || [];
    const res: React.ReactNode[] = [];
    for(let i = 0; i < fields.length; i += 2) {
      const item1 = fields[i];
      const item2 = fields[i + 1];
      res.push(
        <Box key={item1._id} display="flex" flexWrap="wrap" gap={2}>
          {renderOneItem(item1)}
          {item2 && renderOneItem(item2)}
        </Box>
      );
    }
    return res;
  };

  return (
    <Box>
      <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)} sx={{ mb: 2 }}>
        {tabLabels.map((label, idx) => (
          <Tab key={label} label={label} />
        ))}
      </Tabs>
      {renderTabContent(tabLabels[selectedTab])}
    </Box>
  );
});

export default InvoiceFormFields;
