/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../apiClient.js';
import toast from 'react-hot-toast';
import AddCustomer from './addCustomer';
import InvoiceModal from '../Components/InvoiceModal';
import { LoadingSpinner } from '../Components';
import { extractPhoneNumber, normalizeWhatsAppPhone, sendAdminAlertText } from '../utils/whatsapp.js';
import {
  DEFAULT_TEMPLATE_LANGUAGE,
  WHATSAPP_TEMPLATES,
  buildOrderConfirmationParameters,
} from '../constants/whatsappTemplates';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import { ActionButtonGroup, FormSection, PageContainer, SectionCard } from '../Components/ui';

export default function AddOrder1({ closeModal }) {
  const navigate = useNavigate();
  const location = useLocation();
  const previewRef = useRef();

  const [loggedInUser, setLoggedInUser] = useState('');
  const [Customer_name, setCustomer_Name] = useState('');
  const [Remark, setRemark] = useState('');
  const [customerOptions, setCustomerOptions] = useState([]);
  const [accountCustomerOptions, setAccountCustomerOptions] = useState([]);
  const [group, setGroup] = useState('');
  const [isAdvanceChecked, setIsAdvanceChecked] = useState(false);
  const [Amount, setAmount] = useState('');
  const [taskGroups, setTaskGroups] = useState([]);
  const [selectedTaskGroups, setSelectedTaskGroups] = useState([]);
  const [mobileToSend, setMobileToSend] = useState('');
  const [sendWhatsAppAfterSave, setSendWhatsAppAfterSave] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [isTransactionSaved, setIsTransactionSaved] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [latestOrderNumber, setLatestOrderNumber] = useState('');
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isDateChecked, setIsDateChecked] = useState(false);
  const [saveDate, setSaveDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [orderType, setOrderType] = useState('Order');

  const isEnquiryOnly = orderType === 'Enquiry';

  useEffect(() => {
    const userNameFromState = location.state?.id;
    const logInUser = userNameFromState || localStorage.getItem('User_name');
    setIsAdminUser(localStorage.getItem('User_group') === 'Admin User');
    if (logInUser) setLoggedInUser(logInUser);
    else navigate('/login');
  }, [location.state, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      setOptionsLoading(true);
      try {
        const [customerRes, taskRes] = await Promise.all([
          axios.get('/customer/GetCustomersList'),
          axios.get('/taskgroup/GetTaskgroupList'),
        ]);

        if (customerRes.data?.success) {
          const all = customerRes.data.result || [];
          setCustomerOptions(all);
          setAccountCustomerOptions(all.filter((item) => item.Customer_group === 'Bank and Account'));
        }

        if (taskRes.data?.success) {
          setTaskGroups(taskRes.data.result || []);
          setSelectedTaskGroups([]);
        } else {
          setTaskGroups([]);
          setSelectedTaskGroups([]);
        }
      } catch (error) {
        console.error(error);
        toast.error('Error fetching data');
      } finally {
        setOptionsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTaskGroupToggle = (uuid) => {
    setSelectedTaskGroups((prev) => (prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid]));
  };

  const buildItemsFromRemark = (remark) => {
    const trimmed = String(remark || '').trim();
    if (!trimmed) return [];
    return [{ Item: 'Order Note', Quantity: 0, Rate: 0, Amount: 0, Priority: 'Normal', Remark: trimmed }];
  };

  const closeAddOrder = () => {
    if (typeof closeModal === 'function') {
      closeModal();
      return;
    }
    navigate('/home');
  };
  const isEmbeddedFlow = typeof closeModal === 'function';

  const selectedCustomer = useMemo(
    () => customerOptions.find((c) => c.Customer_name === Customer_name) || null,
    [customerOptions, Customer_name]
  );
  const selectedPaymentMode = useMemo(
    () => accountCustomerOptions.find((c) => c.Customer_uuid === group) || null,
    [accountCustomerOptions, group]
  );
  const stepCandidates = useMemo(() => taskGroups.filter((tg) => tg.Id === 1), [taskGroups]);

  const canSubmit = useMemo(() => {
    const hasCustomer = Boolean(selectedCustomer);
    if (isEnquiryOnly) return hasCustomer;
    const advanceOk = !isAdvanceChecked ? true : Number(Amount) > 0 && Boolean(group);
    return hasCustomer && advanceOk;
  }, [selectedCustomer, isEnquiryOnly, isAdvanceChecked, Amount, group]);

  const sendWhatsApp = async (phone = mobileToSend, customerData = null) => {
    if (!phone) return toast.error('Customer phone number is required');
    setIsSendingWhatsApp(true);
    try {
      const customer = customerData || selectedCustomer;
      const customerLabel = customer?.Customer_name || Customer_name || 'Customer';
      const cleanPhone = normalizeWhatsAppPhone(phone);
      const payload = {
        to: cleanPhone,
        template_name: WHATSAPP_TEMPLATES.ORDER_CONFIRMATION,
        language: DEFAULT_TEMPLATE_LANGUAGE,
        Components: [{
          type: 'body',
          parameters: buildOrderConfirmationParameters({
            customerName: customerLabel,
            orderNumber:
              latestOrderNumber ||
              createdOrder?.Order_Number ||
              createdOrder?.Order_number ||
              '-',
            date: new Date().toLocaleDateString('en-IN'),
            amount: String(Number(Amount || 0) || 0),
            details: Remark || 'Order placed',
          }).map((text) => ({ type: 'text', text })),
        }],
      };
      const { data } = await axios.post('/api/whatsapp/send-template', payload);
      if (!data?.success) return toast.error(data?.error || 'Failed to send WhatsApp template');
      await sendAdminAlertText({
        axiosInstance: axios,
        message: `Order alert: ${customerLabel} | Amount: ₹${Number(Amount || 0) || 0} | ${Remark || 'Order placed'}`,
      }).catch(() => null);
      toast.success('WhatsApp template sent');
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to send WhatsApp template');
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const customer = selectedCustomer;
      if (!customer) {
        toast.error('Invalid customer selection');
        return;
      }

      const steps = selectedTaskGroups.map((tgUuid) => {
        const g = taskGroups.find((t) => t.Task_group_uuid === tgUuid);
        return { uuid: tgUuid, label: g?.Task_group_name || g?.Task_group || 'Unnamed Group', checked: true };
      });

      const orderRes = await axios.post('/order/addOrder', {
        Customer_uuid: customer.Customer_uuid,
        Steps: steps,
        Items: buildItemsFromRemark(Remark),
        Type: isEnquiryOnly ? 'Enquiry' : 'Order',
        isEnquiry: isEnquiryOnly,
      });

      if (!orderRes.data?.success) {
        toast.error('Failed to add order');
        return;
      }

      setCreatedOrder(orderRes.data.result || null);
      setLatestOrderNumber(
        orderRes?.data?.result?.Order_Number ||
        orderRes?.data?.result?.Order_number ||
        ''
      );
      const driveFile = orderRes.data?.driveFile;
      if (driveFile?.status === 'created') toast.success('Order added and Drive file created');
      else if (driveFile?.status === 'failed') toast.error(`Order saved, but Drive file failed: ${driveFile?.error || 'Unknown error'}`);

      if (isEnquiryOnly) {
        toast.success('Enquiry saved');
        if (isEmbeddedFlow) closeAddOrder();
        else navigate('/home');
        return;
      }

      setInvoiceItems(buildItemsFromRemark(Remark));
      const phoneNumber = extractPhoneNumber(customer);
      setMobileToSend(phoneNumber);
      setIsTransactionSaved(true);

      if (sendWhatsAppAfterSave) await sendWhatsApp(phoneNumber, customer);

      setShowInvoiceModal(true);
      toast.success('Order added');

      if (isAdvanceChecked && Amount && group) {
        const amt = Number(Amount || 0);
        if (Number.isNaN(amt) || amt <= 0) {
          toast.error('Enter a valid advance amount');
          return;
        }

        const payModeCustomer = accountCustomerOptions.find((opt) => opt.Customer_uuid === group);
        const journal = [
          { Account_id: group, Type: 'Debit', Amount: amt },
          { Account_id: customer.Customer_uuid, Type: 'Credit', Amount: amt },
        ];

        try {
          const txnRes = await axios.post('/transaction/addTransaction', {
            Description: Remark || 'Advance received',
            Transaction_date: isAdminUser && isDateChecked ? (saveDate || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
            Total_Credit: amt,
            Total_Debit: amt,
            Payment_mode: payModeCustomer?.Customer_name || 'Advance',
            Journal_entry: journal,
            Created_by: loggedInUser,
          });

          if (txnRes.data?.success) {
            setInvoiceItems((prev) => [...prev, { Item: 'Advance', Quantity: 1, Rate: amt, Amount: amt }]);
            toast.success('Advance payment recorded');
          } else {
            toast.error('Transaction failed');
          }
        } catch {
          toast.error('Transaction failed');
        }
      }

      if (isEmbeddedFlow) closeAddOrder();
    } catch (error) {
      console.error('Error during submit:', error);
      toast.error(error?.response?.data?.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <InvoiceModal
        open={showInvoiceModal}
        onClose={() => {
          setShowInvoiceModal(false);
          navigate('/home');
        }}
        invoiceRef={previewRef}
        customerName={Customer_name}
        customerMobile={mobileToSend}
        items={invoiceItems}
        remark={Remark}
        order={createdOrder}
        onSendWhatsApp={() => sendWhatsApp()}
      />

      <PageContainer title={isEnquiryOnly ? 'New Enquiry' : 'New Order'} subtitle="Redesigned to match the follow-up page with a cleaner compact form.">
        <SectionCard>
          <Box component="form" onSubmit={submit}>
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={7}>
                <FormSection title="Order details" subtitle="Select type, customer, note and optional production steps.">
                  <ToggleButtonGroup value={orderType} exclusive onChange={(_, next) => { if (next) { setOrderType(next); if (next === 'Enquiry') { setIsAdvanceChecked(false); setAmount(''); setGroup(''); setSelectedTaskGroups([]); } } }} fullWidth>
                    <ToggleButton value="Order">Order</ToggleButton>
                    <ToggleButton value="Enquiry">Enquiry</ToggleButton>
                  </ToggleButtonGroup>

                  <Autocomplete
                    loading={optionsLoading}
                    options={customerOptions}
                    value={selectedCustomer}
                    inputValue={Customer_name}
                    onInputChange={(_, value) => setCustomer_Name(value || '')}
                    onChange={(_, value) => setCustomer_Name(value?.Customer_name || '')}
                    getOptionLabel={(option) => option?.Customer_name || ''}
                    isOptionEqualToValue={(option, value) => option?.Customer_uuid === value?.Customer_uuid}
                    renderInput={(params) => <TextField {...params} label="Customer" placeholder="Search by customer name" />}
                  />

                  <Button type="button" variant="outlined" startIcon={<AddIcon />} onClick={() => setShowCustomerModal(true)}>
                    New Customer
                  </Button>

                  <TextField label={isEnquiryOnly ? 'Enquiry Note' : 'Order Note'} value={Remark} onChange={(e) => setRemark(e.target.value)} placeholder="Item details / note" multiline minRows={2} />

                  {!isEnquiryOnly ? (
                    <>
                      <TextField
                        select
                        SelectProps={{ multiple: true, renderValue: (selected) => stepCandidates.filter((tg) => selected.includes(tg.Task_group_uuid)).map((tg) => tg.Task_group_name || tg.Task_group).join(', ') }}
                        label="Production Steps"
                        value={selectedTaskGroups}
                        onChange={(e) => setSelectedTaskGroups(e.target.value)}
                      >
                        {stepCandidates.map((tg) => (
                          <MenuItem key={tg.Task_group_uuid} value={tg.Task_group_uuid}>{tg.Task_group_name || tg.Task_group}</MenuItem>
                        ))}
                      </TextField>

                      <FormControlLabel control={<Checkbox checked={isAdvanceChecked} onChange={() => { setIsAdvanceChecked((prev) => !prev); setAmount(''); setGroup(''); }} />} label="Add advance payment" />

                      {isAdvanceChecked ? (
                        <Grid container spacing={1.25}>
                          <Grid item xs={12} sm={6}>
                            <TextField label="Advance Amount (₹)" type="number" value={Amount} onChange={(e) => setAmount(e.target.value)} inputProps={{ min: 0, step: '0.01' }} fullWidth />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField select label="Payment Mode" value={group} onChange={(e) => setGroup(e.target.value)} fullWidth>
                              <MenuItem value="">Select payment mode</MenuItem>
                              {accountCustomerOptions.map((c) => (
                                <MenuItem key={c.Customer_uuid} value={c.Customer_uuid}>{c.Customer_name}</MenuItem>
                              ))}
                            </TextField>
                          </Grid>
                        </Grid>
                      ) : null}
                    </>
                  ) : null}
                </FormSection>
              </Grid>

              <Grid item xs={12} md={5}>
                <FormSection title="Status & actions" subtitle="Compact action panel like follow-ups, with order summary and delivery controls.">
                  <Alert severity="info" icon={<AssignmentRoundedIcon fontSize="inherit" />}>
                    <Typography variant="caption">
                      Customer: {selectedCustomer?.Customer_name || 'Not selected'}
                      <br />
                      Type: {orderType}
                      {!isEnquiryOnly ? <><br />Advance: {isAdvanceChecked ? `₹${Amount || 0}` : 'No'}</> : null}
                      {!isEnquiryOnly && selectedPaymentMode ? <><br />Payment mode: {selectedPaymentMode.Customer_name}</> : null}
                    </Typography>
                  </Alert>

                  {!isEnquiryOnly ? <FormControlLabel control={<Checkbox checked={sendWhatsAppAfterSave} onChange={(e) => setSendWhatsAppAfterSave(e.target.checked)} />} label="Send WhatsApp after saving" /> : null}

                  {isAdminUser && !isEnquiryOnly ? (
                    <>
                      <FormControlLabel control={<Checkbox checked={isDateChecked} onChange={() => { setIsDateChecked((prev) => !prev); setSaveDate(new Date().toISOString().split('T')[0]); }} />} label="Save custom advance date" />
                      {isDateChecked ? <TextField label="Advance Date" type="date" value={saveDate} onChange={(e) => setSaveDate(e.target.value)} InputLabelProps={{ shrink: true }} /> : null}
                    </>
                  ) : null}

                  {optionsLoading ? (
                    <Stack direction="row" justifyContent="center"><LoadingSpinner /></Stack>
                  ) : null}

                  {isTransactionSaved && !isEnquiryOnly ? (
                    <Button type="button" variant="contained" startIcon={<SendRoundedIcon />} onClick={() => sendWhatsApp()} disabled={isSendingWhatsApp}>
                      {isSendingWhatsApp ? 'Sending WhatsApp...' : 'Send WhatsApp Receipt'}
                    </Button>
                  ) : null}
                </FormSection>
              </Grid>
            </Grid>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.5 }}>
              <ActionButtonGroup
                primaryLabel={isSubmitting ? (isEnquiryOnly ? 'Saving Enquiry...' : 'Submitting...') : (isEnquiryOnly ? 'Save Enquiry' : 'Submit Order')}
                busy={optionsLoading || isSubmitting || !canSubmit}
                onCancel={closeAddOrder}
                cancelLabel="Close"
              />
            </Stack>
          </Box>
        </SectionCard>
      </PageContainer>

      <Dialog open={showCustomerModal} onClose={() => setShowCustomerModal(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogContent sx={{ p: 0 }}>
          <AddCustomer onClose={() => setShowCustomerModal(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
