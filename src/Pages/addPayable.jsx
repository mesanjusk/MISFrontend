import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import axios from '../apiClient.js';
import toast, { Toaster } from 'react-hot-toast';
import { extractPhoneNumber, normalizeWhatsAppPhone } from '../utils/whatsapp.js';
import {
  DEFAULT_TEMPLATE_LANGUAGE,
  WHATSAPP_TEMPLATES,
  buildOpeningBalancePayableParameters,
} from '../constants/whatsappTemplates';
import { ActionButtonGroup, FormSection, PageContainer, SectionCard } from '../components/ui';

export default function AddTransaction() {
  const navigate = useNavigate();
  const location = useLocation();

  const [Description, setDescription] = useState('');
  const [Amount, setAmount] = useState('');
  const [Total_Debit, setTotal_Debit] = useState('');
  const [Total_Credit, setTotal_Credit] = useState('');
  const [userGroup, setUserGroup] = useState('');
  const [customers, setCustomers] = useState('');
  const [allCustomerOptions, setAllCustomerOptions] = useState([]);
  const [accountCustomerOptions, setAccountCustomerOptions] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState('');
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [Customer_name, setCustomer_Name] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [mobileToSend, setMobileToSend] = useState('');
  const [sendWhatsAppAfterSave, setSendWhatsAppAfterSave] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [isTransactionSaved, setIsTransactionSaved] = useState(false);

  useEffect(() => {
    const userNameFromState = location.state?.id;
    const logInUser = userNameFromState || localStorage.getItem('User_name');

    if (logInUser) {
      setLoggedInUser(logInUser);
    } else {
      navigate('/login');
    }
  }, [location.state, navigate]);

  useEffect(() => {
    const group = localStorage.getItem('User_group');
    setUserGroup(group);
  }, []);

  const handleFileChange = (e) => {
    setSelectedImage(e.target.files[0]);
  };

  useEffect(() => {
    axios.get('/customer/GetCustomersList')
      .then((res) => {
        if (res.data.success) {
          setAllCustomerOptions(res.data.result);

          const accountOptions = res.data.result.filter((item) => item.Customer_group === 'Office & Vendor');
          setAccountCustomerOptions(accountOptions);
        }
      })
      .catch((err) => {
        console.error('Error fetching customer options:', err);
      });
  }, []);

  const selectedCustomer = useMemo(
    () => allCustomerOptions.find((option) => option.Customer_uuid === customers) || null,
    [allCustomerOptions, customers]
  );

  function addCustomer() {
    navigate('/addCustomer');
  }

  const sendWhatsApp = async (phone = mobileToSend, customerData = null) => {
    if (!phone) return toast.error('Customer phone number is required');
    setIsSendingWhatsApp(true);

    try {
      const customer = customerData || selectedCustomer;
      const customerLabel = customer?.Customer_name || Customer_name || 'Customer';
      const cleanPhone = normalizeWhatsAppPhone(phone);

      const payload = {
        to: cleanPhone,
        template_name: WHATSAPP_TEMPLATES.OPENING_BALANCE_PAYABLE,
        language: DEFAULT_TEMPLATE_LANGUAGE,
        components: [{
          type: 'body',
          parameters: buildOpeningBalancePayableParameters({
            customerName: customerLabel,
            asOnDate: '01-04-2025',
            amount: String(Amount || '0'),
            description: Description || 'Opening balance payable',
          }).map((text) => ({ type: 'text', text })),
        }],
      };

      const { data } = await axios.post('/api/whatsapp/send-template', payload);
      if (!data?.success) return toast.error(data?.error || 'Failed to send WhatsApp');
      toast.success('WhatsApp message sent');
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to send WhatsApp');
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  async function submit(e) {
    e.preventDefault();

    if (!Amount || Number.isNaN(Number(Amount)) || Number(Amount) <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    if (!customers) {
      toast.error('Please select an account.');
      return;
    }

    try {
      const journal = [
        {
          Account_id: customers,
          Type: 'Debit',
          Amount: Number(Amount),
        },
        {
          Account_id: '81f36451-41f2-402d-9dd3-cc11af039142',
          Type: 'Credit',
          Amount: Number(Amount),
        },
      ];

      const formData = new FormData();
      formData.append('Description', Description);
      formData.append('Total_Credit', Number(Amount));
      formData.append('Total_Debit', Number(Amount));
      formData.append('Payment_mode', 'Opening Balance');
      formData.append('Transaction_date', '01-04-2025');
      formData.append('Created_by', loggedInUser);
      formData.append('Journal_entry', JSON.stringify(journal));
      if (selectedImage) {
        formData.append('image', selectedImage);
      }
      const response = await axios.post('/transaction/addTransaction', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const customer = allCustomerOptions.find((option) => option.Customer_uuid === customers);
        const phoneNumber = extractPhoneNumber(customer);
        setMobileToSend(phoneNumber);
        setIsTransactionSaved(true);
        toast.success(response.data.message || 'Opening payable added');

        if (sendWhatsAppAfterSave) {
          await sendWhatsApp(phoneNumber, customer);
        }

        navigate('/allOrder');
      } else {
        toast.error('Failed to add Transaction');
      }
    } catch (err) {
      console.error('Error adding Transaction:', err);
      toast.error('Error occurred while submitting the form.');
    }
  }

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    setTotal_Debit(value);
    setTotal_Credit(value);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setCustomer_Name(value);

    if (value) {
      const filtered = allCustomerOptions.filter((option) =>
        option.Customer_name.toLowerCase().includes(value.toLowerCase()));
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions([]);
    }
  };

  const closeModal = () => {
    if (userGroup === 'Office User') {
      navigate('/home');
    } else if (userGroup === 'Admin User') {
      navigate('/home');
    }
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <PageContainer title="Add Payable" subtitle="Record opening payable entries with compact MUI workflow.">
        <SectionCard>
          <Box component="form" onSubmit={submit}>
            <Grid container spacing={1.25}>
              <Grid item xs={12} md={7}>
                <FormSection title="Vendor / Office Account">
                  <TextField
                    label="Search by Customer Name"
                    value={Customer_name}
                    onChange={handleInputChange}
                  />
                  <TextField
                    label="Matched Accounts"
                    select
                    value={customers}
                    onChange={(e) => setCustomers(e.target.value)}
                  >
                    <MenuItem value="">Select Account</MenuItem>
                    {(filteredOptions.length ? filteredOptions : accountCustomerOptions).map((option) => (
                      <MenuItem key={option.Customer_uuid} value={option.Customer_uuid}>{option.Customer_name}</MenuItem>
                    ))}
                  </TextField>
                  <Button variant="outlined" onClick={addCustomer}>Add Customer</Button>

                  <TextField
                    label="Description"
                    autoComplete="off"
                    onChange={(e) => setDescription(e.target.value)}
                    value={Description}
                  />
                  <TextField
                    label="Amount"
                    autoComplete="off"
                    onChange={handleAmountChange}
                    value={Amount}
                  />
                  <TextField
                    type="file"
                    inputProps={{ accept: 'image/*' }}
                    onChange={handleFileChange}
                    helperText="Upload supporting image (optional)"
                  />
                  <Stack direction="row" spacing={1}>
                    <TextField label="Total Debit" value={Total_Debit} InputProps={{ readOnly: true }} />
                    <TextField label="Total Credit" value={Total_Credit} InputProps={{ readOnly: true }} />
                  </Stack>
                </FormSection>
              </Grid>

              <Grid item xs={12} md={5}>
                <FormSection title="Status & actions">
                  <Alert severity="info" icon={<PaymentsRoundedIcon fontSize="inherit" />}>
                    <Typography variant="caption">
                      Account: {selectedCustomer?.Customer_name || 'Not selected'}
                      <br />
                      As on: 01-04-2025
                    </Typography>
                  </Alert>

                  <FormControlLabel
                    control={<Checkbox checked={sendWhatsAppAfterSave} onChange={(e) => setSendWhatsAppAfterSave(e.target.checked)} />}
                    label="Send WhatsApp after saving"
                  />

                  {isTransactionSaved && mobileToSend ? (
                    <Button
                      type="button"
                      variant="contained"
                      startIcon={<SendRoundedIcon />}
                      onClick={() => sendWhatsApp()}
                      disabled={isSendingWhatsApp}
                    >
                      {isSendingWhatsApp ? 'Sending WhatsApp...' : 'Send WhatsApp Opening Balance'}
                    </Button>
                  ) : null}
                </FormSection>
              </Grid>
            </Grid>

            <Box sx={{ mt: 1.5 }}>
              <ActionButtonGroup primaryLabel="Submit" onCancel={closeModal} cancelLabel="Close" />
            </Box>
          </Box>
        </SectionCard>
      </PageContainer>
    </>
  );
}
