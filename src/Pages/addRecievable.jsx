import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, Grid, MenuItem, Stack, TextField } from '@mui/material';
import axios from '../apiClient.js';
import { ActionButtonGroup, FormSection, PageContainer, SectionCard } from '../components/ui';

export default function AddRecievable() {
  const navigate = useNavigate();
  const location = useLocation();

  const [Description, setDescription] = useState('');
  const [Amount, setAmount] = useState('');
  const [Total_Debit, setTotal_Debit] = useState('');
  const [userGroup, setUserGroup] = useState('');
  const [Total_Credit, setTotal_Credit] = useState('');
  const [CreditCustomer, setCreditCustomer] = useState('');
  const [, setDebitCustomer] = useState('');
  const [allCustomerOptions, setAllCustomerOptions] = useState([]);
  const [accountCustomerOptions, setAccountCustomerOptions] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState('');
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [Customer_name, setCustomer_Name] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const userNameFromState = location.state?.id;
    const logInUser = userNameFromState || localStorage.getItem('User_name');

    if (logInUser) {
      setLoggedInUser(logInUser);
    } else {
      navigate('/login');
    }
  }, [location.state, navigate]);

  useEffect(() => {
    const group = localStorage.getItem('User_group');
    setUserGroup(group);
  }, []);

  const handleFileChange = (e) => {
    setSelectedImage(e.target.files[0]);
  };

  useEffect(() => {
    axios.get('/customer/GetCustomersList')
      .then((res) => {
        if (res.data.success) {
          setAllCustomerOptions(res.data.result);

          const accountOptions = res.data.result.filter((item) => item.Customer_group === 'Bank and Account');
          setAccountCustomerOptions(accountOptions);
          setDebitCustomer(accountOptions[0]?.Customer_uuid || '');
        }
      })
      .catch((err) => {
        console.error('Error fetching customer options:', err);
      });
  }, []);

  function addCustomer() {
    navigate('/addCustomer');
  }

  async function submit(e) {
    e.preventDefault();

    if (!Amount || isNaN(Amount) || Amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    try {
      const creditCustomer = allCustomerOptions.find((option) => option.Customer_uuid === CreditCustomer);

      const journal = [
        {
          Account_id: '81f36451-41f2-402d-9dd3-cc11af039142',
          Type: 'Debit',
          Amount: Number(Amount),
        },
        {
          Account_id: creditCustomer.Customer_uuid,
          Type: 'Credit',
          Amount: Number(Amount),
        },
      ];

      const formData = new FormData();
      formData.append('Description', Description);
      formData.append('Total_Credit', Number(Amount));
      formData.append('Total_Debit', Number(Amount));
      formData.append('Payment_mode', 'Opening Balance');
      formData.append('Transaction_date', '01-04-2025');
      formData.append('Created_by', loggedInUser);
      formData.append('Journal_entry', JSON.stringify(journal));
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const response = await axios.post('/transaction/addTransaction', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        alert(response.data.message);
        navigate('/allOrder');
      } else {
        alert('Failed to add Transaction');
      }
    } catch (err) {
      console.error('Error adding Transaction:', err);
      alert('Error occurred while submitting the form.');
    }
  }

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    setTotal_Debit(value);
    setTotal_Credit(value);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setCustomer_Name(value);

    if (value) {
      const filtered = allCustomerOptions.filter((option) =>
        option.Customer_name.toLowerCase().includes(value.toLowerCase()));
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions([]);
    }
  };

  const closeModal = () => {
    if (userGroup === 'Office User') {
      navigate('/home');
    } else if (userGroup === 'Admin User') {
      navigate('/home');
    }
  };

  return (
    <PageContainer title="Add Receivable" subtitle="Record opening receivable entries with proof attachment.">
      <SectionCard>
        <Box component="form" onSubmit={submit}>
          <Grid container spacing={1.25}>
            <Grid item xs={12} md={6}>
              <FormSection title="Party Selection">
                <TextField
                  label="Search by Customer Name"
                  value={Customer_name}
                  onChange={handleInputChange}
                />
                <TextField
                  label="Matched Customers"
                  select
                  value={CreditCustomer}
                  onChange={(e) => setCreditCustomer(e.target.value)}
                >
                  <MenuItem value="">Select Customer</MenuItem>
                  {(filteredOptions.length ? filteredOptions : allCustomerOptions).map((option) => (
                    <MenuItem key={option.Customer_uuid} value={option.Customer_uuid}>{option.Customer_name}</MenuItem>
                  ))}
                </TextField>
                <Button variant="outlined" onClick={addCustomer}>Add Customer</Button>
              </FormSection>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormSection title="Transaction Details">
                <TextField
                  label="Description"
                  autoComplete="off"
                  onChange={(e) => setDescription(e.target.value)}
                  value={Description}
                />
                <TextField
                  label="Amount"
                  autoComplete="off"
                  onChange={handleAmountChange}
                  value={Amount}
                />
                <TextField
                  type="file"
                  inputProps={{ accept: 'image/*' }}
                  onChange={handleFileChange}
                  helperText="Upload supporting image (optional)"
                />
                <Stack direction="row" spacing={1}>
                  <TextField label="Total Debit" value={Total_Debit} InputProps={{ readOnly: true }} />
                  <TextField label="Total Credit" value={Total_Credit} InputProps={{ readOnly: true }} />
                </Stack>
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
