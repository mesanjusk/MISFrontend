import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../apiClient.js';
import SimpleEntityCreateForm from '../components/forms/SimpleEntityCreateForm';

export default function AddPriority() {
  const navigate = useNavigate();
  const [Priority_name, setPriority_Name] = useState('');

  async function submit(e) {
    e.preventDefault();
    try {
      await axios
        .post('/priority/addPriority', {
          Priority_name,
        })
        .then((res) => {
          if (res.data == 'exist') {
            alert('Priority already exists');
          } else if (res.data == 'notexist') {
            alert('Priority added successfully');
            navigate('/home');
          }
        })
        .catch((error) => {
          alert('wrong details');
          console.log(error);
        });
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <SimpleEntityCreateForm
      title="Add Priority"
      label="Priority Name"
      value={Priority_name}
      placeholder="Priority Name"
      onChange={setPriority_Name}
      onSubmit={submit}
      submitLabel="Submit"
    />
  );
}
