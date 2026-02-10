import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import "./apiClient.js";
import Layout from "./Pages/Layout";
import { initVersionChecker } from "./utils/versionChecker";
import { ToastContainer } from "./Components";

/* ---------------------------- Public Pages ---------------------------- */
import Login from "./Pages/login";
import Register from "./Pages/Register";

/* ---------------------------- Main Pages ------------------------------ */
import Planner from "./Pages/Planner";
import Review from "./Pages/Review";
import Team from "./Pages/Team";
import Dashboard from "./Pages/Dashboard";

/* ---------------------------- Master Pages ---------------------------- */
import AddCustomer from "./Pages/addCustomer";
import AddCustGroup from "./Pages/addCustomergroup";
import AddUser from "./Pages/addUser";
import AddUserGroup from "./Pages/addUsergroup";
import AddItem from "./Pages/addItem";
import AddItemGroup from "./Pages/addItemgroup";
import AddTask from "./Pages/addTask";
import AddTaskGroup from "./Pages/addTaskgroup";
import AddPriority from "./Pages/addPriority";

/* ---------------------------- Order Pages ----------------------------- */
import AddOrder from "./Pages/addOrder";
import AddOrder1 from "./Pages/addOrder1";
import AllOrderTableView from "./Reports/AllOrderTableView";
import AllOrder from "./Reports/allOrder";
import AllOrderMobile from "./Reports/allOrderMobile";
import AllDelivery from "./Reports/allDelivery";
import OrderUpdate from "./Pages/OrderUpdate";
import UpdateDelivery from "./Pages/updateDelivery";

/* ---------------------------- Enquiry & Payment ----------------------- */
import AddEnquiry from "./Pages/addEnquiry";
import AddPayment from "./Pages/addPayment";
import AddTransaction from "./Pages/AddTransaction";
import AddTransaction1 from "./Pages/addTransaction1";
import AddRecievable from "./Pages/addRecievable";
import AddPayable from "./Pages/addPayable";

/* ---------------------------- Reports -------------------------------- */
import AllTransaction from "./Reports/allTransaction";
import AllTransaction1 from "./Reports/allTransaction1";
import AllTransaction2 from "./Reports/allTransaction2";
import AllTransaction3 from "./Reports/allTransaction3";
import AllTransaction4D from "./Reports/allTransaction4D";
import CustomerReport from "./Reports/customerReport";
import TaskReport from "./Reports/taskReport";
import UserReport from "./Reports/userReport";
import ItemReport from "./Reports/itemReport";
import PaymentReport from "./Reports/paymentReport";
import PriorityReport from "./Reports/priorityReport";
import AllBills from "./Reports/allBills";
import VendorBills from "./Reports/vendorBills";
import AllVendors from "./Reports/AllVendors";

/* ---------------------------- Edit Pages ------------------------------ */
import EditCustomer from "./Reports/editCustomer";
import EditTask from "./Reports/editTask";
import EditItem from "./Reports/editItem";
import EditUser from "./Reports/editUser";
import EditPayment from "./Reports/editPayment";
import EditPriority from "./Reports/editPriority";

/* ---------------------------- WhatsApp & Chat ------------------------- */
import SendMessage from "./Pages/SendMessage";
import SendMessageAll from "./Pages/SendMessageAll";
import WhatsAppLogin from "./Pages/WhatsAppLogin";
import WhatsAppSession from "./Pages/WhatsAppSession";
import WhatsAppAdminPanel from "./Pages/WhatsAppAdminPanel";
import WhatsAppCloudDashboard from "./Pages/WhatsAppCloudDashboard";

/* ---------------------------- Others ---------------------------------- */
import PendingTasks from "./Pages/PendingTasks";
import AllAttandance from "./Pages/AllAttandance";
import CashLedger from "./Pages/CashLedger";
import Vendor from "./Pages/vendor";
import MigrateOrders from "./Pages/MigrateOrders";
import PaymentFollowup from "./Pages/PaymentFollowup";
import AttendanceReport from "./Pages/AttendanceReport";
import SearchMobile from "./Pages/searchMobile";
import AddUsertask from "./Pages/addUsertask";
import CallLogs from "./Pages/callLogs";
import AdminHome from "./Pages/adminHome";
import VendorHome from "./Pages/vendorHome";
import AllTransactionOld from "./Reports/allTransactionOld";
import AddTransactionOld from "./Pages/addTransactionOld.jsx";
import AddTransaction1Old from "./Pages/addTransaction1Old.jsx";

function App() {
  useEffect(() => {
    if (import.meta.env.PROD) {
      const id = initVersionChecker();
      return () => clearInterval(id);
    }
  }, []);

  return (
    <Router>
      <ToastContainer />
      <div className="min-h-screen bg-background text-gray-900">
        <Routes>
          {/* ---------- Public (no layout) ---------- */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ---------- Protected (inside Layout with Sidebar) ---------- */}
          <Route element={<Layout />}>
            {/* Dashboard */}
            <Route path="/home" element={<Dashboard />} />

            {/* Core */}
            <Route path="/planner" element={<Planner />} />
            <Route path="/review" element={<Review />} />
            <Route path="/team" element={<Team />} />
            <Route path="/adminHome" element={<AdminHome />} />
            <Route path="/vendorHome" element={<VendorHome />} />

            {/* Master */}
            <Route path="/addCustomer" element={<AddCustomer />} />
            <Route path="/addCustgroup" element={<AddCustGroup />} />
            <Route path="/addUser" element={<AddUser />} />
            <Route path="/addUsergroup" element={<AddUserGroup />} />
            <Route path="/addItem" element={<AddItem />} />
            <Route path="/addItemgroup" element={<AddItemGroup />} />
            <Route path="/addTask" element={<AddTask />} />
            <Route path="/addTaskgroup" element={<AddTaskGroup />} />
            <Route path="/addPriority" element={<AddPriority />} />

            {/* Orders */}
            <Route path="/addOrder" element={<AddOrder />} />
            <Route path="/addOrder1" element={<AddOrder1 />} />
            <Route path="/allOrderT" element={<AllOrderTableView />} />
            <Route path="/allOrder" element={<AllOrder />} />
            <Route path="/allOrderM" element={<AllOrderMobile />} />
            <Route path="/allDelivery" element={<AllDelivery />} />
            <Route path="/orderUpdate/:id" element={<OrderUpdate />} />
            <Route path="/updateDelivery/:id" element={<UpdateDelivery />} />

            {/* Payments & Transactions */}
            <Route path="/addTransaction" element={<AddTransaction />} />
            <Route path="/addTransactionOld" element={<AddTransactionOld />} />
            <Route path="/addTransaction1" element={<AddTransaction1 />} />
            <Route path="/addTransaction1Old" element={<AddTransaction1Old />} />
            <Route path="/addPayment" element={<AddPayment />} />
            <Route path="/addRecievable" element={<AddRecievable />} />
            <Route path="/addPayable" element={<AddPayable />} />
            <Route path="/allTransaction" element={<AllTransaction />} />
            <Route path="/allTransaction1" element={<AllTransaction1 />} />
            <Route path="/allTransactionOld" element={<AllTransactionOld />} />
            <Route path="/allTransaction2" element={<AllTransaction2 />} />
            <Route path="/allTransaction3" element={<AllTransaction3 />} />
            <Route path="/allTransaction4D" element={<AllTransaction4D />} />

            {/* Reports */}
            <Route path="/customerReport" element={<CustomerReport />} />
            <Route path="/taskReport" element={<TaskReport />} />
            <Route path="/userReport" element={<UserReport />} />
            <Route path="/itemReport" element={<ItemReport />} />
            <Route path="/paymentReport" element={<PaymentReport />} />
            <Route path="/priorityReport" element={<PriorityReport />} />
            <Route path="/allBills" element={<AllBills />} />
            <Route path="/vendorBills" element={<VendorBills />} />
            <Route path="/AllVendors" element={<AllVendors />} />

            {/* WhatsApp */}
            <Route path="/SendMessage" element={<SendMessage />} />
            <Route path="/SendMessageAll" element={<SendMessageAll />} />
            <Route path="/WhatsAppLogin" element={<WhatsAppLogin />} />
            <Route path="/WhatsAppAdminPanel" element={<WhatsAppAdminPanel />} />
            <Route path="/WhatsAppSession" element={<WhatsAppSession />} />
            <Route path="/whatsapp-cloud" element={<WhatsAppCloudDashboard />} />

            {/* Others */}
            <Route path="/PendingTasks" element={<PendingTasks />} />
            <Route path="/AllAttandance" element={<AllAttandance />} />
            <Route path="/CashLedger" element={<CashLedger />} />
            <Route path="/addVendor" element={<Vendor />} />
            <Route path="/migrate-orders" element={<MigrateOrders />} />
            <Route path="/Followups" element={<PaymentFollowup />} />
            <Route path="/attendance-report" element={<AttendanceReport />} />
            <Route path="/customerMobile" element={<SearchMobile />} />
            <Route path="/addUsertask" element={<AddUsertask />} />
            <Route path="/calllogs" element={<CallLogs />} />

            {/* Edit */}
            <Route path="/editCustomer/:id" element={<EditCustomer />} />
            <Route path="/editTask/:id" element={<EditTask />} />
            <Route path="/editItem/:id" element={<EditItem />} />
            <Route path="/editUser/:id" element={<EditUser />} />
            <Route path="/editPayment/:id" element={<EditPayment />} />
            <Route path="/editPriority/:id" element={<EditPriority />} />

            {/* Redirect & 404 */}
            <Route path="/alltranscation1" element={<Navigate to="/allTransaction1" replace />} />
            <Route path="*" element={<div className="p-8">404 Not Found</div>} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
