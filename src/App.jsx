import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from './Pages/home';
import AddCustomer from "./Pages/addCustomer";
import AddCustGroup from "./Pages/addCustomergroup";
import 'bootstrap/dist//css/bootstrap.min.css'
import AddUser from "./Pages/addUser";
import AddUserGroup from "./Pages/addUsergroup"; 
import AddItem from "./Pages/addItem";
import AddItemGroup from "./Pages/addItemgroup"; 
import AddTask from "./Pages/addTask";
import AddTaskGroup from "./Pages/addTaskgroup"; 
import AddPriority from "./Pages/addPriority";
import AddOrder from "./Pages/addOrder";
import AddOrder1 from "./Pages/addOrder1";
import AllOrder from "./Reports/allOrder";
import AllDelivery from "./Reports/allDelivery";
import Login from "./Pages/login";
import OrderUpdate from "./Reports/orderUpdate";
import Footer from "./Pages/footer";
import TopNavbar from "./Pages/topNavbar";
import AddEnquiry from "./Pages/addEnquiry";
import axios from 'axios';
import AddPayment from "./Pages/addPayment";
import AddTransaction from "./Pages/addTransaction";
import AllTransaction from "./Reports/allTransaction";
import CustomerReport from "./Reports/customerReport";
import EditCustomer from "./Reports/editCustomer";
import AdminHome from "./Pages/adminHome";
import VendorHome from "./Pages/vendorHome";
import AddTransaction1 from "./Pages/addTransaction1";
import EditTask from "./Reports/editTask";
import TaskReport from "./Reports/taskReport";
import UpdateDelivery from "./Pages/updateDelivery";

function App() {
    axios.defaults.baseURL = "https://misbackend-xz4b.onrender.com/";
    return (
        <Router>
            <div>
                <Routes>
                    <Route path="/" element={<Login/>}/>
                    <Route path="/home" element={<Home />} />
                    <Route path="/adminHome" element={<AdminHome />} />
                    <Route path="/vendorHome" element={<VendorHome />} />
                    <Route path="/addCustomer" element={<AddCustomer />} />
                    <Route path="/addCustgroup" element={<AddCustGroup />} />
                    <Route path="/addUser" element={<AddUser />} />
                    <Route path="/addUsergroup" element={<AddUserGroup />} />
                    <Route path="/addItem" element={<AddItem />} />
                    <Route path="/addItemgroup" element={<AddItemGroup />} />
                    <Route path="/addTask" element={<AddTask />} />
                    <Route path="/addTaskgroup" element={<AddTaskGroup />} />
                    <Route path="/addPriority" element={<AddPriority />} />
                    <Route path="/addOrder" element={<AddOrder />} />
                    <Route path="/addOrder1" element={<AddOrder1 />} />
                    <Route path="/addEnquiry" element={<AddEnquiry />} />
                    <Route path="/addTransaction" element={<AddTransaction />} />
                    <Route path="/addTransaction1" element={<AddTransaction1 />} />
                    <Route path="/addPayment" element={<AddPayment />} />
                    <Route path="/allOrder" element={<AllOrder />} />
                    <Route path="/customerReport" element={<CustomerReport />} />
                    <Route path="/taskReport" element={<TaskReport />} />
                    <Route path="/allDelivery" element={<AllDelivery />} />
                    <Route path="/allTransaction" element={<AllTransaction />} />
                    <Route path="/orderUpdate/:id" element={<OrderUpdate />} />
                    <Route path="/updateDelivery/:id" element={<UpdateDelivery />} />
                    <Route path="/editCustomer/:id" element={<EditCustomer />} />
                    <Route path="/editTask/:id" element={<EditTask />} />
                    <Route path="/footer" element={< Footer /> } />
                    <Route path="/header" element={< TopNavbar />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
