import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MenuItem, TextField } from '@mui/material';
import axios from '../apiClient.js';
import SimpleEntityCreateForm from '../components/forms/SimpleEntityCreateForm';
import { compactFieldSx } from '../components/ui/addFormStyles';

export default function AddItem() {
  const navigate = useNavigate();

  const [Item_name, setItem_Name] = useState('');
  const [Item_group, setItem_Group] = useState('');
  const [groupOptions, setGroupOptions] = useState([]);

  useEffect(() => {
    axios.get('/itemgroup/GetItemgroupList')
      .then((res) => {
        if (res.data.success) {
          const options = res.data.result.map((item) => item.Item_group);
          setGroupOptions(options);
        }
      })
      .catch((err) => {
        console.error('Error fetching group options:', err);
      });
  }, []);

  async function submit(e) {
    e.preventDefault();
    try {
      const res = await axios.post('/item/addItem', {
        Item_name,
        Item_group,
      });

      if (res.data === 'exist') {
        alert('Item already exists');
      } else if (res.data === 'notexist') {
        alert('Item added successfully');
        navigate('/home');
      }
    } catch (e) {
      alert('wrong details');
      console.log(e);
    }
  }

  return (
    <SimpleEntityCreateForm
      title="Add Item"
      label="Item Name"
      value={Item_name}
      placeholder="Item Name"
      onChange={setItem_Name}
      onSubmit={submit}
      submitLabel="Submit"
      onSecondaryAction={() => navigate('/home')}
      secondaryActionLabel="Close"
    >
      <TextField
        select
        label="Item Group"
        className="w-full"
        value={Item_group}
        onChange={(e) => setItem_Group(e.target.value)}
        size="small"
        sx={compactFieldSx}
      >
        <MenuItem value="">Select Group</MenuItem>
        {groupOptions.map((option) => (
          <MenuItem key={option} value={option}>{option}</MenuItem>
        ))}
      </TextField>
    </SimpleEntityCreateForm>
  );
}
