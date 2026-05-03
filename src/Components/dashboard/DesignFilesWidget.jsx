/**
 * DesignFilesWidget.jsx
 *
 * Dashboard widget — shows Drive files from the designer's Daily folder
 * with their current stage, and lets office team do the one-time
 * order link in a single click.
 *
 * Drop this inside your Dashboard.jsx where you want the section to appear.
 *
 * Usage:
 *   import DesignFilesWidget from '../Components/dashboard/DesignFilesWidget';
 *   <DesignFilesWidget />
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import LinkOffRoundedIcon from '@mui/icons-material/LinkOffRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import axios from '../../apiClient';

// ─── Stage colour mapping ────────────────────────────────────────────────────
const STAGE_COLORS = {
  1: { bg: '#E3F2FD', color: '#0D47A1', label: 'New Design' },
  2: { bg: '#F3E5F5', color: '#4A148C', label: 'Old Design' },
  3: { bg: '#FFF8E1', color: '#E65100', label: 'Approval' },
  4: { bg: '#E8F5E9', color: '#1B5E20', label: 'Ready for Print' },
  5: { bg: '#FBE9E7', color: '#BF360C', label: 'Hold' },
  6: { bg: '#E0F2F1', color: '#004D40', label: 'Final' },
  7: { bg: '#FCE4EC', color: '#880E4F', label: 'Printing' },
};

function StageChip({ stageNumber, stageLabel }) {
  const theme = STAGE_COLORS[stageNumber] || { bg: '#F5F5F5', color: '#424242', label: stageLabel };
  return (
    <Chip
      label={stageLabel || theme.label}
      size="small"
      sx={{
        bgcolor: theme.bg,
        color: theme.color,
        fontWeight: 600,
        fontSize: 10,
        height: 20,
        '& .MuiChip-label': { px: 1 },
      }}
    />
  );
}

// ─── Link Dialog ─────────────────────────────────────────────────────────────
function LinkDialog({ open, file, onClose, onLinked }) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setQuery('');
      setOptions([]);
      setSelected(null);
      setError('');
    }
  }, [open]);

  // Search orders as user types
  useEffect(() => {
    if (!query || query.length < 2) { setOptions([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        // Try order number first, then customer name search
        const isNum = /^\d+$/.test(query.trim());
        const params = isNum
          ? { orderNumber: query.trim() }
          : { customerName: query.trim(), limit: 15 };
        const res = await axios.get('/api/orders', { params });
        const orders = res.data?.orders || res.data?.data || res.data || [];
        setOptions(
          orders.slice(0, 20).map((o) => ({
            label: `#${o.Order_Number} — ${o.Customer_name || o.customerName || o.Customer_uuid || 'Unknown'}`,
            orderUuid: o.Order_uuid,
            orderNumber: o.Order_Number,
            customerName: o.Customer_name || o.customerName || '',
          }))
        );
      } catch {
        setOptions([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, [query]);

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      await axios.post('/api/design-files/link', {
        driveFileId: file.fileId,
        fileName: file.fileName,
        stageNumber: file.stageNumber,
        stageLabel: file.stageLabel,
        orderUuid: selected.orderUuid,
        customerName: selected.customerName,
      });
      onLinked();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to link. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="subtitle1" fontWeight={600}>Link file to order</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, wordBreak: 'break-all' }}>
          {file?.fileName}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          {file && (
            <Box sx={{ bgcolor: 'action.hover', borderRadius: 1.5, p: 1.5 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <FolderOpenRoundedIcon fontSize="small" color="action" />
                <StageChip stageNumber={file.stageNumber} stageLabel={file.stageLabel} />
                <Typography variant="caption" color="text.secondary">current stage</Typography>
              </Stack>
            </Box>
          )}

          <Autocomplete
            freeSolo={false}
            options={options}
            value={selected}
            onChange={(_, val) => setSelected(val)}
            inputValue={query}
            onInputChange={(_, val) => setQuery(val)}
            loading={searching}
            noOptionsText={query.length < 2 ? 'Type order number or customer name…' : 'No orders found'}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search order"
                placeholder="Type order # or customer name"
                size="small"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {searching ? <CircularProgress size={14} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          {error && <Alert severity="error" sx={{ py: 0.5 }}>{error}</Alert>}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} size="small" color="inherit">Cancel</Button>
        <Button
          variant="contained"
          size="small"
          disabled={!selected || saving}
          onClick={handleSave}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <LinkRoundedIcon />}
        >
          Link to order
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── File Row ────────────────────────────────────────────────────────────────
function FileRow({ file, onLinkClick, onUnlink }) {
  const linked = file.linked;
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.5}
      sx={{
        py: 1,
        px: 1.5,
        borderRadius: 1.5,
        bgcolor: linked ? 'transparent' : 'warning.50',
        border: '0.5px solid',
        borderColor: linked ? 'divider' : 'warning.200',
        '&:hover': { bgcolor: 'action.hover' },
        transition: 'background 0.15s',
      }}
    >
      {/* Status icon */}
      <Avatar sx={{ width: 28, height: 28, bgcolor: linked ? 'success.100' : 'warning.100' }}>
        {linked
          ? <CheckCircleRoundedIcon sx={{ fontSize: 16, color: 'success.700' }} />
          : <WarningAmberRoundedIcon sx={{ fontSize: 16, color: 'warning.700' }} />}
      </Avatar>

      {/* File name */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          fontWeight={500}
          sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          title={file.fileName}
        >
          {file.fileName}
        </Typography>
        {linked && (
          <Typography variant="caption" color="text.secondary">
            Order #{file.orderNumber} · {file.customerName || '—'}
          </Typography>
        )}
      </Box>

      {/* Stage chip */}
      <StageChip stageNumber={file.stageNumber} stageLabel={file.stageLabel} />

      {/* Action button */}
      {linked ? (
        <Tooltip title="Remove link">
          <IconButton size="small" onClick={() => onUnlink(file)} sx={{ color: 'text.disabled' }}>
            <LinkOffRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title="Link to order">
          <IconButton size="small" onClick={() => onLinkClick(file)} color="primary">
            <LinkRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
}

// ─── Main Widget ─────────────────────────────────────────────────────────────
export default function DesignFilesWidget() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [configMissing, setConfigMissing] = useState(false);
  const [driveNotConnected, setDriveNotConnected] = useState(false);
  const [linkTarget, setLinkTarget] = useState(null); // file being linked
  const [filter, setFilter] = useState('unlinked'); // 'all' | 'unlinked' | 'linked'

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Check config first
      const cfgRes = await axios.get('/api/design-files/config-check');
      if (!cfgRes.data?.configured) {
        setConfigMissing(true);
        return;
      }
      const res = await axios.get('/api/design-files/scan');
      setFiles(res.data?.files || []);
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || '';
      if (msg.toLowerCase().includes('reconnect') || msg.toLowerCase().includes('not connected')) {
        setDriveNotConnected(true);
      } else if (err?.response?.status === 400) {
        setConfigMissing(true);
      } else {
        setError(msg || 'Could not load Drive files.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleUnlink(file) {
    try {
      await axios.delete(`/api/design-files/link/${file.fileId}`);
      setFiles((prev) => prev.map((f) => f.fileId === file.fileId ? { ...f, linked: false, orderUuid: null, orderNumber: null, customerName: null } : f));
    } catch {
      // silent — row still shows
    }
  }

  const filtered = files.filter((f) => {
    if (filter === 'unlinked') return !f.linked;
    if (filter === 'linked') return f.linked;
    return true;
  });

  const unlinkedCount = files.filter((f) => !f.linked).length;
  const linkedCount = files.filter((f) => f.linked).length;

  // ── Render: config missing ────────────────────────────────────────────────
  if (configMissing) {
    return (
      <Box sx={{ borderRadius: 2, border: '0.5px solid', borderColor: 'divider', p: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <FolderOpenRoundedIcon color="action" />
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>Design Files Tracker</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Add <code>DRIVE_DAILY_FOLDER_ID</code> to your backend <code>.env</code> file to enable this widget.
              This is the Google Drive folder ID of the designer's Daily folder.
            </Typography>
          </Box>
        </Stack>
      </Box>
    );
  }

  // ── Render: Drive not connected ───────────────────────────────────────────
  if (driveNotConnected) {
    return (
      <Box sx={{ borderRadius: 2, border: '0.5px solid', borderColor: 'divider', p: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <WarningAmberRoundedIcon color="warning" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" fontWeight={600}>Google Drive not connected</Typography>
            <Typography variant="body2" color="text.secondary">Reconnect Drive to enable Design Files tracking.</Typography>
          </Box>
          <Button size="small" variant="outlined" href="/api/google-drive/connect" target="_blank">
            Connect Drive
          </Button>
        </Stack>
      </Box>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <>
      <Box sx={{ borderRadius: 2, border: '0.5px solid', borderColor: 'divider', overflow: 'hidden' }}>
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ px: 2, py: 1.5, bgcolor: 'background.paper', borderBottom: '0.5px solid', borderColor: 'divider' }}
        >
          <FolderOpenRoundedIcon fontSize="small" color="action" />
          <Typography variant="subtitle2" fontWeight={600} sx={{ flex: 1 }}>
            Design Files
          </Typography>

          {/* Counts */}
          {!loading && (
            <Stack direction="row" spacing={0.5}>
              {unlinkedCount > 0 && (
                <Chip
                  label={`${unlinkedCount} unlinked`}
                  size="small"
                  sx={{ bgcolor: 'warning.100', color: 'warning.800', fontWeight: 600, fontSize: 10, height: 20 }}
                />
              )}
              {linkedCount > 0 && (
                <Chip
                  label={`${linkedCount} linked`}
                  size="small"
                  sx={{ bgcolor: 'success.100', color: 'success.800', fontWeight: 600, fontSize: 10, height: 20 }}
                />
              )}
            </Stack>
          )}

          <Tooltip title="Refresh from Drive">
            <IconButton size="small" onClick={load} disabled={loading}>
              <RefreshRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Loading bar */}
        {loading && <LinearProgress sx={{ height: 2 }} />}

        {/* Filter tabs */}
        <Stack
          direction="row"
          spacing={0.5}
          sx={{ px: 2, py: 1, borderBottom: '0.5px solid', borderColor: 'divider', bgcolor: 'background.default' }}
        >
          {[
            { key: 'unlinked', label: 'Needs linking' },
            { key: 'linked', label: 'Linked' },
            { key: 'all', label: 'All files' },
          ].map((tab) => (
            <Button
              key={tab.key}
              size="small"
              variant={filter === tab.key ? 'contained' : 'text'}
              onClick={() => setFilter(tab.key)}
              sx={{
                fontSize: 11,
                py: 0.4,
                px: 1.2,
                minWidth: 0,
                borderRadius: 5,
                boxShadow: 'none',
                textTransform: 'none',
                fontWeight: filter === tab.key ? 600 : 400,
              }}
            >
              {tab.label}
            </Button>
          ))}
        </Stack>

        {/* File list */}
        <Box sx={{ px: 1.5, py: 1, maxHeight: 380, overflowY: 'auto' }}>
          {error && (
            <Alert severity="error" sx={{ mb: 1, py: 0.5 }} action={
              <Button size="small" onClick={load}>Retry</Button>
            }>{error}</Alert>
          )}

          {!loading && !error && filtered.length === 0 && (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {filter === 'unlinked' ? 'All files are linked to orders.' : 'No files found in Drive folder.'}
              </Typography>
            </Box>
          )}

          <Stack spacing={0.75}>
            {filtered.map((file) => (
              <FileRow
                key={file.fileId}
                file={file}
                onLinkClick={setLinkTarget}
                onUnlink={handleUnlink}
              />
            ))}
          </Stack>
        </Box>

        {/* Footer note */}
        {!loading && files.length > 0 && (
          <>
            <Divider />
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Files auto-refresh when designer moves them between folders. Link each file once — tracking is automatic after that.
              </Typography>
            </Box>
          </>
        )}
      </Box>

      {/* Link dialog */}
      <LinkDialog
        open={!!linkTarget}
        file={linkTarget}
        onClose={() => setLinkTarget(null)}
        onLinked={load}
      />
    </>
  );
}
