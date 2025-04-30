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
import AllTransaction1 from "./Reports/allTransaction1";
import CustomerReport from "./Reports/customerReport";
import EditCustomer from "./Reports/editCustomer";
import AdminHome from "./Pages/adminHome";
import VendorHome from "./Pages/vendorHome";
import AddTransaction1 from "./Pages/addTransaction1";
import EditTask from "./Reports/editTask";
import TaskReport from "./Reports/taskReport";
import UpdateDelivery from "./Pages/updateDelivery";
import AllTransaction2 from "./Reports/allTransaction2";
import AllTransaction3 from "./Reports/allTransaction3";
import ItemReport from "./Reports/itemReport";
import EditItem from "./Reports/editItem";
import AllBills from "./Reports/allBills";
import UserReport from "./Reports/userReport";
import EditUser from "./Reports/editUser";
import PaymentReport from "./Reports/paymentReport";
import EditPayment from "./Reports/editPayment";
import PriorityReport from "./Reports/priorityReport";
import EditPriority from "./Reports/editPriority";
import SearchMobile from "./Pages/searchMobile";
import AddUsertask from "./Pages/addUsertask";
import CallLogs from "./Pages/callLogs";
import AddRecievable from "./Pages/addRecievable";
import AddPayable from "./Pages/addPayable";
import SendMessage from "./Pages/SendMessage";
import WhatsAppLogin from "./Pages/WhatsAppLogin";


function App() {
    axios.defaults.baseURL = "https://misbackend-e078.onrender.com/";
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
                    <Route path="/userReport" element={<UserReport />} />
                    <Route path="/itemReport" element={<ItemReport />} />
                    <Route path="/paymentReport" element={<PaymentReport />} />
                    <Route path="/priorityReport" element={<PriorityReport />} />
                    <Route path="/allDelivery" element={<AllDelivery />} />
                    <Route path="/allBills" element={<AllBills />} />
                    <Route path="/allTransaction" element={<AllTransaction />} />
                    <Route path="/allTransaction1" element={<AllTransaction1 />} />
                    <Route path="/allTransaction2" element={<AllTransaction2 />} />
                    <Route path="/allTransaction3" element={<AllTransaction3 />} />
                    <Route path="/orderUpdate/:id" element={<OrderUpdate />} />
                    <Route path="/updateDelivery/:id" element={<UpdateDelivery />} />
                    <Route path="/editCustomer/:id" element={<EditCustomer />} />
                    <Route path="/editTask/:id" element={<EditTask />} />
                    <Route path="/editItem/:id" element={<EditItem />} />
                    <Route path="/editUser/:id" element={<EditUser />} />
                    <Route path="/editPayment/:id" element={<EditPayment />} />
                    <Route path="/editPriority/:id" element={<EditPriority />} />
                    <Route path="/footer" element={< Footer /> } />
                    <Route path="/header" element={< TopNavbar />} />
                    <Route path="/customerMobile" element={< SearchMobile />} />
                    <Route path="/addUsertask" element={< AddUsertask />} />
                    <Route path="/calllogs" element={< CallLogs />} />
                    <Route path="/addRecievable" element={< AddRecievable />} />
                    <Route path="/addPayable" element={< AddPayable />} />
                    <Route path="/SendMessage" element={< SendMessage />} />
                    <Route path="/WhatsAppLogin" element={< WhatsAppLogin />} />
                    
                </Routes>
            </div>
        </Router>
    );
}

export default App;
