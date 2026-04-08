import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Grid, MenuItem, TextField } from '@mui/material';
import axios from '../apiClient.js';
import { ActionButtonGroup, FormSection, PageContainer, SectionCard } from '../components/ui';

export default function AddCategory() {
  const navigate = useNavigate();

  const [Customer_name, setCustomer_Name] = useState('');
  const [Remark, setRemark] = useState('');
  const [userGroup, setUserGroup] = useState('');
  const [customerOptions, setCustomerOptions] = useState([]);

  useEffect(() => {
    axios.get('/customer/GetCustomersList')
      .then((res) => {
        if (res.data.success) {
          const options = res.data.result.map((item) => item.Customer_name);
          setCustomerOptions(options);
        }
      })
      .catch((err) => {
        console.error('Error fetching customer options:', err);
      });
  }, []);

  useEffect(() => {
    const group = localStorage.getItem('User_group');
    setUserGroup(group);
  }, []);

  function addCustomer() {
    navigate('/addCustomer');
  }

  async function submit(e) {
    e.preventDefault();

    try {
      if (!Customer_name) {
        alert('Customer Name is required.');
        return;
      }

      const response = await axios.post('/enquiry/addEnquiry', {
        Customer_name,
        Remark,
      });

      if (response.data.success) {
        alert(response.data.message);
        navigate('/allOrder');
      } else {
        alert('Failed to add Enquiry');
      }
    } catch (err) {
      console.log('Error adding Enquiry:', err);
    }
  }

  const closeModal = () => {
    if (userGroup === 'Office User') {
      navigate('/home');
    } else if (userGroup === 'Admin User') {
      navigate('/home');
    }
  };

  return (
    <PageContainer title="Add Enquiry" subtitle="Capture a new customer enquiry with compact CRM form flow.">
      <SectionCard>
        <Box component="form" onSubmit={submit}>
          <Grid container spacing={1.25}>
            <Grid item xs={12} md={6}>
              <FormSection title="Customer">
                <TextField
                  label="Customer Name"
                  select
                  value={Customer_name}
                  onChange={(e) => setCustomer_Name(e.target.value)}
                >
                  <MenuItem value="">Select Customer</MenuItem>
                  {customerOptions.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </TextField>

                <Button variant="outlined" onClick={addCustomer}>Add Customer</Button>
              </FormSection>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormSection title="Enquiry Details">
                <TextField
                  label="Order Details"
                  autoComplete="off"
                  onChange={(e) => setRemark(e.target.value)}
                  value={Remark}
                  placeholder="Remarks"
                  multiline
                  minRows={4}
                />
              </FormSection>
            </Grid>
          </Grid>

          <Box sx={{ mt: 1.5 }}>
            <ActionButtonGroup primaryLabel="Submit" onCancel={closeModal} cancelLabel="Close" />
          </Box>
        </Box>
      </SectionCard>
    </PageContainer>
  );
}
