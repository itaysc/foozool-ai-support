import { useState } from 'react';
import { Button, TextField, Box, InputAdornment, IconButton, Typography, Paper } from '@mui/material';
import FileUploadIcon from '@mui/icons-material/UploadFile';
import { useParams } from 'react-router-dom';
import PrintIcon from '@mui/icons-material/Print';
import PostAddIcon from '@mui/icons-material/PostAdd';
import FilePreview from './filePreview';
import { InvoiceContainer, FormContainer, FormTitle, ActionBtnsContainer } from './styled';
import AddInvoiceItemDialog from './addItem';
import invoiceStore from '../../stores/invoice.store'
import { useDisclosure } from '@/hooks/useDicsloser';
import { IInvoice } from '@common/types';
import { useMainLayoutContext } from '@/context/mainLayout.context';
import { YesNoModal, OverlayLoader, AddCustomerModal, FixedFooter, Page } from '@/components';
import getInitialInvoiceData from './initialData';
import useBlockNavigation from '@/hooks/useBlockNavigation';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useTags } from './useTags';
import invoiceService from '@/services/invoice-service';
import { InvoiceDirection } from '@common/types';
import configStore from '@/stores/config.store';
import InvoiceFormFields from './formFields';

const InvoicePage: React.FC = () => {
  const [isDirty, setIsDirty] = useState(false);

  const [invoiceData, setInvoiceData] = useState<IInvoice>(getInitialInvoiceData());
  const [file, setFile] = useState<File | null>(null);
  const { isOpen: isAddCustomerModalOpen, open: openAddCustomerModal, close: closeAddCustomerModal } = useDisclosure();
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const { isOpen: isAddItemDialogOpen, open: openAddItemDialog, close: closeAddItemDialog } = useDisclosure();
  const { isOpen: isYesNoModalOpen, open: doAskToAutofillInvoice, close: closeAskToAutofillInvoice } = useDisclosure();
  const [autofilledInvoice, setAutofilledInvoice] = useState<IInvoice | undefined>(undefined);
  const [showLoader, setShowLoader] = useState(false);
  const { setIsLoading } = useMainLayoutContext();
  const invoiceConfig = configStore.config?.invoice;
  
  useBlockNavigation(isDirty); // show a confirmation modal when
  usePageTitle('Invoice');
  const {
    tags,
  } = useTags();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index?: number) => {
    const { name, value } = e.target;
    setIsDirty(true);
    if (index !== undefined) {
      const updatedItems = [...invoiceData.items];
      updatedItems[index] = { ...updatedItems[index], [name]: value };
      setInvoiceData({ ...invoiceData, items: updatedItems });
    } else {
      setInvoiceData({ ...invoiceData, [name]: value });
    }
  };


  const handlePreviewClick = () => {
    if (filePreview) {
      window.open(filePreview, '_blank', 'noopener,noreferrer');
    }
  };

  // Add a new item to the invoice
  const addItem = () => {
    setInvoiceData({
      ...invoiceData,
      items: [...invoiceData.items, { name: '', quantity: 0, price: 0 }],
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setIsDirty(true);
      setFilePreview(URL.createObjectURL(selectedFile));
      doAskToAutofillInvoice();
    }
  };

  const autofillInvoiceAnswered = async (doAutofill: boolean) => {
    closeAskToAutofillInvoice();
    try {
      if (doAutofill) {
        setShowLoader(true);
        setIsLoading(true);
        const invoice = await invoiceStore.autofillInvoice(file);
        setInvoiceData(invoice);
        setAutofilledInvoice(invoice);
        setIsLoading(false);
        setShowLoader(false);
      }
    } catch (error) {
      setAutofilledInvoice(undefined);
      console.error(error);
      setIsLoading(false);
      setShowLoader(false);
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted'); // Debug log
    setIsLoading(true);
    setShowLoader(true);
    try {
      setIsDirty(false);
      const invoiceToSubmit = {
        ...invoiceData,
        tags,
      }
      await invoiceService.create(invoiceToSubmit);
      console.log('Invoice Data:', invoiceToSubmit);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setShowLoader(false);
    }
  };

  // Print the invoice
  const handlePrint = () => {
    window.print();
  };


  return (
    <Page>
      <InvoiceContainer>
        <AddCustomerModal open={isAddCustomerModalOpen} onClose={closeAddCustomerModal} /> 
      <OverlayLoader loading={showLoader} />
      <YesNoModal open={isYesNoModalOpen} onSubmit={autofillInvoiceAnswered} title="Autofill Invoice" content="Do you want to autofill invoice details?" />
      <FormContainer sx={{ position: 'relative' }} onSubmit={handleSubmit}>
        <FormTitle variant="h4">Invoice Form</FormTitle>
        <FilePreview
          file={file}
          filePreview={filePreview}
          onRemove={() => {
            setFile(null);
            setFilePreview(null);
          }}
          onPreviewClick={handlePreviewClick}
        />
        <ActionBtnsContainer>
          <Box title="Print invoice">
            <IconButton onClick={handlePrint} color="primary">
              <PrintIcon sx={{ fontSize: '1.3rem' }} />
            </IconButton>
          </Box>
          <Box title="Add invoice item">
            <IconButton onClick={openAddItemDialog} color="primary">
              <PostAddIcon sx={{ fontSize: '1.3rem' }} />
            </IconButton>
          </Box>
          <Box title="Upload invoice file">
            <input
              type="file"
              onChange={handleFileChange}
              id="file-upload"
              style={{ display: 'none' }}
              accept=".jpg,.jpeg,.png,.gif,.pdf,.xlsx,.xls,.csv"
            />
            <IconButton onClick={() => document.getElementById('file-upload')?.click()}>
              <FileUploadIcon sx={{ fontSize: '1.3rem' }} color="primary" />
            </IconButton>
          </Box>
        </ActionBtnsContainer>

        <InvoiceFormFields state={invoiceData} handleChange={handleChange} addNewCustomer={openAddCustomerModal} />
        <AddInvoiceItemDialog open={isAddItemDialogOpen} onClose={closeAddItemDialog} onSave={addItem} />
        {/* Submit Button */}
        <Box sx={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
          {/* <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
          >
            Submit Invoice
          </Button> */}
        </Box>
      </FormContainer>
      <FixedFooter actions={[{
        type: 'button',
        label: 'Submit Invoice',
        onClick: (e: React.FormEvent) => handleSubmit(e),
          disabled: false,
        }]} />
      </InvoiceContainer>
    </Page>
  );
};

export default InvoicePage;
