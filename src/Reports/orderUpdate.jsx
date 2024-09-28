import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

export default function OrderUpdate() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState({});
  const [taskOptions, setTaskOptions] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [values, setValues] = useState({
    id: id,
    Customer_name: '',
    Delivery_Date: '',
    Assigned: '',
    Task: '',
    Order_Number: '',
    CreatedAt: '',
    Status: []
  });

  useEffect(() => {
    axios.get(`/order/${id}`)
      .then(res => {
        if (res.data.success) {
          const order = res.data.result;

          const customerName = customers[order.Customer_uuid] || 'Unknown';

          setValues({
            id: order._id,
            Customer_name: customerName,
            Delivery_Date: '',
            Assigned: '',
            Task: '',
            Order_Number: order.Order_Number || '',
            CreatedAt: new Date().toISOString().split("T")[0], // Set to current date
            Status: order.Status || []
          });
        }
      })
      .catch(err => console.log('Error fetching order data:', err));
  }, [id, customers]);

  useEffect(() => {
    axios.get("/taskgroup/GetTaskgroupList")
      .then(res => {
        if (res.data.success) {
          const options = res.data.result.map(item => item.Task_group);
          setTaskOptions(options);
        }
      })
      .catch(err => {
        console.error("Error fetching task options:", err);
      });
  }, []);

  useEffect(() => {
    axios.get("/user/GetUserList")
      .then(res => {
        if (res.data.success) {
          const options = res.data.result.map(item => item.User_name);
          setUserOptions(options);
        }
      })
      .catch(err => {
        console.error("Error fetching user options:", err);
      });
  }, []);


  useEffect(() => {
    axios.get("/order/GetOrderList")
      .then(res => {
        if (res.data.success) {
          setOrders(res.data.result);
        } else {
          setOrders([]);
        }
      })
      .catch(err => console.log('Error fetching order list:', err));
  }, []);

  useEffect(() => {
    axios.get("/customer/GetCustomersList")
      .then(res => {
        if (res.data.success) {
          const customerMap = res.data.result.reduce((acc, customer) => {
            if (customer.Customer_uuid && customer.Customer_name) {
              acc[customer.Customer_uuid] = customer.Customer_name;
            }
            return acc;
          }, {});
          setCustomers(customerMap);
        } else {
          setCustomers({});
        }
      })
      .catch(err => console.log('Error fetching customers list:', err));
  }, []);



  const handleSaveChanges = (e) => {
    e.preventDefault();

    if (!values.Task || !values.Assigned || !values.Delivery_Date) {
      alert('All fields are required.');
      return;
    }

    axios.post('/order/addStatus', {
      orderId: values.id,
      newStatus: {
        Task: values.Task,
        Assigned: values.Assigned,
        Delivery_Date: values.Delivery_Date,
        CreatedAt: values.CreatedAt,
      },
    })
      .then(res => {
        if (res.data.success) {
          alert('Order updated successfully!');
          navigate("/allOrder");
        }
      })
      .catch(err => {
        console.log('Error updating order:', err);
      });
  };

  return (
    <div className="w-4/4 h-full flex flex-col bg-white">
      <div className="p-3 bg-green-200 grid grid-cols-7 gap-1 items-center justify-between">
        <div className="w-12 h-12 p-2 col-start-1 col-end-1 bg-gray-100 rounded-full flex items-center justify-center">
          <strong className="text-l text-gray-500"> 01 </strong>
        </div>
        <div>
          <div className="p-2 col-start-2 col-end-6">
            <strong className="text-l text-gray-900">{values.Customer_name}</strong>
            <br />

          </div>
          <h2 className="text-lg font-semibold"></h2>
          <p className="text-sm text-gray-600">Status</p>
        </div>
      </div>

      <div className="pt-12 max-w-md mx-auto">
        <div className="flex flex-1 items-center p-1 overflow-y-auto mx-auto p-0">
          <div className="items-center overflow-max-auto">
            
                {values.Status.length > 0 ? (
                  values.Status.map((status, index) => (
                    <div key={index}>
                      
                        {new Date(status.CreatedAt).toLocaleDateString()}
                      
                        {status.Task}
                      
                        {status.Assigned}
                      
                        {new Date(status.Delivery_Date).toLocaleDateString()}
                      
                    </div>
                  ))
                ) : (
                  <tr>
                    
                      No status data available
                    
                  </tr>
                )}
              
          </div>
        </div>
      </div>
      <form className="p-2 " onSubmit={handleSaveChanges}>
        <div>
          <div className=" p-2 w-100 mb-2 rounded-lg">
            <strong> Update Job Status </strong>
            <select
              className="form-control p-1 rounded-0"
              value={values.Task}
              onChange={(e) => setValues({ ...values, Task: e.target.value })}
            >
              <option value="">Select Task</option>
              {taskOptions.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className=" p-2 w-100 mb-2 rounded-lg">
            <strong> Update User </strong>
            <select
              className="form-control"
              value={values.Assigned}
              onChange={(e) => setValues({ ...values, Assigned: e.target.value })}
            >
              <option value="">Select User</option>
              {userOptions.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className=" p-2 w-100 mb-2 rounded-lg">
            <strong> Update Delivery Date </strong><br />
            <input
              type="date"
              value={values.Delivery_Date}
              onChange={(e) => setValues({ ...values, Delivery_Date: e.target.value })}
              placeholder="Delivery Date"
            />
          </div>
        </div>
        <div className="self-start p-2 w-100">

        </div>

        <div className="p-4 fixed bottom-0  border-t border-gray-300">
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Type Remark"
              className="flex-grow p-2 border border-gray-300 rounded-lg"

            />
            <button type="submit"
              className="ml-2 bg-green-500 text-white p-2 rounded-lg"

            >
              UPDATE
            </button>
          </div>
        </div>


      </form>
    </div>
  );
}
