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
  Chip,
  Dialog,
  DialogContent,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

const createEmptyItem = () => ({
  Item: '',
  Item_group: '',
  Quantity: 1,
  Rate: 0,
  Amount: 0,
  Remark: '',
});

const createEmptyVendorAssignment = () => ({
  vendorCustomerUuid: '',
  vendorName: '',
  workType: '',
  note: '',
  qty: '',
  amount: '',
  dueDate: '',
});

const compactFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    minHeight: 42,
  },
};

const sectionCardSx = {
  p: 1.25,
  borderRadius: 2.5,
  border: '1px solid',
  borderColor: 'divider',
  boxShadow: 'none',
  bgcolor: 'background.paper',
};

const inputLabelProps = { shrink: true };

const sortByName = (list = [], key = '') =>
  [...list].sort((a, b) =>
    String(a?.[key] || '').localeCompare(String(b?.[key] || ''), undefined, {
      sensitivity: 'base',
    })
  );

const sortStrings = (list = []) =>
  [...list].sort((a, b) =>
    String(a || '').localeCompare(String(b || ''), undefined, {
      sensitivity: 'base',
    })
  );

const getSuccessfulResultArray = (settledResult) => {
  if (settledResult?.status !== 'fulfilled') return [];
  const payload = settledResult.value?.data;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
};

export default function AddOrder1({ closeModal }) {
  const navigate = useNavigate();
  const location = useLocation();
  const previewRef = useRef();

  const [entryType, setEntryType] = useState('Order');
  const [Customer_name, setCustomer_Name] = useState('');
  const [selectedCustomerUuid, setSelectedCustomerUuid] = useState('');
  const [customerSearchInput, setCustomerSearchInput] = useState('');
  const [Remark, setRemark] = useState('');
  const [customerOptions, setCustomerOptions] = useState([]);
  const [accountCustomerOptions, setAccountCustomerOptions] = useState([]);
  const [itemOptions, setItemOptions] = useState([]);
  const [itemGroupOptions, setItemGroupOptions] = useState([]);
  const [group, setGroup] = useState('');
  const [isAdvanceChecked, setIsAdvanceChecked] = useState(false);
  const [Amount, setAmount] = useState('');
  const [taskGroups, setTaskGroups] = useState([]);
  const [selectedTaskGroups, setSelectedTaskGroups] = useState([]);
  const [mobileToSend, setMobileToSend] = useState('');
  const [sendWhatsAppAfterSave, setSendWhatsAppAfterSave] = useState(false);
  const [isVendorChecked, setIsVendorChecked] = useState(false);
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
  const [items, setItems] = useState([createEmptyItem()]);
  const [vendorAssignments, setVendorAssignments] = useState([createEmptyVendorAssignment()]);

  const isEnquiryOnly = entryType === 'Enquiry';
  const isDetailedOrder = entryType === 'DetailedOrder';
  const isEmbeddedFlow = typeof closeModal === 'function';

  useEffect(() => {
    const userNameFromState = location.state?.id;
    const logInUser = userNameFromState || localStorage.getItem('User_name');
    setIsAdminUser(localStorage.getItem('User_group') === 'Admin User');
    if (!logInUser) navigate('/login');
  }, [location.state, navigate]);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  const fetchData = async () => {
    setOptionsLoading(true);
    try {
      const [customerRes, taskRes, itemRes, itemResPaged, itemGroupRes] = await Promise.allSettled([
        axios.get('/customer/GetCustomersList'),
        axios.get('/taskgroup/GetTaskgroupList'),
        axios.get('/item/GetItemList'),
        axios.get('/item/GetItemList?page=1&limit=1000'),
        axios.get('/itemgroup/GetItemgroupList'),
      ]);

      const customers = getSuccessfulResultArray(customerRes);
      const tasks = getSuccessfulResultArray(taskRes);
      const itemsList = getSuccessfulResultArray(itemRes).length
        ? getSuccessfulResultArray(itemRes)
        : getSuccessfulResultArray(itemResPaged);
      const itemGroups = getSuccessfulResultArray(itemGroupRes);

      setCustomerOptions(sortByName(customers, 'Customer_name'));
      setAccountCustomerOptions(
        sortByName(
          customers.filter((item) => item.Customer_group === 'Bank and Account'),
          'Customer_name'
        )
      );
      setTaskGroups(tasks);
      setItemOptions(sortByName(itemsList, 'Item_name'));

      const groupNames = itemGroups
        .map((item) => item?.Item_group)
        .filter(Boolean);

      setItemGroupOptions(sortStrings(groupNames));

      if (
        customerRes.status === 'rejected' ||
        taskRes.status === 'rejected' ||
        (itemRes.status === 'rejected' && itemResPaged.status === 'rejected') ||
        itemGroupRes.status === 'rejected'
      ) {
        console.error('One or more dropdown APIs failed', {
          customerRes,
          taskRes,
          itemRes,
          itemResPaged,
          itemGroupRes,
        });
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

  const sortedCustomerOptions = useMemo(
    () => sortByName(customerOptions, 'Customer_name'),
    [customerOptions]
  );

  const selectedCustomer = useMemo(
    () =>
      sortedCustomerOptions.find(
        (c) =>
          (selectedCustomerUuid && String(c.Customer_uuid) === String(selectedCustomerUuid)) ||
          String(c.Customer_name || '') === String(Customer_name || '')
      ) || null,
    [sortedCustomerOptions, selectedCustomerUuid, Customer_name]
  );

  const stepCandidates = useMemo(
    () =>
      sortByName(
        taskGroups.filter((tg) => tg.Id === 1),
        'Task_group_name'
      ),
    [taskGroups]
  );

  const sortedPaymentModeOptions = useMemo(
    () => sortByName(accountCustomerOptions, 'Customer_name'),
    [accountCustomerOptions]
  );

  const vendorOptions = useMemo(
    () =>
      sortByName(
        customerOptions.filter((customer) => (customer?.Status || 'active') !== 'inactive'),
        'Customer_name'
      ),
    [customerOptions]
  );

  const itemNameOptions = useMemo(
    () => sortByName(itemOptions, 'Item_name'),
    [itemOptions]
  );

  const selectMenuProps = useMemo(
    () => ({
      sx: { zIndex: 2305 },
      PaperProps: {
        sx: { zIndex: 2305 },
      },
    }),
    []
  );

  const autocompleteSlotProps = useMemo(
    () => ({
      popper: {
        sx: { zIndex: 2305 },
      },
    }),
    []
  );

  const normalizedItems = useMemo(
    () =>
      items
        .map((item) => {
          const quantity = Number(item.Quantity || 0);
          const rate = Number(item.Rate || 0);
          const amount = Number(item.Amount || quantity * rate || 0);

          return {
            ...item,
            Item: String(item.Item || '').trim(),
            Item_group: String(item.Item_group || '').trim(),
            Quantity: quantity,
            Rate: rate,
            Amount: amount,
            Remark: String(item.Remark || '').trim(),
          };
        })
        .filter((item) => item.Item),
    [items]
  );

  const normalizedVendorAssignments = useMemo(
    () =>
      vendorAssignments
        .map((row) => ({
          ...row,
          workType: String(row.workType || '').trim(),
          note: String(row.note || '').trim(),
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
    const hasItems = isDetailedOrder ? normalizedItems.length > 0 : hasNote;
    const advanceOk = !isAdvanceChecked ? true : Number(Amount) > 0 && Boolean(group);

    return hasItems && advanceOk;
  }, [
    selectedCustomer,
    isEnquiryOnly,
    isDetailedOrder,
    normalizedItems.length,
    Remark,
    isAdvanceChecked,
    Amount,
    group,
  ]);

  const updateItemRow = (index, field, value) => {
    setItems((prev) =>
      prev.map((row, rowIndex) => {
        if (rowIndex !== index) return row;
        const next = { ...row, [field]: value };

        if (field === 'Item') {
          const selectedItem = itemOptions.find(
            (option) => String(option?.Item_name || '') === String(value || '')
          );
          if (selectedItem?.Item_group) {
            next.Item_group = selectedItem.Item_group;
          }
        }

        const quantity = Number(next.Quantity || 0);
        const rate = Number(next.Rate || 0);

        if (field !== 'Amount') {
          next.Amount = quantity * rate;
        }

        return next;
      })
    );
  };

  const addItemRow = () => {
    setItems((prev) => [...prev, createEmptyItem()]);
  };

  const removeItemRow = (index) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const updateVendorRow = (index, patch) => {
    setVendorAssignments((prev) =>
      prev.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row))
    );
  };

  const addVendorRow = () => {
    setVendorAssignments((prev) => [...prev, createEmptyVendorAssignment()]);
  };

  const removeVendorRow = (index) => {
    setVendorAssignments((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const toggleTaskGroup = (taskGroupUuid) => {
    setSelectedTaskGroups((prev) =>
      prev.includes(taskGroupUuid)
        ? prev.filter((uuid) => uuid !== taskGroupUuid)
        : [...prev, taskGroupUuid]
    );
  };

  const handleEntryTypeChange = (_, next) => {
    if (!next) return;
    setEntryType(next);

    if (next === 'Enquiry') {
      setIsAdvanceChecked(false);
      setSendWhatsAppAfterSave(false);
      setIsVendorChecked(false);
      setAmount('');
      setGroup('');
      setSelectedTaskGroups([]);
    }
  };

  const sendWhatsApp = async (phone = mobileToSend, customerData = null) => {
    if (!phone) {
      toast.error('Customer phone number is required');
      return;
    }

    setIsSendingWhatsApp(true);

    try {
      const customer = customerData || selectedCustomer;
      const customerLabel = customer?.Customer_name || Customer_name || 'Customer';
      const cleanPhone = normalizeWhatsAppPhone(phone);

      const payload = {
        to: cleanPhone,
        template_name: WHATSAPP_TEMPLATES.ORDER_CONFIRMATION,
        language: DEFAULT_TEMPLATE_LANGUAGE,
        components: [
          {
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
              details: isDetailedOrder
                ? normalizedItems[0]?.Item || 'Detailed order placed'
                : Remark || 'Order placed',
            }).map((text) => ({ type: 'text', text })),
          },
        ],
      };

      const { data } = await axios.post('/api/whatsapp/send-template', payload);

      if (!data?.success) {
        toast.error(data?.error || 'Failed to send WhatsApp template');
        return;
      }

      await sendAdminAlertText({
        axiosInstance: axios,
        message: `Order alert: ${customerLabel} | Amount: ₹${Number(Amount || 0) || 0} | ${
          isDetailedOrder ? normalizedItems[0]?.Item || 'Detailed order placed' : Remark || 'Order placed'
        }`,
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

      const payloadItems = isDetailedOrder ? normalizedItems : [];

      const orderRes = await axios.post('/order/addOrder', {
        Customer_uuid: customer.Customer_uuid,
        orderMode: isDetailedOrder ? 'items' : 'note',
        orderNote: isDetailedOrder ? '' : Remark,
        vendorAssignments: isVendorChecked ? normalizedVendorAssignments : [],
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
      setLatestOrderNumber(
        orderRes?.data?.result?.Order_Number || orderRes?.data?.result?.Order_number || ''
      );

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
        isDetailedOrder
          ? payloadItems
          : [{ Item: 'Order Note', Quantity: 0, Rate: 0, Amount: 0, Remark }]
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

        const payModeCustomer = sortedPaymentModeOptions.find((opt) => opt.Customer_uuid === group);
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
              { Item: 'Advance', Quantity: 1, Rate: amt, Amount: amt, Remark: '' },
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

      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 2000,
          bgcolor: 'background.default',
          overflowY: 'auto',
          overflowX: 'hidden',
          p: { xs: 1, sm: 1.5 },
        }}
      >
        <Box
          component="form"
          onSubmit={submit}
          sx={{
            width: '100%',
            minHeight: '100%',
            pb: 10,
          }}
        >
          <Stack spacing={1}>
            <Paper sx={sectionCardSx}>
              <Stack spacing={1}>
                <ToggleButtonGroup
                  value={entryType}
                  exclusive
                  size="small"
                  fullWidth
                  onChange={handleEntryTypeChange}
                  sx={{
                    '& .MuiToggleButton-root': {
                      textTransform: 'none',
                      borderRadius: '10px !important',
                      py: 0.8,
                      fontSize: { xs: '0.74rem', sm: '0.82rem' },
                    },
                  }}
                >
                  <ToggleButton value="Order">Order</ToggleButton>
                  <ToggleButton value="DetailedOrder">Detailed Order</ToggleButton>
                  <ToggleButton value="Enquiry">Enquiry</ToggleButton>
                </ToggleButtonGroup>

                <Stack direction="row" spacing={1} alignItems="stretch">
                  <Autocomplete
                    loading={optionsLoading}
                    options={sortedCustomerOptions}
                    value={selectedCustomer}
                    inputValue={customerSearchInput}
                    onInputChange={(_, value, reason) => {
                      setCustomerSearchInput(value || '');
                      if (reason === 'input') {
                        setSelectedCustomerUuid('');
                        setCustomer_Name(value || '');
                      }
                      if (reason === 'clear') {
                        setSelectedCustomerUuid('');
                        setCustomer_Name('');
                      }
                    }}
                    onChange={(_, value) => {
                      setCustomer_Name(value?.Customer_name || '');
                      setSelectedCustomerUuid(value?.Customer_uuid || '');
                      setCustomerSearchInput(value?.Customer_name || '');
                    }}
                    getOptionLabel={(option) => option?.Customer_name || ''}
                    isOptionEqualToValue={(option, value) =>
                      option?.Customer_uuid === value?.Customer_uuid
                    }
                    slotProps={autocompleteSlotProps}
                    sx={{ flex: 1, minWidth: 0 }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Customer / Party"
                        placeholder="Search by name"
                        size="small"
                        sx={compactFieldSx}
                      />
                    )}
                  />

                  <Button
                    type="button"
                    variant="outlined"
                    size="small"
                    onClick={() => setShowCustomerModal(true)}
                    sx={{
                      minWidth: 42,
                      width: 42,
                      flexShrink: 0,
                      borderRadius: 2,
                      px: 0,
                      zIndex: 2,
                    }}
                  >
                    <AddIcon />
                  </Button>
                </Stack>

                {!isDetailedOrder ? (
                  <TextField
                    label={isEnquiryOnly ? 'Enquiry Note' : 'Order Note'}
                    value={Remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="Job description, size, delivery details, or work instructions"
                    multiline
                    minRows={2.5}
                    size="small"
                    fullWidth
                    sx={compactFieldSx}
                  />
                ) : null}
              </Stack>
            </Paper>

            {!isEnquiryOnly ? (
              <Paper sx={sectionCardSx}>
                <Stack spacing={1}>
                  <Typography variant="body2" fontWeight={700}>
                    Production Steps
                  </Typography>

                  {stepCandidates.length ? (
                    <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                      {stepCandidates.map((tg) => {
                        const isSelected = selectedTaskGroups.includes(tg.Task_group_uuid);
                        return (
                          <Chip
                            key={tg.Task_group_uuid}
                            label={tg.Task_group_name || tg.Task_group}
                            clickable
                            color={isSelected ? 'primary' : 'default'}
                            variant={isSelected ? 'filled' : 'outlined'}
                            onClick={() => toggleTaskGroup(tg.Task_group_uuid)}
                            icon={
                              <Checkbox
                                size="small"
                                checked={isSelected}
                                sx={{ p: 0, ml: 0.5 }}
                              />
                            }
                            sx={{
                              height: 34,
                              borderRadius: 2,
                              '& .MuiChip-label': { px: 0.75 },
                            }}
                          />
                        );
                      })}
                    </Stack>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      No production steps available
                    </Typography>
                  )}
                </Stack>
              </Paper>
            ) : null}

            {isDetailedOrder ? (
              <Paper sx={sectionCardSx}>
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2" fontWeight={700}>
                      Detailed Items
                    </Typography>
                    <Button
                      type="button"
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={addItemRow}
                      sx={{ borderRadius: 2 }}
                    >
                      Add Item
                    </Button>
                  </Stack>

                  {items.map((item, index) => (
                    <Paper
                      key={`item-${index}`}
                      variant="outlined"
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        boxShadow: 'none',
                      }}
                    >
                      <Stack spacing={1}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Typography variant="caption" color="text.secondary">
                            Item {index + 1}
                          </Typography>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeItemRow(index)}
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </Stack>

                        <Autocomplete
                          options={itemNameOptions}
                          freeSolo
                          slotProps={autocompleteSlotProps}
                          value={item.Item || ''}
                          getOptionLabel={(option) =>
                            typeof option === 'string' ? option : option?.Item_name || ''
                          }
                          onChange={(_, value) =>
                            updateItemRow(
                              index,
                              'Item',
                              typeof value === 'string' ? value : value?.Item_name || ''
                            )
                          }
                          inputValue={item.Item || ''}
                          onInputChange={(_, value) => updateItemRow(index, 'Item', value || '')}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Item Name"
                              size="small"
                              fullWidth
                              sx={compactFieldSx}
                            />
                          )}
                        />

                        <TextField
                          select
                          label="Item Group"
                          value={item.Item_group}
                          onChange={(e) => updateItemRow(index, 'Item_group', e.target.value)}
                          size="small"
                          fullWidth
                          sx={compactFieldSx}
                          MenuProps={selectMenuProps}
                        >
                          <MenuItem value="">Select Group</MenuItem>
                          {itemGroupOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </TextField>

                        <Stack direction="row" spacing={1}>
                          <TextField
                            label="Qty"
                            type="number"
                            value={item.Quantity}
                            onChange={(e) => updateItemRow(index, 'Quantity', e.target.value)}
                            size="small"
                            fullWidth
                            sx={compactFieldSx}
                          />
                          <TextField
                            label="Rate"
                            type="number"
                            value={item.Rate}
                            onChange={(e) => updateItemRow(index, 'Rate', e.target.value)}
                            size="small"
                            fullWidth
                            sx={compactFieldSx}
                          />
                          <TextField
                            label="Amount"
                            type="number"
                            value={item.Amount}
                            onChange={(e) => updateItemRow(index, 'Amount', e.target.value)}
                            size="small"
                            fullWidth
                            sx={compactFieldSx}
                          />
                        </Stack>

                        <TextField
                          label="Remark"
                          value={item.Remark}
                          onChange={(e) => updateItemRow(index, 'Remark', e.target.value)}
                          size="small"
                          fullWidth
                          sx={compactFieldSx}
                        />
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Paper>
            ) : null}

            {!isEnquiryOnly ? (
              <Paper sx={sectionCardSx}>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                    <FormControlLabel
                      sx={{ m: 0 }}
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
                      label="Advance"
                    />

                    <FormControlLabel
                      sx={{ m: 0 }}
                      control={
                        <Checkbox
                          checked={sendWhatsAppAfterSave}
                          onChange={(e) => setSendWhatsAppAfterSave(e.target.checked)}
                        />
                      }
                      label="Send WhatsApp"
                    />

                    <FormControlLabel
                      sx={{ m: 0 }}
                      control={
                        <Checkbox
                          checked={isVendorChecked}
                          onChange={(e) => setIsVendorChecked(e.target.checked)}
                        />
                      }
                      label="Vendor"
                    />
                  </Stack>

                  {isAdvanceChecked ? (
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1}>
                        <TextField
                          label="Advance Amount (₹)"
                          type="number"
                          value={Amount}
                          onChange={(e) => setAmount(e.target.value)}
                          inputProps={{ min: 0, step: '0.01' }}
                          size="small"
                          fullWidth
                          sx={compactFieldSx}
                        />
                        <TextField
                          select
                          label="Payment Mode"
                          value={group}
                          onChange={(e) => setGroup(e.target.value)}
                          size="small"
                          fullWidth
                          sx={compactFieldSx}
                          MenuProps={selectMenuProps}
                        >
                          <MenuItem value="">Select</MenuItem>
                          {sortedPaymentModeOptions.map((c) => (
                            <MenuItem key={c.Customer_uuid} value={c.Customer_uuid}>
                              {c.Customer_name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Stack>

                      {isAdminUser ? (
                        <>
                          <FormControlLabel
                            sx={{ m: 0 }}
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
                              size="small"
                              fullWidth
                              sx={compactFieldSx}
                              InputLabelProps={inputLabelProps}
                            />
                          ) : null}
                        </>
                      ) : null}
                    </Stack>
                  ) : null}

                  {isVendorChecked ? (
                    <Stack spacing={1}>
                      <Alert
                        severity="info"
                        sx={{
                          py: 0,
                          borderRadius: 2,
                          '& .MuiAlert-message': { py: 0.75 },
                        }}
                      >
                        Pick any existing customer / party as vendor.
                      </Alert>

                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="body2" fontWeight={700}>
                          Vendor Details
                        </Typography>
                        <Button
                          type="button"
                          variant="outlined"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={addVendorRow}
                          sx={{ borderRadius: 2 }}
                        >
                          Add Vendor
                        </Button>
                      </Stack>

                      {vendorAssignments.map((row, index) => (
                        <Paper
                          key={`vendor-${index}`}
                          variant="outlined"
                          sx={{
                            p: 1,
                            borderRadius: 2,
                            boxShadow: 'none',
                          }}
                        >
                          <Stack spacing={1}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                              <Typography variant="caption" color="text.secondary">
                                Vendor {index + 1}
                              </Typography>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => removeVendorRow(index)}
                              >
                                <DeleteOutlineRoundedIcon fontSize="small" />
                              </IconButton>
                            </Stack>

                            <Autocomplete
                              options={vendorOptions}
                              slotProps={autocompleteSlotProps}
                              value={
                                vendorOptions.find(
                                  (item) => item.Customer_uuid === row.vendorCustomerUuid
                                ) || null
                              }
                              onChange={(_, value) =>
                                updateVendorRow(index, {
                                  vendorCustomerUuid: value?.Customer_uuid || '',
                                  vendorName: value?.Customer_name || '',
                                })
                              }
                              getOptionLabel={(option) => option?.Customer_name || ''}
                              isOptionEqualToValue={(option, value) =>
                                option?.Customer_uuid === value?.Customer_uuid
                              }
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label="Vendor / Party"
                                  size="small"
                                  sx={compactFieldSx}
                                />
                              )}
                            />

                            <TextField
                              label="Work Type"
                              value={row.workType}
                              onChange={(e) => updateVendorRow(index, { workType: e.target.value })}
                              size="small"
                              fullWidth
                              sx={compactFieldSx}
                            />

                            <Stack direction="row" spacing={1}>
                              <TextField
                                label="Qty"
                                type="number"
                                value={row.qty}
                                onChange={(e) => updateVendorRow(index, { qty: e.target.value })}
                                size="small"
                                fullWidth
                                sx={compactFieldSx}
                              />
                              <TextField
                                label="Cost"
                                type="number"
                                value={row.amount}
                                onChange={(e) => updateVendorRow(index, { amount: e.target.value })}
                                size="small"
                                fullWidth
                                sx={compactFieldSx}
                              />
                            </Stack>

                            <TextField
                              label="Due Date"
                              type="date"
                              value={row.dueDate}
                              onChange={(e) => updateVendorRow(index, { dueDate: e.target.value })}
                              size="small"
                              fullWidth
                              sx={compactFieldSx}
                              InputLabelProps={inputLabelProps}
                            />

                            <TextField
                              label="Note"
                              value={row.note}
                              onChange={(e) => updateVendorRow(index, { note: e.target.value })}
                              size="small"
                              fullWidth
                              sx={compactFieldSx}
                            />
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  ) : null}

                  {isTransactionSaved ? (
                    <Button
                      type="button"
                      variant="contained"
                      size="small"
                      startIcon={<SendRoundedIcon />}
                      onClick={() => sendWhatsApp()}
                      disabled={isSendingWhatsApp}
                      sx={{ alignSelf: 'flex-start', borderRadius: 2 }}
                    >
                      {isSendingWhatsApp ? 'Sending...' : 'Send WhatsApp Receipt'}
                    </Button>
                  ) : null}
                </Stack>
              </Paper>
            ) : null}

            {optionsLoading ? (
              <Paper sx={sectionCardSx}>
                <Stack direction="row" justifyContent="center" py={1}>
                  <LoadingSpinner />
                </Stack>
              </Paper>
            ) : null}
          </Stack>

          <Paper
            elevation={6}
            sx={{
              position: 'sticky',
              bottom: 8,
              mt: 1,
              p: 1,
              borderRadius: 2.5,
              zIndex: 2010,
            }}
          >
            <Stack direction="row" spacing={1}>
              <Button
                type="button"
                variant="outlined"
                fullWidth
                startIcon={<CloseRoundedIcon />}
                onClick={closeAddOrder}
                sx={{ borderRadius: 2, py: 1 }}
              >
                Close
              </Button>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={optionsLoading || isSubmitting || !canSubmit}
                sx={{ borderRadius: 2, py: 1 }}
              >
                {isSubmitting
                  ? isEnquiryOnly
                    ? 'Saving Enquiry...'
                    : 'Submitting...'
                  : isEnquiryOnly
                    ? 'Save Enquiry'
                    : 'Submit Order'}
              </Button>
            </Stack>
          </Paper>
        </Box>
      </Box>

      <Dialog
        open={showCustomerModal}
        onClose={() => {
          setShowCustomerModal(false);
          fetchData();
        }}
        fullWidth
        maxWidth="sm"
        sx={{ zIndex: 2400 }}
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
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
