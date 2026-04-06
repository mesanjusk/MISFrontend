/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import axios from '../apiClient.js';
import { ActionButtonGroup, PageContainer, SectionCard } from '../components/ui';

export default function AddCustomer({ onClose }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    Customer_name: '',
    Mobile_number: '',
    Customer_group: '',
    Status: 'active',
    Tags: [],
    LastInteraction: '',
  });

  const [groupOptions, setGroupOptions] = useState([]);
  const [duplicateNameError, setDuplicateNameError] = useState('');

  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [groupLoading, setGroupLoading] = useState(false);

  const canSubmit =
    Boolean(form.Customer_name.trim()) && Boolean(form.Customer_group.trim());

  const fetchCustomerGroups = async () => {
    try {
      const res = await axios.get('/customergroup/GetCustomergroupList');
      if (res.data.success) {
        const options = (res.data.result || [])
          .map((item) => item.Customer_group)
          .filter(Boolean);

        const uniqueOptions = [...new Set(options)];
        setGroupOptions(uniqueOptions);
      }
    } catch (err) {
      console.error('Error fetching customer group options:', err);
    }
  };

  useEffect(() => {
    fetchCustomerGroups();
  }, []);

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setDuplicateNameError('');

    if (!form.Customer_name.trim()) {
      alert('Customer name is required.');
      return;
    }

    if (!form.Customer_group.trim()) {
      alert('Customer group is required.');
      return;
    }

    if (form.Mobile_number && !/^\d{10}$/.test(form.Mobile_number)) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      const duplicateRes = await axios.get(
        `/customer/checkDuplicateName?name=${encodeURIComponent(form.Customer_name.trim())}`
      );

      if (!duplicateRes.data.success) {
        setDuplicateNameError('Customer name already exists.');
        return;
      }
    } catch (error) {
      console.error('Error checking for duplicate name:', error);
      alert('Error checking for duplicate name');
      return;
    }

    try {
      const payload = { ...form };

      payload.Customer_name = form.Customer_name.trim();
      payload.Customer_group = form.Customer_group.trim();
      payload.Tags = form.Tags.filter((tag) => tag !== '');

      if (!payload.Mobile_number || !payload.Mobile_number.trim()) {
        delete payload.Mobile_number;
      }

      if (!form.LastInteraction) {
        delete payload.LastInteraction;
      }

      const res = await axios.post('/customer/addCustomer', payload);

      if (res.data.success) {
        alert('Customer added successfully');
        if (onClose) onClose();
        else navigate('/home');
      } else {
        alert('Failed to add Customer.');
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      alert('Error adding customer');
    }
  };

  const handleAddGroup = async () => {
    const groupName = newGroupName.trim();

    if (!groupName) {
      alert('Please enter customer group name.');
      return;
    }

    if (groupOptions.some((item) => item.toLowerCase() === groupName.toLowerCase())) {
      handleChange('Customer_group', groupName);
      setGroupDialogOpen(false);
      setNewGroupName('');
      return;
    }

    try {
      setGroupLoading(true);

      // Assumed existing backend route
      const res = await axios.post('/customergroup/addCustomergroup', {
        Customer_group: groupName,
      });

      if (res.data.success) {
        const updatedOptions = [...new Set([...groupOptions, groupName])];
        setGroupOptions(updatedOptions);
        handleChange('Customer_group', groupName);
        setGroupDialogOpen(false);
        setNewGroupName('');
        alert('Customer group added successfully');
      } else {
        alert(res.data.message || 'Failed to add customer group.');
      }
    } catch (error) {
      console.error('Error adding customer group:', error);
      alert('Error adding customer group');
    } finally {
      setGroupLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: field === 'Tags' ? value.split(',').map((tag) => tag.trim()) : value,
    }));
  };

  const handleCancel = () => {
    if (onClose) onClose();
    else navigate('/home');
  };

  return (
    <PageContainer
      title="Add Customer"
      subtitle="Create customer profile with tags and interaction metadata."
    >
      <SectionCard>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={1.2}>
            <TextField
              label="Customer Name"
              value={form.Customer_name}
              onChange={(e) => handleChange('Customer_name', e.target.value)}
              required
              error={Boolean(duplicateNameError)}
              helperText={duplicateNameError || ' '}
            />

            <TextField
              label="Mobile Number"
              value={form.Mobile_number}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d{0,10}$/.test(value)) {
                  handleChange('Mobile_number', value);
                }
              }}
              placeholder="Optional 10-digit number"
              helperText="Optional field. Leave blank for office, bank, or expense accounts."
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="stretch">
              <FormControl fullWidth required>
                <InputLabel id="customer-group-label">Customer Group</InputLabel>
                <Select
                  labelId="customer-group-label"
                  value={form.Customer_group}
                  label="Customer Group"
                  onChange={(e) => handleChange('Customer_group', e.target.value)}
                >
                  {groupOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setGroupDialogOpen(true)}
                sx={{ minWidth: { xs: '100%', sm: 170 }, height: 56 }}
              >
                Add Group
              </Button>
            </Stack>

            <FormControl fullWidth>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                value={form.Status}
                label="Status"
                onChange={(e) => handleChange('Status', e.target.value)}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Tags"
              value={form.Tags.join(', ')}
              onChange={(e) => handleChange('Tags', e.target.value)}
              placeholder="VIP, Retail, Priority"
            />

            <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
              {form.Tags.filter(Boolean).map((tag) => (
                <Chip key={tag} size="small" label={tag} variant="outlined" />
              ))}
            </Stack>

            <TextField
              label="Last Interaction"
              type="datetime-local"
              value={formatDateForInput(form.LastInteraction)}
              onChange={(e) => handleChange('LastInteraction', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <Paper variant="outlined" sx={{ p: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Required fields: Customer Name and Customer Group. Mobile Number is optional.
              </Typography>
            </Paper>

            <ActionButtonGroup
              primaryLabel="Submit"
              onCancel={handleCancel}
              busy={!canSubmit}
            />
          </Stack>
        </Box>
      </SectionCard>

      <Dialog
        open={groupDialogOpen}
        onClose={() => {
          if (!groupLoading) {
            setGroupDialogOpen(false);
            setNewGroupName('');
          }
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Add Customer Group</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="Customer Group Name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Enter new customer group"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setGroupDialogOpen(false);
              setNewGroupName('');
            }}
            disabled={groupLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleAddGroup} variant="contained" disabled={groupLoading}>
            {groupLoading ? 'Adding...' : 'Add Group'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}