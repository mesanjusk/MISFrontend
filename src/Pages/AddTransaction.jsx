import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../apiClient.js';
import { ToastContainer, toast } from '../Components';
import {
  Alert,
  Autocomplete,
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
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import { DEFAULT_TEMPLATE_LANGUAGE, WHATSAPP_TEMPLATES, buildPaymentReceivedParameters } from '../constants/whatsappTemplates';
import { sendAdminAlertText } from '../utils/whatsapp';
import { ActionButtonGroup, FormSection, PageContainer, SectionCard } from '../components/ui';

export default function AddTransaction({ editMode, existingData, onClose, onSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [Description, setDescription] = useState('');
  const [Amount, setAmount] = useState('');
  const [Transaction_date, setTransaction_date] = useState('');
  const [group, setGroup] = useState('');
  const [customers, setCustomers] = useState('');
  const [Customer_name, setCustomer_Name] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isDateChecked, setIsDateChecked] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);

  const [allCustomerOptions, setAllCustomerOptions] = useState([]);
  const [accountCustomerOptions, setAccountCustomerOptions] = useState([]);

  const [mobileToSend, setMobileToSend] = useState('');
  const [sendWhatsAppAfterSave, setSendWhatsAppAfterSave] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [isTransactionSaved, setIsTransactionSaved] = useState(false);

  useEffect(() => {
    const userNameFromState = location.state?.id || localStorage.getItem('User_name');
    if (userNameFromState) setLoggedInUser(userNameFromState);
    else navigate('/login');
    setIsAdminUser((localStorage.getItem('User_group') || '') === 'Admin User');
  }, [location.state, navigate]);

  useEffect(() => {
    setOptionsLoading(true);
    axios.get('/customer/GetCustomersList')
      .then((res) => {
        if (res.data.success) {
          setAllCustomerOptions(res.data.result);
          setAccountCustomerOptions(
            res.data.result.filter((item) => item.Customer_group === 'Bank and Account')
          );
        }
      })
      .catch(() => toast.error('Error fetching customers'))
      .finally(() => setOptionsLoading(false));
  }, []);

  useEffect(() => {
    if (!editMode || !existingData || allCustomerOptions.length === 0) return;

    const getCreditUuid = (txn) => txn.Journal_entry?.find((j) => j.Type.toLowerCase() === 'credit')?.Account_id;
    const getDebitUuid = (txn) => txn.Journal_entry?.find((j) => j.Type.toLowerCase() === 'debit')?.Account_id;

    const debitId = getDebitUuid(existingData) || '';
    setDescription(existingData.Description || '');
    setAmount(existingData.Total_Debit || existingData.Total_Credit || '');
    setTransaction_date(existingData.Transaction_date?.substring(0, 10) || '');
    setGroup(getCreditUuid(existingData) || '');
    setCustomers(debitId);
    const customer = allCustomerOptions.find((c) => c.Customer_uuid === debitId);
    setCustomer_Name(customer?.Customer_name || '');
    setIsDateChecked(!!existingData.Transaction_date);
  }, [editMode, existingData, allCustomerOptions]);

  const selectedCustomer = useMemo(
    () => allCustomerOptions.find((c) => c.Customer_uuid === customers) || null,
    [allCustomerOptions, customers]
  );
  const selectedPaymentMode = useMemo(
    () => accountCustomerOptions.find((c) => c.Customer_uuid === group) || null,
    [accountCustomerOptions, group]
  );

  const closeModal = () => {
    if (onClose) onClose();
    else navigate('/home');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!Amount || Number.isNaN(Number(Amount)) || Number(Amount) <= 0) {
      return toast.error('Enter valid amount.');
    }
    if (!customers || !group) {
      return toast.error('Select both customer and payment mode.');
    }

    const customer = allCustomerOptions.find((c) => c.Customer_uuid === customers);
    const paymentMode = accountCustomerOptions.find((c) => c.Customer_uuid === group);
    if (!customer || !paymentMode) return toast.error('Selected customer or payment mode is invalid.');

    const todayDate = new Date().toISOString().split('T')[0];
    const journal = [
      { Account_id: customers, Type: 'Debit', Amount: Number(Amount) },
      { Account_id: group, Type: 'Credit', Amount: Number(Amount) },
    ];

    const formData = new FormData();
    formData.append('Description', Description);
    formData.append('Total_Credit', Number(Amount));
    formData.append('Total_Debit', Number(Amount));
    formData.append('Payment_mode', paymentMode.Customer_name);
    formData.append('Created_by', loggedInUser);
    formData.append('Transaction_date', isAdminUser && isDateChecked ? (Transaction_date || todayDate) : todayDate);
    formData.append('Journal_entry', JSON.stringify(journal));
    if (editMode && existingData?._id) formData.append('_id', existingData._id);
    if (selectedImage) formData.append('image', selectedImage);

    try {
      setLoading(true);
      const res = await axios.post('/transaction/addTransaction', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (!res.data.success) return toast.error('Failed to save transaction');

      toast.success(editMode ? 'Receipt updated.' : 'Receipt saved.');
      const phoneNumber = customer?.Mobile_number || customer?.mobile || customer?.phone || '';
      setMobileToSend(phoneNumber);
      setIsTransactionSaved(true);

      if (sendWhatsAppAfterSave) {
        await sendWhatsApp(phoneNumber);
      }

      onSuccess?.();
      closeModal();
    } catch {
      toast.error('Submission error');
    } finally {
      setLoading(false);
    }
  };

  const sendWhatsApp = async (phone = mobileToSend) => {
    if (!phone) return toast.error('Customer phone number is required');
    setIsSendingWhatsApp(true);
    try {
      let cleanPhone = String(phone).replace(/\D/g, '');
      if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;

      const payload = {
        to: cleanPhone,
        template_name: WHATSAPP_TEMPLATES.PAYMENT_RECEIVED,
        language: DEFAULT_TEMPLATE_LANGUAGE,
        components: [{
          type: 'body',
          parameters: buildPaymentReceivedParameters({
            customerName: Customer_name || 'Customer',
            actionLabel: 'payment',
            date: new Date().toLocaleDateString('en-IN'),
            amount: String(Amount || '0'),
            description: Description || 'Payment received',
          }).map((text) => ({ type: 'text', text })),
        }],
      };

      const { data } = await axios.post('/api/whatsapp/send-template', payload);
      if (!data?.success) return toast.error(data?.error || 'Failed to send WhatsApp');

      await sendAdminAlertText({
        axiosInstance: axios,
        message: `Receipt alert: ${Customer_name || 'Customer'} | Amount: ₹${Amount || 0} | ${Description || 'Payment received'}`,
      }).catch(() => null);
      toast.success('WhatsApp message sent');
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to send WhatsApp');
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <PageContainer title={editMode ? 'Edit Receipt' : 'Add Receipt'} subtitle="Create a receipt entry similar to follow-ups, but for payments received.">
        <SectionCard>
          <Box component="form" onSubmit={submit}>
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={7}>
                <FormSection title="Receipt details" subtitle="Select customer, enter amount and choose payment mode.">
                  <Autocomplete
                    loading={optionsLoading}
                    options={allCustomerOptions}
                    value={selectedCustomer}
                    inputValue={Customer_name}
                    onInputChange={(_, value) => {
                      setCustomer_Name(value || '');
                      if (!value) setCustomers('');
                    }}
                    onChange={(_, value) => {
                      setCustomers(value?.Customer_uuid || '');
                      setCustomer_Name(value?.Customer_name || '');
                    }}
                    getOptionLabel={(option) => option?.Customer_name || ''}
                    isOptionEqualToValue={(option, value) => option?.Customer_uuid === value?.Customer_uuid}
                    renderInput={(params) => <TextField {...params} label="Customer" placeholder="Search by customer name" />}
                  />

                  <Button type="button" variant="outlined" startIcon={<PersonAddAlt1RoundedIcon />} onClick={() => navigate('/addCustomer')}>
                    Add Customer
                  </Button>

                  <TextField label="Description" value={Description} onChange={(e) => setDescription(e.target.value)} placeholder="Receipt description" />

                  <Grid container spacing={1.25}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Amount (₹)"
                        type="number"
                        value={Amount}
                        onChange={(e) => setAmount(e.target.value)}
                        inputProps={{ min: 0, step: '0.01' }}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField select label="Payment Mode" value={group} onChange={(e) => setGroup(e.target.value)} fullWidth>
                        <MenuItem value="">Select payment mode</MenuItem>
                        {accountCustomerOptions.map((cust) => (
                          <MenuItem key={cust.Customer_uuid} value={cust.Customer_uuid}>{cust.Customer_name}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  </Grid>

                  <TextField type="file" inputProps={{ accept: 'image/*' }} onChange={(e) => setSelectedImage(e.target.files?.[0] || null)} helperText="Proof image is optional" />
                </FormSection>
              </Grid>

              <Grid item xs={12} md={5}>
                <FormSection title="Status & actions" subtitle="Compact side panel matching the follow-up style.">
                  <Alert severity="info" icon={<ReceiptLongRoundedIcon fontSize="inherit" />}>
                    <Typography variant="caption">
                      Customer: {selectedCustomer?.Customer_name || 'Not selected'}
                      <br />
                      Payment mode: {selectedPaymentMode?.Customer_name || 'Not selected'}
                    </Typography>
                  </Alert>

                  <FormControlLabel
                    control={<Checkbox checked={sendWhatsAppAfterSave} onChange={(e) => setSendWhatsAppAfterSave(e.target.checked)} />}
                    label="Send WhatsApp after saving"
                  />

                  {isAdminUser ? (
                    <>
                      <FormControlLabel
                        control={<Checkbox checked={isDateChecked} onChange={() => { setIsDateChecked((prev) => !prev); setTransaction_date(''); }} />}
                        label="Save custom date"
                      />
                      {isDateChecked ? (
                        <TextField label="Transaction Date" type="date" value={Transaction_date} onChange={(e) => setTransaction_date(e.target.value)} InputLabelProps={{ shrink: true }} />
                      ) : null}
                    </>
                  ) : null}

                  {isTransactionSaved && mobileToSend ? (
                    <Button type="button" variant="contained" startIcon={<SendRoundedIcon />} onClick={() => sendWhatsApp()} disabled={isSendingWhatsApp}>
                      {isSendingWhatsApp ? 'Sending WhatsApp...' : 'Send WhatsApp Receipt'}
                    </Button>
                  ) : null}
                </FormSection>
              </Grid>
            </Grid>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.5 }}>
              <ActionButtonGroup primaryLabel={loading ? 'Saving...' : editMode ? 'Update' : 'Submit'} busy={loading} onCancel={closeModal} cancelLabel="Close" />
            </Stack>
          </Box>
        </SectionCard>
      </PageContainer>
    </>
  );
}

AddTransaction.propTypes = {
  editMode: PropTypes.bool,
  existingData: PropTypes.object,
  onClose: PropTypes.func,
  onSuccess: PropTypes.func,
};
