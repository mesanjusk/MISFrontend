import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from 'react';
import axios from 'axios';
import Layout from './Pages/Layout';
import { initVersionChecker } from './utils/versionChecker';

// Public pages
import Login from "./Pages/login";
import Register from "./Pages/Register";

// Main feature pages
import Planner from "./Pages/Planner";
import Review from "./Pages/Review";
import Team from "./Pages/Team";
import Home from './Pages/home';
import AddCustomer from "./Pages/addCustomer";
import AddCustGroup from "./Pages/addCustomergroup";
import AddUser from "./Pages/addUser";
import AddUserGroup from "./Pages/addUsergroup"; 
import AddItem from "./Pages/addItem";
import AddItemGroup from "./Pages/addItemgroup"; 
import AddTask from "./Pages/addTask";
import AddTaskGroup from "./Pages/addTaskgroup"; 
import AddPriority from "./Pages/addPriority";
import AddOrder from "./Pages/addOrder";
import AllOrderTableView from "./Reports/AllOrderTableView"; 
import AddOrder1 from "./Pages/addOrder1";
import AllOrder from "./Reports/allOrder";
import AllOrderMobile from "./Reports/allOrderMobile";
import AllDelivery from "./Reports/allDelivery";
import OrderUpdate from "./Reports/orderUpdate";
import AddEnquiry from "./Pages/addEnquiry";
import AddPayment from "./Pages/addPayment";
import AddTransaction from "./Pages/AddTransaction";
import AllTransaction from "./Reports/allTransaction";
import AllTransaction1 from "./Reports/allTransaction1";
import AllTransaction4D from "./Reports/allTransaction4D";
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
import VendorBills from "./Reports/vendorBills";
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
import SendMessageAll from "./Pages/SendMessageAll";
import WhatsAppLogin from "./Pages/WhatsAppLogin";
import WhatsAppSession from "./Pages/WhatsAppSession";
import WhatsAppAdminPanel from "./Pages/WhatsAppAdminPanel";
import PendingTasks from './Pages/PendingTasks';
import AllAttandance from './Pages/AllAttandance';
import AllVendors from './Reports/AllVendors';
import CashLedger from "./Pages/CashLedger";
import Vendor from "./Pages/vendor";
import MigrateOrders from "./Pages/MigrateOrders";

// ✅ NEW: Attendance Report page
import AttendanceReport from "./Pages/AttendanceReport";

function App() {
  axios.defaults.baseURL = "https://misbackend-e078.onrender.com/";

  useEffect(() => {
    if (import.meta.env.PROD) {
      const id = initVersionChecker();
      return () => clearInterval(id);
    }
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-background text-gray-900">
        <Routes>
          {/* Public routes - no Layout */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes - inside Layout */}
          <Route element={<Layout />}>
            <Route path="/planner" element={<Planner />} />
            <Route path="/review" element={<Review />} />
            <Route path="/team" element={<Team />} />
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
            <Route path="/allOrderT" element={<AllOrderTableView />} />
            <Route path="/allOrder" element={<AllOrder />} />
            <Route path="/allOrderM" element={<AllOrderMobile />} />
            <Route path="/customerReport" element={<CustomerReport />} />
            <Route path="/taskReport" element={<TaskReport />} />
            <Route path="/userReport" element={<UserReport />} />
            <Route path="/itemReport" element={<ItemReport />} />
            <Route path="/paymentReport" element={<PaymentReport />} />
            <Route path="/priorityReport" element={<PriorityReport />} />
            <Route path="/allDelivery" element={<AllDelivery />} />
            <Route path="/vendorBills" element={<VendorBills />} />
            <Route path="/allBills" element={<AllBills />} />
            <Route path="/allTransaction" element={<AllTransaction />} />
            <Route path="/allTransaction1" element={<AllTransaction1 />} />
            <Route path="/allTransaction2" element={<AllTransaction2 />} />
            <Route path="/allTransaction3" element={<AllTransaction3 />} />
            <Route path="/allTransaction4D" element={<AllTransaction4D />} />
            <Route path="/orderUpdate/:id" element={<OrderUpdate />} />
            <Route path="/updateDelivery/:id" element={<UpdateDelivery />} />
            <Route path="/editCustomer/:id" element={<EditCustomer />} />
            <Route path="/editTask/:id" element={<EditTask />} />
            <Route path="/editItem/:id" element={<EditItem />} />
            <Route path="/editUser/:id" element={<EditUser />} />
            <Route path="/editPayment/:id" element={<EditPayment />} />
            <Route path="/editPriority/:id" element={<EditPriority />} />
            <Route path="/customerMobile" element={<SearchMobile />} />
            <Route path="/addUsertask" element={<AddUsertask />} />
            <Route path="/calllogs" element={<CallLogs />} />
            <Route path="/addRecievable" element={<AddRecievable />} />
            <Route path="/addPayable" element={<AddPayable />} />
            <Route path="/SendMessage" element={<SendMessage />} />
            <Route path="/SendMessageAll" element={<SendMessageAll />} />
            <Route path="/WhatsAppLogin" element={<WhatsAppLogin />} />
            <Route path="/WhatsAppAdminPanel" element={<WhatsAppAdminPanel />} />
            <Route path="/WhatsAppSession" element={<WhatsAppSession />} />
            <Route path="/PendingTasks" element={<PendingTasks />} />
            <Route path="/AllAttandance" element={<AllAttandance />} />
            <Route path="/AllVendors" element={<AllVendors />} />
            
            {/* ✅ NEW route */}
            <Route path="/attendance-report" element={<AttendanceReport />} />
            <Route path="/CashLedger" element={<CashLedger />} />
            <Route path="/addVendor" element={<Vendor />} />
            <Route path="/migrate-orders" element={<MigrateOrders />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
