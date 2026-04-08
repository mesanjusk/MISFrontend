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
  IconButton,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import { ActionButtonGroup, FormSection, PageContainer, SectionCard } from '../components/ui';

const createEmptyItem = () => ({
  Item: '',
  Quantity: 1,
  Rate: 0,
  Amount: 0,
  Priority: 'Normal',
  Remark: '',
});

const createEmptyVendorAssignment = () => ({
  vendorCustomerUuid: '',
  vendorName: '',
  workType: '',
  note: '',
  qty: 0,
  amount: 0,
  dueDate: '',
  paymentStatus: 'pending',
  status: 'pending',
});

export default function AddOrder1({ closeModal }) {
  const navigate = useNavigate();
  const location = useLocation();
  const previewRef = useRef();

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
  const [orderMode, setOrderMode] = useState('note');
  const [items, setItems] = useState([createEmptyItem()]);
  const [vendorAssignments, setVendorAssignments] = useState([createEmptyVendorAssignment()]);

  const isEnquiryOnly = orderType === 'Enquiry';
  const isEmbeddedFlow = typeof closeModal === 'function';

  useEffect(() => {
    const userNameFromState = location.state?.id;
    const logInUser = userNameFromState || localStorage.getItem('User_name');
    setIsAdminUser(localStorage.getItem('User_group') === 'Admin User');
    if (!logInUser) navigate('/login');
  }, [location.state, navigate]);

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
      } else {
        setTaskGroups([]);
      }
    } catch (error) {
      console.error(error);
      toast.error('Error fetching data');
    } finally {
      setOptionsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const closeAddOrder = () => {
    if (isEmbeddedFlow) closeModal();
    else navigate('/home');
  };

  const selectedCustomer = useMemo(
    () => customerOptions.find((c) => c.Customer_name === Customer_name) || null,
    [customerOptions, Customer_name]
  );

  const selectedPaymentMode = useMemo(
    () => accountCustomerOptions.find((c) => c.Customer_uuid === group) || null,
    [accountCustomerOptions, group]
  );

  const stepCandidates = useMemo(() => taskGroups.filter((tg) => tg.Id === 1), [taskGroups]);

  const vendorOptions = useMemo(
    () => customerOptions.filter((customer) => (customer?.Status || 'active') !== 'inactive'),
    [customerOptions]
  );

  const normalizedItems = useMemo(
    () => items
      .map((item) => {
        const quantity = Number(item.Quantity || 0);
        const rate = Number(item.Rate || 0);
        const amount = Number(item.Amount || quantity * rate || 0);
        return {
          ...item,
          Item: String(item.Item || '').trim(),
          Quantity: quantity,
          Rate: rate,
          Amount: amount,
        };
      })
      .filter((item) => item.Item),
    [items]
  );

  const normalizedVendorAssignments = useMemo(
    () => vendorAssignments
      .map((row) => ({
        ...row,
        qty: Number(row.qty || 0),
        amount: Number(row.amount || 0),
      }))
      .filter((row) => row.vendorCustomerUuid && row.vendorName),
    [vendorAssignments]
  );

  const canSubmit = useMemo(() => {
    if (!selectedCustomer) return false;
    if (isEnquiryOnly) return true;

    const hasNote = Boolean(String(Remark || '').trim());
    const hasItems = orderMode === 'items' ? normalizedItems.length > 0 : hasNote;
    const advanceOk = !isAdvanceChecked ? true : Number(Amount) > 0 && Boolean(group);
    return hasItems && advanceOk;
  }, [selectedCustomer, isEnquiryOnly, orderMode, normalizedItems.length, Remark, isAdvanceChecked, Amount, group]);

  const updateItemRow = (index, field, value) => {
    setItems((prev) =>
      prev.map((row, rowIndex) => {
        if (rowIndex !== index) return row;
        const next = { ...row, [field]: value };
        const quantity = Number(next.Quantity || 0);
        const rate = Number(next.Rate || 0);
        if (field !== 'Amount') {
          next.Amount = quantity * rate;
        }
        return next;
      })
    );
  };

  const updateVendorRow = (index, patch) => {
    setVendorAssignments((prev) =>
      prev.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row))
    );
  };

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
        components: [{
          type: 'body',
          parameters: buildOrderConfirmationParameters({
            customerName: customerLabel,
            orderNumber: latestOrderNumber || createdOrder?.Order_Number || createdOrder?.Order_number || '-',
            date: new Date().toLocaleDateString('en-IN'),
            amount: String(Number(Amount || 0) || 0),
            details: Remark || normalizedItems[0]?.Item || 'Order placed',
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
        const taskGroup = taskGroups.find((t) => t.Task_group_uuid === tgUuid);
        return {
          uuid: tgUuid,
          label: taskGroup?.Task_group_name || taskGroup?.Task_group || 'Unnamed Group',
          checked: true,
        };
      });

      const payloadItems = orderMode === 'items' ? normalizedItems : [];

      const orderRes = await axios.post('/order/addOrder', {
        Customer_uuid: customer.Customer_uuid,
        orderMode,
        orderNote: Remark,
        vendorAssignments: normalizedVendorAssignments,
        Steps: steps,
        Items: payloadItems,
        Type: isEnquiryOnly ? 'Enquiry' : 'Order',
        isEnquiry: isEnquiryOnly,
      });

      if (!orderRes.data?.success) {
        toast.error('Failed to add order');
        return;
      }

      setCreatedOrder(orderRes.data.result || null);
      setLatestOrderNumber(orderRes?.data?.result?.Order_Number || orderRes?.data?.result?.Order_number || '');

      const driveFile = orderRes.data?.driveFile;
      if (driveFile?.status === 'created') {
        toast.success('Order added and Drive file created');
      } else if (driveFile?.status === 'failed') {
        toast.error(`Order saved, but Drive file failed: ${driveFile?.error || 'Unknown error'}`);
      }

      if (isEnquiryOnly) {
        toast.success('Enquiry saved');
        if (isEmbeddedFlow) closeAddOrder();
        else navigate('/home');
        return;
      }

      setInvoiceItems(
        orderMode === 'items'
          ? payloadItems
          : [{ Item: 'Order Note', Quantity: 0, Rate: 0, Amount: 0, Priority: 'Normal', Remark }]
      );

      const phoneNumber = extractPhoneNumber(customer);
      setMobileToSend(phoneNumber);
      setIsTransactionSaved(true);

      if (sendWhatsAppAfterSave) {
        await sendWhatsApp(phoneNumber, customer);
      }

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
            Transaction_date:
              isAdminUser && isDateChecked
                ? saveDate || new Date().toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0],
            Total_Credit: amt,
            Total_Debit: amt,
            Payment_mode: payModeCustomer?.Customer_name || 'Advance',
            Journal_entry: journal,
          });

          if (txnRes.data?.success) {
            setInvoiceItems((prev) => [
              ...prev,
              { Item: 'Advance', Quantity: 1, Rate: amt, Amount: amt },
            ]);
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

      <PageContainer
        title={isEnquiryOnly ? 'New Enquiry' : 'New Order'}
        subtitle="Use one customer master, optional item rows, and multiple vendor assignments in the same order."
      >
        <SectionCard>
          <Box component="form" onSubmit={submit}>
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={8}>
                <FormSection
                  title="Order details"
                  subtitle="Choose customer, mode, note or items, and assign outside work vendors if needed."
                >
                  <ToggleButtonGroup
                    value={orderType}
                    exclusive
                    onChange={(_, next) => {
                      if (!next) return;
                      setOrderType(next);
                      if (next === 'Enquiry') {
                        setIsAdvanceChecked(false);
                        setAmount('');
                        setGroup('');
                        setSelectedTaskGroups([]);
                      }
                    }}
                    fullWidth
                  >
                    <ToggleButton value="Order">Order</ToggleButton>
                    <ToggleButton value="Enquiry">Enquiry</ToggleButton>
                  </ToggleButtonGroup>

                  {!isEnquiryOnly ? (
                    <ToggleButtonGroup
                      value={orderMode}
                      exclusive
                      onChange={(_, next) => next && setOrderMode(next)}
                      fullWidth
                    >
                      <ToggleButton value="note">Simple Note</ToggleButton>
                      <ToggleButton value="items">Detailed Items</ToggleButton>
                    </ToggleButtonGroup>
                  ) : null}

                  <Autocomplete
                    loading={optionsLoading}
                    options={customerOptions}
                    value={selectedCustomer}
                    inputValue={Customer_name}
                    onInputChange={(_, value) => setCustomer_Name(value || '')}
                    onChange={(_, value) => setCustomer_Name(value?.Customer_name || '')}
                    getOptionLabel={(option) => option?.Customer_name || ''}
                    isOptionEqualToValue={(option, value) => option?.Customer_uuid === value?.Customer_uuid}
                    renderInput={(params) => (
                      <TextField {...params} label="Customer / Party" placeholder="Search by name" />
                    )}
                  />

                  <Button
                    type="button"
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setShowCustomerModal(true)}
                  >
                    New Customer / Party
                  </Button>

                  <TextField
                    label={isEnquiryOnly ? 'Enquiry Note' : 'Order Note'}
                    value={Remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="Job description, note, size, delivery details, or work instructions"
                    multiline
                    minRows={3}
                  />

                  {!isEnquiryOnly && orderMode === 'items' ? (
                    <Stack spacing={1}>
                      {items.map((item, index) => (
                        <Grid container spacing={1} key={`item-${index}`} alignItems="center">
                          <Grid item xs={12} md={3.5}>
                            <TextField
                              label="Item"
                              value={item.Item}
                              onChange={(e) => updateItemRow(index, 'Item', e.target.value)}
                              fullWidth
                            />
                          </Grid>
                          <Grid item xs={4} md={1.5}>
                            <TextField
                              label="Qty"
                              type="number"
                              value={item.Quantity}
                              onChange={(e) => updateItemRow(index, 'Quantity', e.target.value)}
                              fullWidth
                            />
                          </Grid>
                          <Grid item xs={4} md={2}>
                            <TextField
                              label="Rate"
                              type="number"
                              value={item.Rate}
                              onChange={(e) => updateItemRow(index, 'Rate', e.target.value)}
                              fullWidth
                            />
                          </Grid>
                          <Grid item xs={4} md={2}>
                            <TextField
                              label="Amount"
                              type="number"
                              value={item.Amount}
                              onChange={(e) => updateItemRow(index, 'Amount', e.target.value)}
                              fullWidth
                            />
                          </Grid>
                          <Grid item xs={10} md={2.5}>
                            <TextField
                              label="Remark"
                              value={item.Remark}
                              onChange={(e) => updateItemRow(index, 'Remark', e.target.value)}
                              fullWidth
                            />
                          </Grid>
                          <Grid item xs={2} md={0.5}>
                            <IconButton
                              color="error"
                              onClick={() =>
                                setItems((prev) =>
                                  prev.length > 1
                                    ? prev.filter((_, rowIndex) => rowIndex !== index)
                                    : prev
                                )
                              }
                            >
                              <DeleteOutlineRoundedIcon />
                            </IconButton>
                          </Grid>
                        </Grid>
                      ))}
                      <Button
                        type="button"
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => setItems((prev) => [...prev, createEmptyItem()])}
                      >
                        Add Item Row
                      </Button>
                    </Stack>
                  ) : null}

                  {!isEnquiryOnly ? (
                    <>
                      <TextField
                        select
                        SelectProps={{
                          multiple: true,
                          renderValue: (selected) =>
                            stepCandidates
                              .filter((tg) => selected.includes(tg.Task_group_uuid))
                              .map((tg) => tg.Task_group_name || tg.Task_group)
                              .join(', '),
                        }}
                        label="Production Steps"
                        value={selectedTaskGroups}
                        onChange={(e) => setSelectedTaskGroups(e.target.value)}
                      >
                        {stepCandidates.map((tg) => (
                          <MenuItem key={tg.Task_group_uuid} value={tg.Task_group_uuid}>
                            {tg.Task_group_name || tg.Task_group}
                          </MenuItem>
                        ))}
                      </TextField>

                      <Alert severity="info">
                        No separate vendor master is needed. Pick any existing customer/party as a vendor for this order.
                      </Alert>

                      <Stack spacing={1}>
                        {vendorAssignments.map((row, index) => (
                          <Grid container spacing={1} key={`vendor-${index}`} alignItems="center">
                            <Grid item xs={12} md={3}>
                              <Autocomplete
                                options={vendorOptions}
                                value={vendorOptions.find((item) => item.Customer_uuid === row.vendorCustomerUuid) || null}
                                onChange={(_, value) =>
                                  updateVendorRow(index, {
                                    vendorCustomerUuid: value?.Customer_uuid || '',
                                    vendorName: value?.Customer_name || '',
                                  })
                                }
                                getOptionLabel={(option) => option?.Customer_name || ''}
                                isOptionEqualToValue={(option, value) => option?.Customer_uuid === value?.Customer_uuid}
                                renderInput={(params) => <TextField {...params} label="Vendor / Party" />}
                              />
                            </Grid>
                            <Grid item xs={12} md={2}>
                              <TextField
                                label="Work Type"
                                value={row.workType}
                                onChange={(e) => updateVendorRow(index, { workType: e.target.value })}
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={6} md={1.2}>
                              <TextField
                                label="Qty"
                                type="number"
                                value={row.qty}
                                onChange={(e) => updateVendorRow(index, { qty: e.target.value })}
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={6} md={1.5}>
                              <TextField
                                label="Cost"
                                type="number"
                                value={row.amount}
                                onChange={(e) => updateVendorRow(index, { amount: e.target.value })}
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={12} md={2}>
                              <TextField
                                label="Due Date"
                                type="date"
                                value={row.dueDate}
                                onChange={(e) => updateVendorRow(index, { dueDate: e.target.value })}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                              />
                            </Grid>
                            <Grid item xs={10} md={2}>
                              <TextField
                                label="Note"
                                value={row.note}
                                onChange={(e) => updateVendorRow(index, { note: e.target.value })}
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={2} md={0.3}>
                              <IconButton
                                color="error"
                                onClick={() =>
                                  setVendorAssignments((prev) =>
                                    prev.length > 1
                                      ? prev.filter((_, rowIndex) => rowIndex !== index)
                                      : prev
                                  )
                                }
                              >
                                <DeleteOutlineRoundedIcon />
                              </IconButton>
                            </Grid>
                          </Grid>
                        ))}
                        <Button
                          type="button"
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={() =>
                            setVendorAssignments((prev) => [...prev, createEmptyVendorAssignment()])
                          }
                        >
                          Add Vendor Assignment
                        </Button>
                      </Stack>

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isAdvanceChecked}
                            onChange={() => {
                              setIsAdvanceChecked((prev) => !prev);
                              setAmount('');
                              setGroup('');
                            }}
                          />
                        }
                        label="Add advance payment"
                      />

                      {isAdvanceChecked ? (
                        <Grid container spacing={1.25}>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              label="Advance Amount (₹)"
                              type="number"
                              value={Amount}
                              onChange={(e) => setAmount(e.target.value)}
                              inputProps={{ min: 0, step: '0.01' }}
                              fullWidth
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              select
                              label="Payment Mode"
                              value={group}
                              onChange={(e) => setGroup(e.target.value)}
                              fullWidth
                            >
                              <MenuItem value="">Select payment mode</MenuItem>
                              {accountCustomerOptions.map((c) => (
                                <MenuItem key={c.Customer_uuid} value={c.Customer_uuid}>
                                  {c.Customer_name}
                                </MenuItem>
                              ))}
                            </TextField>
                          </Grid>
                        </Grid>
                      ) : null}
                    </>
                  ) : null}
                </FormSection>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormSection title="Status & actions" subtitle="Compact summary with vendor and amount visibility.">
                  <Alert severity="info" icon={<AssignmentRoundedIcon fontSize="inherit" />}>
                    <Typography variant="caption">
                      Customer: {selectedCustomer?.Customer_name || 'Not selected'}
                      <br />
                      Type: {orderType}
                      {!isEnquiryOnly ? <><br />Mode: {orderMode === 'items' ? 'Detailed Items' : 'Simple Note'}</> : null}
                      {!isEnquiryOnly ? <><br />Vendor rows: {normalizedVendorAssignments.length}</> : null}
                      {!isEnquiryOnly ? (
                        <><br />Vendor cost: ₹{normalizedVendorAssignments.reduce((sum, row) => sum + Number(row.amount || 0), 0)}</>
                      ) : null}
                      {!isEnquiryOnly ? <><br />Advance: {isAdvanceChecked ? `₹${Amount || 0}` : 'No'}</> : null}
                      {!isEnquiryOnly && selectedPaymentMode ? <><br />Payment mode: {selectedPaymentMode.Customer_name}</> : null}
                    </Typography>
                  </Alert>

                  {!isEnquiryOnly ? (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={sendWhatsAppAfterSave}
                          onChange={(e) => setSendWhatsAppAfterSave(e.target.checked)}
                        />
                      }
                      label="Send WhatsApp after saving"
                    />
                  ) : null}

                  {isAdminUser && !isEnquiryOnly ? (
                    <>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isDateChecked}
                            onChange={() => {
                              setIsDateChecked((prev) => !prev);
                              setSaveDate(new Date().toISOString().split('T')[0]);
                            }}
                          />
                        }
                        label="Save custom advance date"
                      />
                      {isDateChecked ? (
                        <TextField
                          label="Advance Date"
                          type="date"
                          value={saveDate}
                          onChange={(e) => setSaveDate(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                      ) : null}
                    </>
                  ) : null}

                  {optionsLoading ? (
                    <Stack direction="row" justifyContent="center">
                      <LoadingSpinner />
                    </Stack>
                  ) : null}

                  {isTransactionSaved && !isEnquiryOnly ? (
                    <Button
                      type="button"
                      variant="contained"
                      startIcon={<SendRoundedIcon />}
                      onClick={() => sendWhatsApp()}
                      disabled={isSendingWhatsApp}
                    >
                      {isSendingWhatsApp ? 'Sending WhatsApp...' : 'Send WhatsApp Receipt'}
                    </Button>
                  ) : null}
                </FormSection>
              </Grid>
            </Grid>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.5 }}>
              <ActionButtonGroup
                primaryLabel={
                  isSubmitting
                    ? isEnquiryOnly
                      ? 'Saving Enquiry...'
                      : 'Submitting...'
                    : isEnquiryOnly
                      ? 'Save Enquiry'
                      : 'Submit Order'
                }
                busy={optionsLoading || isSubmitting || !canSubmit}
                onCancel={closeAddOrder}
                cancelLabel="Close"
              />
            </Stack>
          </Box>
        </SectionCard>
      </PageContainer>

      <Dialog
        open={showCustomerModal}
        onClose={() => {
          setShowCustomerModal(false);
          fetchData();
        }}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogContent sx={{ p: 0 }}>
          <AddCustomer
            onClose={() => {
              setShowCustomerModal(false);
              fetchData();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
