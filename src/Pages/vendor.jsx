import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import PaidRoundedIcon from '@mui/icons-material/PaidRounded';
import PrecisionManufacturingRoundedIcon from '@mui/icons-material/PrecisionManufacturingRounded';
import StoreRoundedIcon from '@mui/icons-material/StoreRounded';
import {
  createSimpleVendorPaymentEntry,
  createSimpleVendorWorkEntry,
  createVendorMaster,
  fetchVendorSimpleWorkspace,
} from '../services/vendorService';

const vendorInitial = {
  vendor_name: '',
  mobile_number: '',
  vendor_type: 'mixed',
};

const workInitial = {
  order_uuid: '',
  vendor_uuid: '',
  process: 'printing',
  material_source: 'own',
  input_item_name: '',
  output_item_name: '',
  input_qty: '',
  output_qty: '',
  amount: '',
  advance_amount: '',
  status: 'draft',
  notes: '',
};

const paymentInitial = {
  vendor_uuid: '',
  order_uuid: '',
  amount: '',
  narration: '',
};

const currency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const StatCard = ({ icon, title, value, helper }) => (
  <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, height: '100%' }}>
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box sx={{ color: 'primary.main' }}>{icon}</Box>
      <Box>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h5" fontWeight={800}>
          {value}
        </Typography>
        {helper ? (
          <Typography variant="caption" color="text.secondary">
            {helper}
          </Typography>
        ) : null}
      </Box>
    </Stack>
  </Paper>
);

export default function VendorPage() {
  const [tab, setTab] = useState('work');
  const [workspace, setWorkspace] = useState({
    vendors: [],
    orders: [],
    recentJobs: [],
    recentLedger: [],
    summary: {},
  });
  const [vendorForm, setVendorForm] = useState(vendorInitial);
  const [workForm, setWorkForm] = useState(workInitial);
  const [paymentForm, setPaymentForm] = useState(paymentInitial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const orderOptions = useMemo(
    () =>
      (workspace.orders || []).map((order) => ({
        value: order.Order_uuid,
        label: `#${order.Order_Number} · ${(order.Items || []).map((item) => item.Item).join(', ') || 'No items'}`,
      })),
    [workspace.orders]
  );

  const vendorOptions = useMemo(
    () =>
      (workspace.vendors || []).map((vendor) => ({
        value: vendor.Vendor_uuid,
        label: vendor.Vendor_name,
      })),
    [workspace.vendors]
  );

  async function loadWorkspace() {
    try {
      const data = await fetchVendorSimpleWorkspace();
      setWorkspace(data || { vendors: [], orders: [], recentJobs: [], recentLedger: [], summary: {} });
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load vendor workspace.');
    }
  }

  useEffect(() => {
    loadWorkspace();
  }, []);

  async function handleVendorSave() {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await createVendorMaster({
        vendor_name: vendorForm.vendor_name,
        mobile_number: vendorForm.mobile_number,
        vendor_type: vendorForm.vendor_type,
        active: true,
      });
      setVendorForm(vendorInitial);
      setMessage('Vendor created successfully.');
      await loadWorkspace();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create vendor.');
    } finally {
      setLoading(false);
    }
  }

  async function handleWorkSave() {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await createSimpleVendorWorkEntry({
        ...workForm,
        input_qty: Number(workForm.input_qty || 0),
        output_qty: Number(workForm.output_qty || 0),
        amount: Number(workForm.amount || 0),
        advance_amount: Number(workForm.advance_amount || 0),
      });
      setWorkForm(workInitial);
      setMessage('Vendor work entry saved. Job, ledger and stock rows created automatically.');
      await loadWorkspace();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save vendor work entry.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePaymentSave() {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await createSimpleVendorPaymentEntry({
        ...paymentForm,
        amount: Number(paymentForm.amount || 0),
      });
      setPaymentForm(paymentInitial);
      setMessage('Vendor payment saved successfully.');
      await loadWorkspace();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save vendor payment.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h4" fontWeight={800}>
          Vendor accounting
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Simple daily flow: create vendor, save work entry, save payment. System auto-manages job, ledger and stock rows in background.
        </Typography>
      </Box>

      {message ? <Alert severity="success">{message}</Alert> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <StatCard
            icon={<StoreRoundedIcon />}
            title="Vendors"
            value={workspace.summary?.vendorCount || 0}
            helper="Active vendors available for work"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            icon={<PrecisionManufacturingRoundedIcon />}
            title="Vendor work entries"
            value={workspace.summary?.jobCount || 0}
            helper={currency(workspace.summary?.totalJobCost || 0)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            icon={<PaidRoundedIcon />}
            title="Vendor payable / advance"
            value={`${currency(workspace.summary?.totalVendorPayable || 0)} / ${currency(workspace.summary?.totalVendorAdvance || 0)}`}
            helper="Payable / advance"
          />
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" scrollButtons="auto">
          <Tab value="work" label="Vendor Work Entry" />
          <Tab value="payment" label="Vendor Payment" />
          <Tab value="vendor" label="Quick Vendor Create" />
          <Tab value="recent" label="Recent Activity" />
        </Tabs>

        <Box sx={{ p: 2.5 }}>
          {tab === 'work' ? (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Order"
                  value={workForm.order_uuid}
                  onChange={(e) => setWorkForm((prev) => ({ ...prev, order_uuid: e.target.value }))}
                >
                  <MenuItem value="">Select order</MenuItem>
                  {orderOptions.map((order) => (
                    <MenuItem key={order.value} value={order.value}>
                      {order.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Vendor"
                  value={workForm.vendor_uuid}
                  onChange={(e) => setWorkForm((prev) => ({ ...prev, vendor_uuid: e.target.value }))}
                >
                  <MenuItem value="">Select vendor</MenuItem>
                  {vendorOptions.map((vendor) => (
                    <MenuItem key={vendor.value} value={vendor.value}>
                      {vendor.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Process"
                  value={workForm.process}
                  onChange={(e) => setWorkForm((prev) => ({ ...prev, process: e.target.value }))}
                >
                  {['purchase', 'printing', 'lamination', 'cutting', 'packing', 'other'].map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Material Source"
                  value={workForm.material_source}
                  onChange={(e) => setWorkForm((prev) => ({ ...prev, material_source: e.target.value }))}
                >
                  <MenuItem value="own">Our material</MenuItem>
                  <MenuItem value="vendor">Vendor material</MenuItem>
                  <MenuItem value="mixed">Mixed</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Status"
                  value={workForm.status}
                  onChange={(e) => setWorkForm((prev) => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="sent">Sent / In progress</MenuItem>
                  <MenuItem value="completed">Completed / Received</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Input Item"
                  value={workForm.input_item_name}
                  onChange={(e) => setWorkForm((prev) => ({ ...prev, input_item_name: e.target.value }))}
                  placeholder="Ex. Full Sheet"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Output Item"
                  value={workForm.output_item_name}
                  onChange={(e) => setWorkForm((prev) => ({ ...prev, output_item_name: e.target.value }))}
                  placeholder="Ex. Wedding Card"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Input Qty"
                  value={workForm.input_qty}
                  onChange={(e) => setWorkForm((prev) => ({ ...prev, input_qty: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Output Qty"
                  value={workForm.output_qty}
                  onChange={(e) => setWorkForm((prev) => ({ ...prev, output_qty: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Work Amount"
                  value={workForm.amount}
                  onChange={(e) => setWorkForm((prev) => ({ ...prev, amount: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Advance Paid"
                  value={workForm.advance_amount}
                  onChange={(e) => setWorkForm((prev) => ({ ...prev, advance_amount: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  label="Notes"
                  value={workForm.notes}
                  onChange={(e) => setWorkForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  onClick={handleWorkSave}
                  disabled={loading || !workForm.vendor_uuid || !workForm.process || !workForm.amount}
                >
                  Save Vendor Work Entry
                </Button>
              </Grid>
            </Grid>
          ) : null}

          {tab === 'payment' ? (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Vendor"
                  value={paymentForm.vendor_uuid}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, vendor_uuid: e.target.value }))}
                >
                  <MenuItem value="">Select vendor</MenuItem>
                  {vendorOptions.map((vendor) => (
                    <MenuItem key={vendor.value} value={vendor.value}>
                      {vendor.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Order (optional)"
                  value={paymentForm.order_uuid}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, order_uuid: e.target.value }))}
                >
                  <MenuItem value="">No order link</MenuItem>
                  {orderOptions.map((order) => (
                    <MenuItem key={order.value} value={order.value}>
                      {order.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Amount"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Narration"
                  value={paymentForm.narration}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, narration: e.target.value }))}
                  placeholder="Cash paid / UPI paid / balance settled"
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={<PaidRoundedIcon />}
                  onClick={handlePaymentSave}
                  disabled={loading || !paymentForm.vendor_uuid || !paymentForm.amount}
                >
                  Save Vendor Payment
                </Button>
              </Grid>
            </Grid>
          ) : null}

          {tab === 'vendor' ? (
            <Grid container spacing={2}>
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  label="Vendor Name"
                  value={vendorForm.vendor_name}
                  onChange={(e) => setVendorForm((prev) => ({ ...prev, vendor_name: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Mobile Number"
                  value={vendorForm.mobile_number}
                  onChange={(e) => setVendorForm((prev) => ({ ...prev, mobile_number: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Vendor Type"
                  value={vendorForm.vendor_type}
                  onChange={(e) => setVendorForm((prev) => ({ ...prev, vendor_type: e.target.value }))}
                >
                  <MenuItem value="material">Material</MenuItem>
                  <MenuItem value="jobwork">Jobwork</MenuItem>
                  <MenuItem value="mixed">Mixed</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={<StoreRoundedIcon />}
                  onClick={handleVendorSave}
                  disabled={loading || !vendorForm.vendor_name}
                >
                  Create Vendor
                </Button>
              </Grid>
            </Grid>
          ) : null}

          {tab === 'recent' ? (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Recent work entries
                  </Typography>
                  <Stack spacing={1.25} sx={{ mt: 2 }}>
                    {(workspace.recentJobs || []).length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No work entries yet.
                      </Typography>
                    ) : (
                      workspace.recentJobs.map((job) => (
                        <Paper key={job.job_uuid} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                          <Typography variant="body2" fontWeight={700}>
                            #{job.job_number} · {job.vendor_name || 'Vendor'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {job.job_type} · {job.status} · {currency(job.totalCost || 0)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(job.inputItems || []).map((item) => item.itemName).join(', ') || 'No input'} → {(job.outputItems || []).map((item) => item.itemName).join(', ') || 'No output'}
                          </Typography>
                        </Paper>
                      ))
                    )}
                  </Stack>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Recent ledger activity
                  </Typography>
                  <Stack spacing={1.25} sx={{ mt: 2 }}>
                    {(workspace.recentLedger || []).length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No ledger activity yet.
                      </Typography>
                    ) : (
                      workspace.recentLedger.map((row) => (
                        <Paper key={row.entry_uuid} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                          <Typography variant="body2" fontWeight={700}>
                            {row.vendor_name || 'Vendor'} · {row.entry_type}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {currency(row.amount || 0)} · {row.dr_cr === 'dr' ? 'Debit' : 'Credit'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.narration || 'No narration'}
                          </Typography>
                        </Paper>
                      ))
                    )}
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          ) : null}
        </Box>
      </Paper>
    </Stack>
  );
}