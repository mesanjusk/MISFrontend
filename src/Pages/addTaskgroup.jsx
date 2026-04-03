import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../apiClient.js';
import SimpleEntityCreateForm from '../components/forms/SimpleEntityCreateForm';

export default function AddCustGroup() {
  const navigate = useNavigate();
  const [Task_group, setTask_Group] = useState('');

  async function submit(e) {
    e.preventDefault();
    try {
      await axios
        .post('/taskgroup/addTaskgroup', {
          Task_group,
        })
        .then((res) => {
          if (res.data == 'exist') {
            alert('Group already exists');
          } else if (res.data == 'notexist') {
            alert('Group added successfully');
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
      title="Add Task Group"
      label="Task Group"
      value={Task_group}
      placeholder="Task Group"
      onChange={setTask_Group}
      onSubmit={submit}
      submitLabel="Submit"
    />
  );
}
