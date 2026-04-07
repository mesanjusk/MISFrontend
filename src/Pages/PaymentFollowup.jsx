/* eslint-disable react/prop-types */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../apiClient.js';
import toast, { Toaster } from 'react-hot-toast';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
  Autocomplete,
} from '@mui/material';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import {
  extractPhoneNumber,
  normalizeWhatsAppPhone,
  sendTemplateWithTextFallback,
} from '../utils/whatsapp.js';
import {
  WHATSAPP_TEMPLATES,
  buildFollowupDueTodayParameters,
  buildFollowupFriendlyParameters,
} from '../constants/whatsappTemplates';
import { ActionButtonGroup, PageContainer, SectionCard } from '../components/ui';

const todayISO = () => new Date().toLocaleDateString('en-CA');

const getCustomerDisplayName = (item = {}) =>
  (
    item.Customer_name ||
    item.User_name ||
    item.name ||
    item.Name ||
    ''
  )
    .toString()
    .trim();

const findCustomerByName = (customers = [], selectedName = '') => {
  const target = String(selectedName || '').trim().toLowerCase();
  if (!target) return null;

  return (
    customers.find(
      (item) => getCustomerDisplayName(item).trim().toLowerCase() === target
    ) || null
  );
};

export default function PaymentFollowup() {
  const navigate = useNavigate();

  const [Customer, setCustomer] = useState('');
  const [Amount, setAmount] = useState('');
  const [Title, setTitle] = useState('');
  const [Remark, setRemark] = useState('');

  const [customerOptions, setCustomerOptions] = useState([]);
  const [customerDetails, setCustomerDetails] = useState([]);

  const [whatsAppMessage, setWhatsAppMessage] = useState('');
  const [mobileToSend, setMobileToSend] = useState('');
  const [sendWhatsAppAfterSave, setSendWhatsAppAfterSave] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [isTransactionSaved, setIsTransactionSaved] = useState(false);

  const [isDateChecked, setIsDateChecked] = useState(false);
  const [Deadline, setDeadline] = useState(todayISO());

  const [submitting, setSubmitting] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    setIsAdminUser(localStorage.getItem('User_group') === 'Admin User');

    const loadCustomers = async () => {
      const normalizeNames = (arr) =>
        Array.from(
          new Set(
            (arr || [])
              .map((it) => getCustomerDisplayName(it))
              .filter(Boolean)
          )
        );

      try {
        const r1 = await axios.get('/customer/GetCustomerList');
        if (r1?.data?.success && Array.isArray(r1.data.result)) {
          setCustomerDetails(r1.data.result);
          setCustomerOptions(normalizeNames(r1.data.result));
          return;
        }
        throw new Error('Singular route returned unexpected response');
      } catch {
        try {
          const r2 = await axios.get('/customer/GetCustomersList');
          if (r2?.data?.success && Array.isArray(r2.data.result)) {
            setCustomerDetails(r2.data.result);
            setCustomerOptions(normalizeNames(r2.data.result));
            return;
          }
          throw new Error('Plural route returned unexpected response');
        } catch (err2) {
          const msg =
            err2?.response?.data?.message || err2?.message || 'Unknown error';
          console.error('Error fetching customers:', msg, err2?.response?.data);
          toast.error(`Unable to load customers: ${msg}`);
        }
      }
    };

    loadCustomers();
  }, []);

  const selectedCustomer = useMemo(
    () => findCustomerByName(customerDetails, Customer),
    [customerDetails, Customer]
  );

  const detectedPhone = useMemo(() => {
    const rawPhone = extractPhoneNumber(selectedCustomer);
    return normalizeWhatsAppPhone(rawPhone || '');
  }, [selectedCustomer]);

  const closeModal = () => navigate('/Home');

  const handleDateCheckboxChange = () => {
    setIsDateChecked((prev) => !prev);
    setDeadline(todayISO());
  };

  const sendWhatsApp = async (
    phone = mobileToSend,
    message = whatsAppMessage,
    customerData = null
  ) => {
    const selected = customerData || selectedCustomer;
    const resolvedPhone = normalizeWhatsAppPhone(
      phone || extractPhoneNumber(selected)
    );

    if (!selected) {
      toast.error('Selected customer details not found');
      return;
    }

    if (!resolvedPhone) {
      toast.error('Selected customer has no mobile number');
      return;
    }

    setIsSendingWhatsApp(true);

    try {
      const customerLabel = getCustomerDisplayName(selected) || Customer || 'Customer';
      const followupDate = Deadline || todayISO();
      const today = todayISO();

      const isDueToday = followupDate === today;
      const templateName = isDueToday
        ? WHATSAPP_TEMPLATES.FOLLOWUP_DUE_TODAY
        : WHATSAPP_TEMPLATES.FOLLOWUP_FRIENDLY;

      const bodyParameters = isDueToday
        ? buildFollowupDueTodayParameters({
            customerName: customerLabel,
            amount: String(Number(Amount || 0) || 0),
            dueDate: followupDate,
            reference: Title?.trim() || Remark?.trim() || '-',
          })
        : buildFollowupFriendlyParameters({
            customerName: customerLabel,
            amount: String(Number(Amount || 0) || 0),
            expectedDate: followupDate,
            reference: Title?.trim() || Remark?.trim() || '-',
          });

      const { data } = await sendTemplateWithTextFallback({
        axiosInstance: axios,
        phone: resolvedPhone,
        templateName,
        bodyParameters,
        fallbackMessage: message,
      });

      if (data?.success) {
        toast.success('WhatsApp message sent');
      } else {
        toast.error(data?.error || 'Failed to send WhatsApp message');
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to send WhatsApp message');
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!Customer) return toast.error('Please select a customer.');
    if (!customerOptions.includes(Customer)) {
      return toast.error('Please pick a customer from the suggestions.');
    }
    if (!Amount || Number(Amount) <= 0) {
      return toast.error('Please enter a valid amount.');
    }

    const finalDate =
      isAdminUser && isDateChecked ? Deadline || todayISO() : todayISO();

    try {
      setSubmitting(true);
      const res = await axios.post('/paymentfollowup/add', {
        Customer,
        Amount: Number(Amount),
        Title: Title?.trim(),
        Followup_date: finalDate,
        Remark: Remark?.trim(),
      });

      if (res.data === 'exist') {
        toast.error('A similar follow-up already exists for this customer/date.');
        return;
      }

      const matchedCustomer = findCustomerByName(customerDetails, Customer);
      const phoneNumber = normalizeWhatsAppPhone(
        extractPhoneNumber(matchedCustomer)
      );
      const message = `Hello ${Customer}, we will follow up with you for ₹${Number(Amount)}. Thank you!`;

      toast.success('Payment follow-up added.');
      setWhatsAppMessage(message);
      setMobileToSend(phoneNumber || '');
      setIsTransactionSaved(true);

      if (sendWhatsAppAfterSave) {
        if (!matchedCustomer) {
          toast.error('Customer details not found for WhatsApp');
          return;
        }

        if (!phoneNumber) {
          toast.error('Selected customer has no mobile number');
          return;
        }

        await sendWhatsApp(phoneNumber, message, matchedCustomer);
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || 'Unknown error';
      console.error('Save follow-up error:', msg, err?.response?.data);
      toast.error(`Something went wrong: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <PageContainer
        title="Payment Follow-up"
        subtitle="Track pending payment callbacks and send WhatsApp reminders."
      >
        <SectionCard>
          <Box component="form" onSubmit={submit}>
            <Stack spacing={1}>
              <Autocomplete
                options={customerOptions}
                value={Customer}
                onChange={(_, value) => setCustomer(value || '')}
                onInputChange={(_, value) => setCustomer(value || '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Customer"
                    placeholder="Search customer"
                  />
                )}
              />

              <TextField
                label="Amount (₹)"
                type="number"
                value={Amount}
                onChange={(e) => setAmount(e.target.value)}
                inputProps={{ min: 0, step: '0.01' }}
              />

              {isAdminUser && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isDateChecked}
                      onChange={handleDateCheckboxChange}
                    />
                  }
                  label="Save Date"
                />
              )}

              {isAdminUser && isDateChecked ? (
                <TextField
                  label="Follow-up Date"
                  type="date"
                  value={Deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              ) : null}

              <TextField
                label="Short Title / Reason"
                value={Title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Pending invoice for July"
              />

              <TextField
                label="Remark"
                value={Remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Add remark"
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={sendWhatsAppAfterSave}
                    onChange={(e) => setSendWhatsAppAfterSave(e.target.checked)}
                    disabled={!detectedPhone}
                  />
                }
                label={
                  detectedPhone
                    ? `Send WhatsApp after saving (${detectedPhone})`
                    : 'Send WhatsApp after saving (mobile not available)'
                }
              />

              {isTransactionSaved ? (
                <Button
                  type="button"
                  variant="outlined"
                  startIcon={<SendRoundedIcon fontSize="small" />}
                  onClick={() => sendWhatsApp()}
                  disabled={isSendingWhatsApp || !mobileToSend}
                >
                  {isSendingWhatsApp
                    ? 'Sending WhatsApp...'
                    : !mobileToSend
                    ? 'Mobile number missing'
                    : 'Send WhatsApp Reminder'}
                </Button>
              ) : null}

              <ActionButtonGroup
                primaryLabel={submitting ? 'Saving...' : 'Submit'}
                busy={submitting}
                onCancel={closeModal}
                cancelLabel="Close"
              />

              <Alert severity={detectedPhone ? 'info' : 'warning'}>
                <Typography variant="caption">
                  {customerOptions.length} customer
                  {customerOptions.length === 1 ? '' : 's'} available.
                  {' '}
                  {Customer
                    ? detectedPhone
                      ? `WhatsApp will use: ${detectedPhone}`
                      : 'Selected customer does not have a mobile number.'
                    : ''}
                </Typography>
              </Alert>
            </Stack>
          </Box>
        </SectionCard>
      </PageContainer>
    </>
  );
}