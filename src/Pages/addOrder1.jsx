/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../apiClient.js";
import toast from "react-hot-toast";
import AddCustomer from "./addCustomer";
import InvoiceModal from "../Components/InvoiceModal";
import { LoadingSpinner } from "../Components";

/* ✅ MUI */
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Paper,
  Container,
  Stack,
  TextField,
  InputAdornment,
  Button,
  Divider,
  Dialog,
  DialogContent,
  Autocomplete,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import PaymentsIcon from "@mui/icons-material/Payments";
import ListAltIcon from "@mui/icons-material/ListAlt";
import SendIcon from "@mui/icons-material/Send";

export default function AddOrder1() {
  const navigate = useNavigate();
  const location = useLocation();
  const previewRef = useRef();

  // Auth / user
  const [loggedInUser, setLoggedInUser] = useState("");

  // Customers
  const [Customer_name, setCustomer_Name] = useState("");
  const [Remark, setRemark] = useState("");
  const [customerOptions, setCustomerOptions] = useState([]);
  const [accountCustomerOptions, setAccountCustomerOptions] = useState([]);
  const [group, setGroup] = useState("");

  // Advance
  const [isAdvanceChecked, setIsAdvanceChecked] = useState(false);
  const [Amount, setAmount] = useState("");

  // Task Groups / Steps
  const [taskGroups, setTaskGroups] = useState([]);
  const [selectedTaskGroups, setSelectedTaskGroups] = useState([]);

  // WhatsApp + invoice
  const [whatsAppMessage, setWhatsAppMessage] = useState("");
  const [mobileToSend, setMobileToSend] = useState("");
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [createdOrder, setCreatedOrder] = useState(null);

  // UX
  const [optionsLoading, setOptionsLoading] = useState(true);

  // ✅ Add Customer modal state
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // ✅ Order type: "Order" | "Enquiry"
  const [orderType, setOrderType] = useState("Order");
  const isEnquiryOnly = orderType === "Enquiry";

  /* ----------- auth init ----------- */
  useEffect(() => {
    const userNameFromState = location.state?.id;
    const logInUser = userNameFromState || localStorage.getItem("User_name");
    if (logInUser) setLoggedInUser(logInUser);
    else navigate("/login");
  }, [location.state, navigate]);

  /* ----------- Load customers + task groups ----------- */
  useEffect(() => {
    const fetchData = async () => {
      setOptionsLoading(true);
      try {
        const [customerRes, taskRes] = await Promise.all([
          axios.get(`/customer/GetCustomersList`),
          axios.get(`/taskgroup/GetTaskgroupList`),
        ]);

        if (customerRes.data?.success) {
          const all = customerRes.data.result || [];
          setCustomerOptions(all);

          const accountOptions = all.filter(
            (item) => item.Customer_group === "Bank and Account"
          );
          setAccountCustomerOptions(accountOptions);
        }

        if (taskRes.data?.success) {
          const allGroups = taskRes.data.result || [];
          setTaskGroups(allGroups);
          setSelectedTaskGroups([]);
        } else {
          setTaskGroups([]);
          setSelectedTaskGroups([]);
        }
      } catch (e) {
        console.error(e);
        toast.error("Error fetching data");
      } finally {
        setOptionsLoading(false);
      }
    };
    fetchData();
  }, []);

  /* ----------- Handlers ----------- */
  const handleTaskGroupToggle = (uuid) => {
    setSelectedTaskGroups((prev) =>
      prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid]
    );
  };

  const buildItemsFromRemark = (remark) => {
    const r = String(remark || "").trim();
    if (!r) return [];
    return [
      {
        Item: "Order Note",
        Quantity: 0,
        Rate: 0,
        Amount: 0,
        Priority: "Normal",
        Remark: r,
      },
    ];
  };

  const handleAdvanceCheckboxChange = () => {
    setIsAdvanceChecked((prev) => !prev);
    setAmount("");
    setGroup("");
  };

  const handleCustomer = () => setShowCustomerModal(true);
  const exitModal = () => setShowCustomerModal(false);

  /* ----------- Submit ----------- */
  const canSubmit = useMemo(() => {
    const hasCustomer = Boolean(
      customerOptions.find((c) => c.Customer_name === Customer_name)
    );

    // If enquiry: only need valid customer
    if (isEnquiryOnly) return hasCustomer;

    const advanceOk = !isAdvanceChecked
      ? true
      : Number(Amount) > 0 && Boolean(group);

    return hasCustomer && advanceOk;
  }, [
    Customer_name,
    customerOptions,
    isEnquiryOnly,
    isAdvanceChecked,
    Amount,
    group,
  ]);

  const submit = async (e) => {
    e.preventDefault();

    try {
      const customer = customerOptions.find(
        (opt) => opt.Customer_name === Customer_name
      );
      if (!customer) {
        toast.error("Invalid customer selection");
        return;
      }

      const steps = selectedTaskGroups.map((tgUuid) => {
        const g = taskGroups.find((t) => t.Task_group_uuid === tgUuid);
        return {
          uuid: tgUuid,
          label: g?.Task_group_name || g?.Task_group || "Unnamed Group",
          checked: true,
        };
      });

      const orderRes = await axios.post(`/order/addOrder`, {
        Customer_uuid: customer.Customer_uuid,
        Steps: steps,
        Items: buildItemsFromRemark(Remark),
        Type: isEnquiryOnly ? "Enquiry" : "Order",
        isEnquiry: isEnquiryOnly,
      });

      if (!orderRes.data?.success) {
        toast.error("Failed to add order");
        return;
      }

      setCreatedOrder(orderRes.data.result || null);

      // ✅ Enquiry flow
      if (isEnquiryOnly) {
        toast.success("Enquiry saved");
        navigate("/home");
        return;
      }

      // ------- Normal ORDER flow -------
      const baseItems = buildItemsFromRemark(Remark);
      setInvoiceItems(baseItems);

      const message = `Dear ${customer.Customer_name}, your order has been booked successfully.`;
      setWhatsAppMessage(message);
      setMobileToSend(customer.Mobile_number || "");

      setShowInvoiceModal(true);
      toast.success("Order Added");

      setTimeout(() => {
        setShowInvoiceModal(false);
        navigate("/home");
      }, 1500);

      // Optional: record advance in background
      if (isAdvanceChecked && Amount && group) {
        const amt = Number(Amount || 0);
        if (Number.isNaN(amt) || amt <= 0) {
          toast.error("Enter a valid advance amount");
          return;
        }

        const payModeCustomer = accountCustomerOptions.find(
          (opt) => opt.Customer_uuid === group
        );

        const journal = [
          { Account_id: group, Type: "Debit", Amount: amt },
          { Account_id: customer.Customer_uuid, Type: "Credit", Amount: amt },
        ];

        try {
          const txnRes = await axios.post(`/transaction/addTransaction`, {
            Description: Remark || "Advance received",
            Transaction_date: new Date().toISOString().split("T")[0],
            Total_Credit: amt,
            Total_Debit: amt,
            Payment_mode: payModeCustomer?.Customer_name || "Advance",
            Journal_entry: journal,
            Created_by: loggedInUser,
          });

          if (txnRes.data?.success) {
            setInvoiceItems((prev) => [
              ...prev,
              { Item: "Advance", Quantity: 1, Rate: amt, Amount: amt },
            ]);
            toast.success("Advance payment recorded");
          } else {
            toast.error("Transaction failed");
          }
        } catch {
          toast.error("Transaction failed");
        }
      }
    } catch (error) {
      console.error("Error during submit:", error);
      toast.error("Something went wrong");
    }
  };

  const sendMessageToAPI = async (name, phone, message) => {
    try {
      const { data: result } = await axios.post(`/usertask/send-message`, {
        mobile: phone,
        userName: name,
        type: "customer",
        message,
      });
      if (result?.error) toast.error("Failed to send message");
      else toast.success("WhatsApp message sent");
    } catch {
      toast.error("Failed to send WhatsApp");
    }
  };

  const sendWhatsApp = async () => {
    await sendMessageToAPI(Customer_name, mobileToSend, whatsAppMessage);
    setShowInvoiceModal(false);
    navigate("/home");
  };

  const stepCandidates = useMemo(
    () => taskGroups.filter((tg) => tg.Id === 1),
    [taskGroups]
  );

  const onOrderTypeChange = (_, next) => {
    if (!next) return;
    setOrderType(next);

    // Reset order-only fields when switching to Enquiry
    if (next === "Enquiry") {
      setIsAdvanceChecked(false);
      setAmount("");
      setGroup("");
      setSelectedTaskGroups([]);
    }
  };

  return (
    <>
      <InvoiceModal
        open={showInvoiceModal}
        onClose={() => {
          setShowInvoiceModal(false);
          navigate("/home");
        }}
        invoiceRef={previewRef}
        customerName={Customer_name}
        customerMobile={mobileToSend}
        items={invoiceItems}
        remark={Remark}
        order={createdOrder}
        onSendWhatsApp={sendWhatsApp}
      />

      <Dialog open fullScreen>
        <AppBar position="sticky" elevation={0}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => navigate("/home")}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>

            <Typography variant="h6" sx={{ flex: 1 }}>
              {isEnquiryOnly ? "New Enquiry" : "New Order"}
            </Typography>

            <Button
              color="inherit"
              startIcon={<AddIcon />}
              onClick={handleCustomer}
            >
              New Customer
            </Button>
          </Toolbar>
        </AppBar>

        <DialogContent sx={{ px: 0, pb: 4 }}>
          <Container maxWidth="sm">
            <Box sx={{ pt: 2 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Stack spacing={2} component="form" onSubmit={submit}>
                  {/* ✅ Top Toggle: Enquiry / Order */}
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Select Type
                    </Typography>

                    <ToggleButtonGroup
                      value={orderType}
                      exclusive
                      onChange={onOrderTypeChange}
                      fullWidth
                      sx={{
                        "& .MuiToggleButton-root": {
                          py: 1.2,
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 700,
                        },
                      }}
                    >
                      <ToggleButton value="Order">Order</ToggleButton>
                      <ToggleButton value="Enquiry">Enquiry</ToggleButton>
                    </ToggleButtonGroup>
                  </Stack>

                  <Divider />

                  {/* Customer */}
                  <Stack spacing={1}>
                    <Typography
                      variant="subtitle2"
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      <SearchIcon fontSize="small" />
                      Customer
                    </Typography>

                    {optionsLoading ? (
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="center"
                        sx={{ py: 2 }}
                      >
                        <LoadingSpinner />
                      </Stack>
                    ) : (
                      <Autocomplete
                        options={customerOptions}
                        getOptionLabel={(opt) => opt?.Customer_name || ""}
                        value={
                          customerOptions.find(
                            (c) => c.Customer_name === Customer_name
                          ) || null
                        }
                        onChange={(_, newValue) => {
                          setCustomer_Name(newValue?.Customer_name || "");
                        }}
                        inputValue={Customer_name}
                        onInputChange={(_, val) => setCustomer_Name(val)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Search by customer name"
                            size="medium"
                            fullWidth
                            InputProps={{
                              ...params.InputProps,
                              startAdornment: (
                                <InputAdornment position="start">
                                  <SearchIcon fontSize="small" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        )}
                        isOptionEqualToValue={(opt, val) =>
                          opt?.Customer_uuid === val?.Customer_uuid
                        }
                      />
                    )}
                  </Stack>

                  {/* Order Note */}
                  <Stack spacing={1}>
                    <Typography
                      variant="subtitle2"
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      <ListAltIcon fontSize="small" />
                      {isEnquiryOnly ? "Enquiry Note" : "Order Note"}
                    </Typography>

                    <TextField
                      placeholder="Item details / note"
                      value={Remark}
                      onChange={(e) => setRemark(e.target.value)}
                      fullWidth
                      multiline
                      minRows={2}
                    />
                  </Stack>

                  {/* ✅ If enquiry: hide everything below */}
                  {!isEnquiryOnly && (
                    <>
                      <Divider />

                      {/* Steps */}
                      <Stack spacing={1}>
                        <Typography variant="subtitle2">Steps</Typography>

                        <Paper
                          variant="outlined"
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 1,
                          }}
                        >
                          {stepCandidates.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              No steps available.
                            </Typography>
                          ) : (
                            stepCandidates.map((tg) => {
                              const uuid = tg.Task_group_uuid;
                              const checked = selectedTaskGroups.includes(uuid);
                              return (
                                <Button
                                  key={uuid}
                                  variant={checked ? "contained" : "outlined"}
                                  onClick={() => handleTaskGroupToggle(uuid)}
                                  sx={{
                                    borderRadius: 2,
                                    textTransform: "none",
                                    fontWeight: 700,
                                  }}
                                >
                                  {tg.Task_group_name || tg.Task_group}
                                </Button>
                              );
                            })
                          )}
                        </Paper>
                      </Stack>

                      {/* Advance */}
                      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                        <ToggleButtonGroup
                          value={isAdvanceChecked ? "yes" : "no"}
                          exclusive
                          onChange={(_, v) => {
                            if (!v) return;
                            if (v === "yes" && !isAdvanceChecked)
                              handleAdvanceCheckboxChange();
                            if (v === "no" && isAdvanceChecked)
                              handleAdvanceCheckboxChange();
                          }}
                          fullWidth
                          sx={{
                            "& .MuiToggleButton-root": {
                              py: 1.1,
                              borderRadius: 2,
                              textTransform: "none",
                              fontWeight: 700,
                            },
                          }}
                        >
                          <ToggleButton value="no">No Advance</ToggleButton>
                          <ToggleButton value="yes">Advance</ToggleButton>
                        </ToggleButtonGroup>

                        {isAdvanceChecked && (
                          <Stack spacing={2} sx={{ mt: 2 }}>
                            <TextField
                              label="Amount"
                              type="number"
                              value={Amount}
                              onChange={(e) => setAmount(e.target.value)}
                              fullWidth
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <PaymentsIcon fontSize="small" />
                                  </InputAdornment>
                                ),
                              }}
                            />

                            <FormControl fullWidth>
                              <InputLabel id="payment-mode-label">
                                Payment Mode
                              </InputLabel>
                              <Select
                                labelId="payment-mode-label"
                                value={group}
                                label="Payment Mode"
                                onChange={(e) => setGroup(e.target.value)}
                              >
                                <MenuItem value="">
                                  <em>Select Payment</em>
                                </MenuItem>
                                {accountCustomerOptions.map((c, i) => (
                                  <MenuItem key={i} value={c.Customer_uuid}>
                                    {c.Customer_name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Stack>
                        )}
                      </Paper>
                    </>
                  )}

                  {/* Submit */}
                  <Divider />

                  <Stack spacing={1}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={!canSubmit || optionsLoading}
                      startIcon={<SendIcon />}
                      sx={{
                        borderRadius: 2,
                        py: 1.2,
                        textTransform: "none",
                        fontWeight: 800,
                      }}
                    >
                      {isEnquiryOnly ? "Save Enquiry" : "Submit Order"}
                    </Button>

                    {optionsLoading && (
                      <Stack direction="row" justifyContent="center">
                        <CircularProgress size={22} />
                      </Stack>
                    )}
                  </Stack>
                </Stack>
              </Paper>

              <Box sx={{ height: 24 }} />
            </Box>
          </Container>
        </DialogContent>
      </Dialog>

      {/* ✅ FIX: show AddCustomer ABOVE the fullscreen dialog */}
      <Dialog
        open={showCustomerModal}
        onClose={exitModal}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
        sx={{ zIndex: (theme) => theme.zIndex.modal + 2 }}
      >
        <DialogContent sx={{ p: 0 }}>
          <AddCustomer onClose={exitModal} />
        </DialogContent>
      </Dialog>
    </>
  );
}
