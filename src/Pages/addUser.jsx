import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Chip, Grid, MenuItem, Stack, TextField } from '@mui/material';
import axios from '../apiClient.js';
import { toast, ToastContainer } from '../Components';
import { ActionButtonGroup, FormSection, PageContainer, SectionCard } from '../Components/ui';

export default function AddUser({ closeModal }) {
  const navigate = useNavigate();

  const [User_name, setUser_Name] = useState('');
  const [Password, setPassword] = useState('');
  const [Mobile_number, setMobile_Number] = useState('');
  const [User_group, setUser_Group] = useState('');
  const [Allowed_Task_Groups, setAllowed_Task_Groups] = useState([]);
  const [groupOptions, setGroupOptions] = useState([]);
  const [taskGroupOptions, setTaskGroupOptions] = useState([]);
  const [passwordStrength, setPasswordStrength] = useState('');

  useEffect(() => {
    axios.get('/usergroup/GetUsergroupList')
      .then((res) => {
        if (res.data.success) {
          const options = res.data.result.map((item) => item.User_group);
          setGroupOptions(options);
        }
      });

    axios.get('/taskgroup/GetTaskgroupList')
      .then((res) => {
        if (res.data.success) {
          const taskOptions = res.data.result.map((item) => item.Task_group);
          setTaskGroupOptions(taskOptions);
        }
      });
  }, []);

  const handleTaskGroupChange = (e) => {
    const selected = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
    setAllowed_Task_Groups(selected);
  };

  const evaluatePasswordStrength = (password) => {
    if (password.length < 6) return 'Weak';
    if (/[A-Z]/.test(password) && /\d/.test(password) && /[@$!%*?&#]/.test(password)) return 'Strong';
    return 'Medium';
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordStrength(evaluatePasswordStrength(value));
  };

  async function submit(e) {
    e.preventDefault();

    const phonePattern = /^[6-9]\d{9}$/;

    if (!User_name || !Password || !Mobile_number || !User_group) {
      toast.error('All fields are required');
      return;
    }

    if (!phonePattern.test(Mobile_number)) {
      toast.error('Enter a valid 10-digit mobile number starting with 6-9');
      return;
    }

    try {
      const response = await axios.post('/user/addUser', {
        User_name,
        Password,
        Mobile_number,
        User_group,
        Allowed_Task_Groups,
      });

      if (response.data === 'exist') {
        toast.warning('User already exists');
      } else if (response.data === 'notexist') {
        toast.success('User added successfully');
        setTimeout(() => {
          if (closeModal) closeModal();
          else navigate('/home');
        }, 1500);
      }
    } catch (err) {
      toast.error('Error submitting form');
      console.log(err);
    }
  }

  const passwordColor = passwordStrength === 'Strong' ? 'success' : passwordStrength === 'Medium' ? 'warning' : 'error';

  return (
    <PageContainer title="Add User" subtitle="Create user access with task-group permissions.">
      <ToastContainer position="top-center" />
      <SectionCard>
        <Box component="form" onSubmit={submit}>
          <Grid container spacing={1.25}>
            <Grid item xs={12} md={6}>
              <FormSection title="Basic Details">
                <TextField
                  label="User Name"
                  autoComplete="off"
                  value={User_name}
                  onChange={(e) => setUser_Name(e.target.value)}
                  placeholder="User Name"
                />
                <TextField
                  label="Password"
                  type="password"
                  autoComplete="new-password"
                  value={Password}
                  onChange={handlePasswordChange}
                  placeholder="Password"
                />
                {Password ? <Alert severity={passwordColor} sx={{ py: 0 }}>Strength: {passwordStrength}</Alert> : null}
                <TextField
                  label="Mobile Number"
                  autoComplete="off"
                  value={Mobile_number}
                  onChange={(e) => setMobile_Number(e.target.value)}
                  placeholder="Mobile Number"
                />
              </FormSection>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormSection title="Permissions">
                <TextField
                  label="User Group"
                  select
                  value={User_group}
                  onChange={(e) => setUser_Group(e.target.value)}
                >
                  <MenuItem value="">Select Group</MenuItem>
                  {groupOptions.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Allowed Task Groups"
                  select
                  SelectProps={{ multiple: true, value: Allowed_Task_Groups, onChange: handleTaskGroupChange }}
                  helperText="Select one or multiple task groups"
                >
                  {taskGroupOptions.map((task) => (
                    <MenuItem key={task} value={task}>{task}</MenuItem>
                  ))}
                </TextField>

                <Stack direction="row" spacing={0.75} flexWrap="wrap">
                  {Allowed_Task_Groups.map((task) => <Chip key={task} size="small" label={task} color="primary" variant="outlined" />)}
                </Stack>
              </FormSection>
            </Grid>
          </Grid>

          <Box sx={{ mt: 1.5 }}>
            <ActionButtonGroup primaryLabel="Submit" onCancel={closeModal} cancelLabel="Cancel" />
          </Box>
        </Box>
      </SectionCard>
    </PageContainer>
  );
}
