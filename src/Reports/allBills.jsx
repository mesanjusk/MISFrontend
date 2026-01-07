import React, { useState, useEffect, useMemo, useCallback } from "react";
import { fetchBillList } from "../services/orderService";
import { fetchCustomers } from "../services/customerService";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

import UpdateDelivery from "../Pages/updateDelivery";
import { LoadingSpinner } from "../Components";
import InvoiceModal from "../Components/InvoiceModal";

/* ✅ MUI (UI only) */
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  Paper,
  Stack,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Divider,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Skeleton,
  Tooltip,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import GridOnIcon from "@mui/icons-material/GridOn";
import CloseIcon from "@mui/icons-material/Close";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import TodayIcon from "@mui/icons-material/Today";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import PendingActionsIcon from "@mui/icons-material/PendingActions";

export default function AllBills() {
  // 🔧 Central API base (env -> vite -> CRA -> localhost)
  const API_BASE = useMemo(() => {
    const raw =
      (typeof import.meta !== "undefined" ? import.meta.env.VITE_API_BASE : "") ||
      process.env.REACT_APP_API ||
      "http://localhost:10000";
    return String(raw).replace(/\/$/, "");
  }, []);

  const [orders, setOrders] = useState([]);
  const [searchOrder, setSearchOrder] = useState("");
  const [filter, setFilter] = useState(""); // "", "delivered", "design", "print", etc.
  const [customers, setCustomers] = useState({});
  const [loading, setLoading] = useState(true);

  // ✅ UpdateDelivery modal state (FIXED)
  const [editOpen, setEditOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // ✅ Invoice modal state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  /* ✅ UI-only paid state (NO backend change) */
  const [paidMap, setPaidMap] = useState(() => {
    try {
      const raw = localStorage.getItem("bills_paid_map");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("bills_paid_map", JSON.stringify(paidMap || {}));
    } catch {
      // ignore storage errors
    }
  }, [paidMap]);

  const formatDateDDMMYYYY = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const formatINR = (value) => {
    const num = Number(value || 0);
    try {
      return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(num);
    } catch {
      return String(num);
    }
  };

  // ✅ Robust number parsing (handles "1,099", "₹1099", etc.)
  const toNumber = (v) => {
    if (v === null || v === undefined) return 0;
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;
    const s = String(v).replace(/[₹,\s]/g, "").trim();
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  };

  const resolveQty = (it) =>
    toNumber(it?.Qty ?? it?.Quantity ?? it?.qty ?? it?.quantity ?? it?.QTY ?? 0);

  const resolveRate = (it) =>
    toNumber(it?.Rate ?? it?.Price ?? it?.rate ?? it?.price ?? it?.RATE ?? 0);

  const resolveAmount = (it) => {
    const direct =
      it?.Amount ??
      it?.amount ??
      it?.Amt ??
      it?.amt ??
      it?.BillAmount ??
      it?.billAmount ??
      it?.Bill_Amount ??
      it?.FinalAmount ??
      it?.finalAmount ??
      it?.Final_Amount ??
      it?.TotalAmount ??
      it?.totalAmount ??
      it?.Total_Amount ??
      it?.NetAmount ??
      it?.netAmount ??
      it?.Net_Amount;

    const n = toNumber(direct);
    if (n > 0) return n;

    const q = resolveQty(it);
    const r = resolveRate(it);
    const calc = q * r;
    return Number.isFinite(calc) ? calc : 0;
  };

  const hasBillableAmount = useCallback(
    (items) => Array.isArray(items) && items.some((it) => resolveAmount(it) > 0),
    []
  );

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      try {
        const [ordersRes, customersRes] = await Promise.all([fetchBillList(), fetchCustomers()]);

        if (!isMounted) return;

        const orderRows = ordersRes?.data?.success ? ordersRes.data.result ?? [] : [];
        const custRows = customersRes?.data?.success ? customersRes.data.result ?? [] : [];

        const customerMap = Array.isArray(custRows)
          ? custRows.reduce((acc, c) => {
              if (c.Customer_uuid && c.Customer_name) acc[c.Customer_uuid] = c.Customer_name;
              return acc;
            }, {})
          : {};

        setCustomers(customerMap);
        setOrders(Array.isArray(orderRows) ? orderRows : []);
      } catch (err) {
        console.error("Error fetching bills data:", err?.message || err);
        setCustomers({});
        setOrders([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [API_BASE]);

  const getHighestStatus = (statusArr) => {
    const list = Array.isArray(statusArr) ? statusArr : [];
    if (list.length === 0) return {};
    return list.reduce((prev, curr) => {
      const prevNum = Number(prev?.Status_number || 0);
      const currNum = Number(curr?.Status_number || 0);
      return currNum > prevNum ? curr : prev;
    }, list[0]);
  };

  // 🔁 Local state upsert helpers (no reload)
  const upsertOrderPatch = useCallback(
    (orderId, patch) => {
      if (!orderId || !patch) return;

      if (patch.Items && !hasBillableAmount(patch.Items)) {
        setOrders((prev) => prev.filter((o) => (o.Order_uuid || o._id) !== orderId));

        if (selectedOrder && (selectedOrder.Order_uuid || selectedOrder._id) === orderId) {
          setEditOpen(false);
        }

        if (invoiceOrder && (invoiceOrder.Order_uuid || invoiceOrder._id) === orderId) {
          setShowInvoiceModal(false);
          setInvoiceOrder(null);
        }

        // cleanup paid state as well (UI only)
        setPaidMap((prev) => {
          const copy = { ...(prev || {}) };
          delete copy[orderId];
          return copy;
        });

        return;
      }

      setOrders((prev) =>
        prev.map((o) => ((o.Order_uuid || o._id) === orderId ? { ...o, ...patch } : o))
      );

      if (selectedOrder && (selectedOrder.Order_uuid || selectedOrder._id) === orderId) {
        setSelectedOrder((s) => (s ? { ...s, ...patch } : s));
      }

      if (invoiceOrder && (invoiceOrder.Order_uuid || invoiceOrder._id) === orderId) {
        setInvoiceOrder((s) => (s ? { ...s, ...patch } : s));
      }
    },
    [hasBillableAmount, selectedOrder, invoiceOrder]
  );

  const upsertOrderReplace = useCallback(
    (nextOrder) => {
      if (!nextOrder) return;
      const key = nextOrder.Order_uuid || nextOrder._id;

      if (!hasBillableAmount(nextOrder.Items)) {
        setOrders((prev) => prev.filter((o) => (o.Order_uuid || o._id) !== key));

        if (selectedOrder && (selectedOrder.Order_uuid || selectedOrder._id) === key) {
          setEditOpen(false);
        }

        if (invoiceOrder && (invoiceOrder.Order_uuid || invoiceOrder._id) === key) {
          setShowInvoiceModal(false);
          setInvoiceOrder(null);
        }

        setPaidMap((prev) => {
          const copy = { ...(prev || {}) };
          delete copy[key];
          return copy;
        });

        return;
      }

      setOrders((prev) => {
        const idx = prev.findIndex((o) => (o.Order_uuid || o._id) === key);
        if (idx === -1) return [nextOrder, ...prev];
        const copy = prev.slice();
        copy[idx] = { ...prev[idx], ...nextOrder };
        return copy;
      });

      if (selectedOrder && (selectedOrder.Order_uuid || selectedOrder._id) === key) {
        setSelectedOrder((s) => (s ? { ...s, ...nextOrder } : s));
      }

      if (invoiceOrder && (invoiceOrder.Order_uuid || invoiceOrder._id) === key) {
        setInvoiceOrder((s) => (s ? { ...s, ...nextOrder } : s));
      }
    },
    [hasBillableAmount, selectedOrder, invoiceOrder]
  );

  const getFirstRemark = (order) => {
    if (!Array.isArray(order?.Items) || order.Items.length === 0) return "";
    return String(order.Items[0]?.Remark || "");
  };

  // 🔎 Derived filtered list + bill total
  const filteredOrders = useMemo(() => {
    return orders
      .map((order) => {
        const highestStatusTask = getHighestStatus(order.Status);
        const items = Array.isArray(order?.Items) ? order.Items : [];
        const billTotal = items.reduce((sum, it) => sum + resolveAmount(it), 0);

        return {
          ...order,
          highestStatusTask,
          Customer_name: customers[order.Customer_uuid] || "Unknown",
          billTotal,
        };
      })
      .filter((order) => {
        if (!hasBillableAmount(order.Items)) return false;

        const name = (order.Customer_name || "").toLowerCase();
        const matchesSearch = name.includes(searchOrder.toLowerCase());

        const task = (order.highestStatusTask?.Task || "").toLowerCase().trim();
        const filterValue = (filter || "").toLowerCase().trim();
        const matchesFilter = filterValue ? task === filterValue : true;

        return matchesSearch && matchesFilter;
      });
  }, [orders, customers, hasBillableAmount, searchOrder, filter]);

  const totals = useMemo(() => {
    const count = filteredOrders.length;
    const sum = filteredOrders.reduce((acc, o) => acc + toNumber(o.billTotal), 0);
    return { count, sum };
  }, [filteredOrders]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Bills Report", 14, 15);
    doc.autoTable({
      head: [
        [
          "Order Number",
          "Customer Name",
          "Created Date",
          "Remark",
          "Delivery Date",
          "Assigned",
          "Highest Status Task",
        ],
      ],
      body: filteredOrders.map((order) => [
        order.Order_Number || "",
        order.Customer_name || "",
        formatDateDDMMYYYY(order.createdAt),
        getFirstRemark(order),
        formatDateDDMMYYYY(order.highestStatusTask?.Delivery_Date),
        order.highestStatusTask?.Assigned || "",
        order.highestStatusTask?.Task || "",
      ]),
      startY: 20,
    });
    doc.save("bills_report.pdf");
  };

  const exportExcel = () => {
    const worksheetData = filteredOrders.map((order) => ({
      "Order Number": order.Order_Number || "",
      "Customer Name": order.Customer_name || "",
      "Created Date": formatDateDDMMYYYY(order.createdAt),
      Remark: getFirstRemark(order),
      "Delivery Date": formatDateDDMMYYYY(order.highestStatusTask?.Delivery_Date),
      Assigned: order.highestStatusTask?.Assigned || "",
      "Highest Status Task": order.highestStatusTask?.Task || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bills");
    XLSX.writeFile(workbook, "bills_report.xlsx");
  };

  // ✅ FIXED: opening edit modal
  const handleEditClick = (order) => {
    const id = order._id || order.Order_id || null;
    if (!id) {
      alert("⚠️ Invalid order ID. Cannot open edit modal.");
      return;
    }
    setSelectedOrder({ ...order, _id: id });
    setEditOpen(true);
  };

  // ✅ FIXED: closing edit modal (do NOT set selectedOrder null here)
  const closeEditModal = () => {
    setEditOpen(false);
  };

  // ✅ Invoice modal helpers
  const openInvoice = (order) => {
    setInvoiceOrder(order);
    setShowInvoiceModal(true);
  };

  const closeInvoice = () => {
    setShowInvoiceModal(false);
    setInvoiceOrder(null);
  };

  // ✅ Build items for InvoicePreview: provide BOTH styles of keys
  const buildInvoiceItems = (order) => {
    const items = Array.isArray(order?.Items) ? order.Items : [];

    return items
      .map((it, idx) => {
        const qty = resolveQty(it);
        const rate = resolveRate(it);
        const amount = resolveAmount(it);
        const name = String(it?.Item_name || it?.Name || it?.Product_name || it?.Item || "Item");

        return {
          // our standard keys
          sr: idx + 1,
          name,
          qty,
          rate,
          amount,
          remark: String(it?.Remark || ""),

          // compatibility keys
          Item: name,
          Qty: qty,
          Rate: rate,
          Amt: amount,
          Amount: amount,
        };
      })
      .filter((it) => toNumber(it?.amount ?? it?.Amt ?? it?.Amount) > 0);
  };

  const sendInvoiceOnWhatsApp = (invoiceUrl, order) => {
    const orderNo = order?.Order_Number || "";
    const party = order?.Customer_name || "Customer";
    const msg = `Invoice for Order #${orderNo}\nParty: ${party}\n\n${invoiceUrl}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const statusChip = (task) => {
    const t = String(task || "").toLowerCase().trim();
    const label = task || "—";
    if (!t) return <Chip size="small" label={label} variant="outlined" />;
    if (t === "delivered") return <Chip size="small" label={label} color="success" />;
    if (t === "design") return <Chip size="small" label={label} color="info" />;
    if (t === "print") return <Chip size="small" label={label} color="warning" />;
    return <Chip size="small" label={label} variant="outlined" />;
  };

  /* ✅ PAID helpers (UI-only) */
  const getOrderKey = (order) => order?.Order_uuid || order?._id || order?.Order_id || "";
  const isPaid = (order) => Boolean(paidMap?.[getOrderKey(order)]);
  const togglePaid = (order) => {
    const key = getOrderKey(order);
    if (!key) return;
    setPaidMap((prev) => ({ ...(prev || {}), [key]: !Boolean(prev?.[key]) }));
  };

  return (
    <>
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <AppBar position="sticky" elevation={0}>
          <Toolbar>
            <ReceiptLongIcon sx={{ mr: 1 }} />
            <Typography variant="h6" sx={{ flex: 1 }}>
              Bills Report
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {totals.count} bills • ₹{formatINR(totals.sum)}
            </Typography>
          </Toolbar>
          {loading && <LinearProgress />}
        </AppBar>

        <Container maxWidth={false} sx={{ maxWidth: 2200, py: 2 }}>
          {/* Filters + Exports */}
          <Paper variant="outlined" sx={{ borderRadius: 3, p: 2, mb: 2 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              alignItems={{ xs: "stretch", md: "center" }}
            >
              <TextField
                value={searchOrder}
                onChange={(e) => setSearchOrder(e.target.value)}
                placeholder="Search by customer name"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />

              <FormControl sx={{ minWidth: { xs: "100%", md: 220 } }}>
                <InputLabel id="filter-label">Filter by task</InputLabel>
                <Select
                  labelId="filter-label"
                  value={filter}
                  label="Filter by task"
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="delivered"></MenuItem>
                  <MenuItem value="design">Design</MenuItem>
                  <MenuItem value="print">Print</MenuItem>
                </Select>
              </FormControl>

              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Tooltip title="Export as PDF">
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<PictureAsPdfIcon />}
                    onClick={exportPDF}
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 800 }}
                  >
                    PDF
                  </Button>
                </Tooltip>

                <Tooltip title="Export as Excel">
                  <Button
                    variant="contained"
                    startIcon={<GridOnIcon />}
                    onClick={exportExcel}
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 800 }}
                  >
                    Excel
                  </Button>
                </Tooltip>
              </Stack>
            </Stack>
          </Paper>

          {/* Content */}
          <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 1.5, sm: 2 } }}>
            {loading ? (
              <Grid container spacing={1.5}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <Grid key={i} item xs={12} sm={6} md={4} lg={3} xl={2}>
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Skeleton width="55%" />
                        <Skeleton width="85%" />
                        <Skeleton width="45%" />
                        <Skeleton width="35%" />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
                <Box sx={{ width: "100%", display: "flex", justifyContent: "center", py: 2 }}>
                  <LoadingSpinner size={40} />
                </Box>
              </Grid>
            ) : filteredOrders.length === 0 ? (
              <Alert severity="info" variant="outlined" sx={{ borderRadius: 3 }}>
                No billed orders found.
              </Alert>
            ) : (
              <Grid container spacing={1.5}>
                {filteredOrders.map((order) => {
                  const key =
                    order._id || order.Order_id || order.Order_uuid || `o-${order.Order_Number}`;

                  const deliveryDate = formatDateDDMMYYYY(order.highestStatusTask?.Delivery_Date);
                  const paid = isPaid(order);

                  return (
                    <Grid key={key} item xs={12} sm={6} md={4} lg={3} xl={2}>
                      <Card
                        variant="outlined"
                        sx={{
                          borderRadius: 2,
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          position: "relative",
                        }}
                      >
                        {/* ✅ Paid toggle button (top-right) */}
                        <Tooltip title={paid ? "Mark as unpaid" : "Mark bill as paid"}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePaid(order);
                            }}
                            sx={{
                              position: "absolute",
                              top: 6,
                              right: 6,
                              zIndex: 2,
                              bgcolor: "background.paper",
                              border: "1px solid",
                              borderColor: "divider",
                              "&:hover": { bgcolor: "background.default" },
                            }}
                            aria-label="toggle paid"
                          >
                            {paid ? (
                              <DoneAllIcon fontSize="small" color="success" />
                            ) : (
                              <PendingActionsIcon fontSize="small" color="warning" />
                            )}
                          </IconButton>
                        </Tooltip>

                        <CardActionArea onClick={() => handleEditClick(order)} sx={{ flex: 1 }}>
                          <CardContent>
                            <Stack spacing={0.8}>
                              <Stack
                                direction="row"
                                alignItems="center"
                                justifyContent="space-between"
                                spacing={1}
                              >
                                <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                                  #{order.Order_Number}
                                </Typography>
                                {statusChip(order.highestStatusTask?.Task)}
                              </Stack>

                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 800 }}
                                noWrap
                                title={order.Customer_name}
                              >
                                {order.Customer_name}
                              </Typography>

                              <Stack direction="row" spacing={1} alignItems="center">
                                <TodayIcon fontSize="small" />
                                <Typography variant="caption" color="text.secondary">
                                  {deliveryDate || "—"}
                                </Typography>
                              </Stack>

                              <Divider sx={{ my: 0.5 }} />

                              <Stack
                                direction="row"
                                alignItems="center"
                                justifyContent="space-between"
                              >
                                <Typography variant="caption" color="text.secondary">
                                  Total
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 900 }}>
                                  ₹{formatINR(order.billTotal)}
                                </Typography>
                              </Stack>

                              {/* Optional: small paid label */}
                              <Stack direction="row" justifyContent="flex-end">
                                <Chip
                                  size="small"
                                  label={paid ? "Paid" : "Unpaid"}
                                  color={paid ? "success" : "warning"}
                                  variant={paid ? "filled" : "outlined"}
                                  sx={{ borderRadius: 2, fontWeight: 800 }}
                                />
                              </Stack>
                            </Stack>
                          </CardContent>
                        </CardActionArea>

                        <Divider />

                        <Box sx={{ p: 1.25 }}>
                          {/* ✅ Bill button: Green if paid, Amber if unpaid */}
                          <Button
                            fullWidth
                            variant="contained"
                            color={paid ? "success" : "warning"}
                            startIcon={<ReceiptLongIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              openInvoice(order);
                            }}
                            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900 }}
                          >
                            Bill
                          </Button>
                        </Box>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Paper>
        </Container>
      </Box>

      {/* ✅ UpdateDelivery Modal (MUI Dialog) — FIXED */}
      <Dialog
        open={editOpen}
        onClose={closeEditModal}
        fullWidth
        maxWidth="lg"
        TransitionProps={{
          onExited: () => {
            // IMPORTANT: clear after the dialog exit animation completes
            setSelectedOrder(null);
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          Update Delivery
          <Box sx={{ flex: 1 }} />
          <IconButton onClick={closeEditModal}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {/* ✅ SAFE: UpdateDelivery never receives null */}
          <UpdateDelivery
            mode="edit"
            order={selectedOrder || {}}
            onClose={closeEditModal}
            onOrderPatched={(orderId, patch) => upsertOrderPatch(orderId, patch)}
            onOrderReplaced={(full) => upsertOrderReplace(full)}
          />
        </DialogContent>
      </Dialog>

      {/* ✅ Invoice Modal (kept as-is for functionality) */}
      <InvoiceModal
        open={showInvoiceModal}
        onClose={closeInvoice}
        orderNumber={invoiceOrder?.Order_Number || ""}
        partyName={invoiceOrder?.Customer_name || "Customer"}
        items={buildInvoiceItems(invoiceOrder)}
        onWhatsApp={(url) => sendInvoiceOnWhatsApp(url, invoiceOrder)}
      />
    </>
  );
}
