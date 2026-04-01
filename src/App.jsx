import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import "./apiClient.js";
import Layout from "./Pages/Layout";
import { initVersionChecker } from "./utils/versionChecker";
import { ToastContainer } from "./Components";

const Login = lazy(() => import("./Pages/login"));
const Register = lazy(() => import("./Pages/Register"));
const Planner = lazy(() => import("./Pages/Planner"));
const Review = lazy(() => import("./Pages/Review"));
const Team = lazy(() => import("./Pages/Team"));
const Dashboard = lazy(() => import("./Pages/Dashboard"));
const AddCustomer = lazy(() => import("./Pages/addCustomer"));
const AddCustGroup = lazy(() => import("./Pages/addCustomergroup"));
const AddUser = lazy(() => import("./Pages/addUser"));
const AddUserGroup = lazy(() => import("./Pages/addUsergroup"));
const AddItem = lazy(() => import("./Pages/addItem"));
const AddItemGroup = lazy(() => import("./Pages/addItemgroup"));
const AddTask = lazy(() => import("./Pages/addTask"));
const AddTaskGroup = lazy(() => import("./Pages/addTaskgroup"));
const AddPriority = lazy(() => import("./Pages/addPriority"));
const AddOrder = lazy(() => import("./Pages/addOrder"));
const AddOrder1 = lazy(() => import("./Pages/addOrder1"));
const AllOrderTableView = lazy(() => import("./Reports/AllOrderTableView"));
const AllOrder = lazy(() => import("./Reports/allOrder"));
const AllOrderMobile = lazy(() => import("./Reports/allOrderMobile"));
const AllDelivery = lazy(() => import("./Reports/allDelivery"));
const OrderUpdate = lazy(() => import("./Pages/OrderUpdate"));
const UpdateDelivery = lazy(() => import("./Pages/updateDelivery"));
const AddEnquiry = lazy(() => import("./Pages/addEnquiry"));
const AddPayment = lazy(() => import("./Pages/addPayment"));
const AddTransaction = lazy(() => import("./Pages/AddTransaction"));
const AddTransaction1 = lazy(() => import("./Pages/addTransaction1"));
const AddRecievable = lazy(() => import("./Pages/addRecievable"));
const AddPayable = lazy(() => import("./Pages/addPayable"));
const AllTransaction = lazy(() => import("./Reports/allTransaction"));
const AllTransaction1 = lazy(() => import("./Reports/allTransaction1"));
const AllTransaction2 = lazy(() => import("./Reports/allTransaction2"));
const AllTransaction3 = lazy(() => import("./Reports/allTransaction3"));
const AllTransaction4D = lazy(() => import("./Reports/allTransaction4D"));
const CustomerReport = lazy(() => import("./Reports/customerReport"));
const TaskReport = lazy(() => import("./Reports/taskReport"));
const UserReport = lazy(() => import("./Reports/userReport"));
const ItemReport = lazy(() => import("./Reports/itemReport"));
const PaymentReport = lazy(() => import("./Reports/paymentReport"));
const PriorityReport = lazy(() => import("./Reports/priorityReport"));
const AllBills = lazy(() => import("./Reports/allBills"));
const VendorBills = lazy(() => import("./Reports/vendorBills"));
const AllVendors = lazy(() => import("./Reports/AllVendors"));
const EditCustomer = lazy(() => import("./Reports/editCustomer"));
const EditTask = lazy(() => import("./Reports/editTask"));
const EditItem = lazy(() => import("./Reports/editItem"));
const EditUser = lazy(() => import("./Reports/editUser"));
const EditPayment = lazy(() => import("./Reports/editPayment"));
const EditPriority = lazy(() => import("./Reports/editPriority"));
const SendMessage = lazy(() => import("./Pages/SendMessage"));
const SendMessageAll = lazy(() => import("./Pages/SendMessageAll"));
const WhatsAppLogin = lazy(() => import("./Pages/WhatsAppLogin"));
const WhatsAppSession = lazy(() => import("./Pages/WhatsAppSession"));
const WhatsAppAdminPanel = lazy(() => import("./Pages/WhatsAppAdminPanel"));
const WhatsAppCloudDashboard = lazy(() => import("./Pages/WhatsAppCloudDashboard"));
const PendingTasks = lazy(() => import("./Pages/PendingTasks"));
const AllAttandance = lazy(() => import("./Pages/AllAttandance"));
const CashLedger = lazy(() => import("./Pages/CashLedger"));
const Vendor = lazy(() => import("./Pages/vendor"));
const MigrateOrders = lazy(() => import("./Pages/MigrateOrders"));
const PaymentFollowup = lazy(() => import("./Pages/PaymentFollowup"));
const AttendanceReport = lazy(() => import("./Pages/AttendanceReport"));
const SearchMobile = lazy(() => import("./Pages/searchMobile"));
const AddUsertask = lazy(() => import("./Pages/addUsertask"));
const CallLogs = lazy(() => import("./Pages/callLogs"));
const AdminHome = lazy(() => import("./Pages/adminHome"));
const VendorHome = lazy(() => import("./Pages/vendorHome"));
const AllTransactionOld = lazy(() => import("./Reports/allTransactionOld"));
const AddTransactionOld = lazy(() => import("./Pages/addTransactionOld.jsx"));
const AddTransaction1Old = lazy(() => import("./Pages/addTransaction1Old.jsx"));
const FlowBuilderPage = lazy(() => import("./Pages/FlowBuilderPage"));
const OrderKanban = lazy(() => import("./Pages/OrderKanban"));
const CustomerDetails = lazy(() => import("./Pages/CustomerDetails"));

function RouteLoader() {
  return <div className="p-4 text-sm text-slate-600">Loading...</div>;
}

function withSuspense(element) {
  return <Suspense fallback={<RouteLoader />}>{element}</Suspense>;
}

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
          <Route path="/" element={withSuspense(<Login />)} />
          <Route path="/login" element={withSuspense(<Login />)} />
          <Route path="/register" element={withSuspense(<Register />)} />

          <Route element={<Layout />}>
            <Route path="/home" element={withSuspense(<Dashboard />)} />
            <Route path="/planner" element={withSuspense(<Planner />)} />
            <Route path="/review" element={withSuspense(<Review />)} />
            <Route path="/team" element={withSuspense(<Team />)} />
            <Route path="/adminHome" element={withSuspense(<AdminHome />)} />
            <Route path="/vendorHome" element={withSuspense(<VendorHome />)} />
            <Route path="/addCustomer" element={withSuspense(<AddCustomer />)} />
            <Route path="/addCustgroup" element={withSuspense(<AddCustGroup />)} />
            <Route path="/addUser" element={withSuspense(<AddUser />)} />
            <Route path="/addUsergroup" element={withSuspense(<AddUserGroup />)} />
            <Route path="/addItem" element={withSuspense(<AddItem />)} />
            <Route path="/addItemgroup" element={withSuspense(<AddItemGroup />)} />
            <Route path="/addTask" element={withSuspense(<AddTask />)} />
            <Route path="/addTaskgroup" element={withSuspense(<AddTaskGroup />)} />
            <Route path="/addPriority" element={withSuspense(<AddPriority />)} />
            <Route path="/addOrder" element={withSuspense(<AddOrder />)} />
            <Route path="/addOrder1" element={withSuspense(<AddOrder1 />)} />
            <Route path="/allOrderT" element={withSuspense(<AllOrderTableView />)} />
            <Route path="/allOrder" element={withSuspense(<AllOrder />)} />
            <Route path="/allOrderM" element={withSuspense(<AllOrderMobile />)} />
            <Route path="/allDelivery" element={withSuspense(<AllDelivery />)} />
            <Route path="/orderUpdate/:id" element={withSuspense(<OrderUpdate />)} />
            <Route path="/updateDelivery/:id" element={withSuspense(<UpdateDelivery />)} />
            <Route path="/addEnquiry" element={withSuspense(<AddEnquiry />)} />
            <Route path="/addTransaction" element={withSuspense(<AddTransaction />)} />
            <Route path="/addTransactionOld" element={withSuspense(<AddTransactionOld />)} />
            <Route path="/addTransaction1" element={withSuspense(<AddTransaction1 />)} />
            <Route path="/addTransaction1Old" element={withSuspense(<AddTransaction1Old />)} />
            <Route path="/addPayment" element={withSuspense(<AddPayment />)} />
            <Route path="/addRecievable" element={withSuspense(<AddRecievable />)} />
            <Route path="/addPayable" element={withSuspense(<AddPayable />)} />
            <Route path="/allTransaction" element={withSuspense(<AllTransaction />)} />
            <Route path="/allTransaction1" element={withSuspense(<AllTransaction1 />)} />
            <Route path="/allTransactionOld" element={withSuspense(<AllTransactionOld />)} />
            <Route path="/allTransaction2" element={withSuspense(<AllTransaction2 />)} />
            <Route path="/allTransaction3" element={withSuspense(<AllTransaction3 />)} />
            <Route path="/allTransaction4D" element={withSuspense(<AllTransaction4D />)} />
            <Route path="/customerReport" element={withSuspense(<CustomerReport />)} />
            <Route path="/taskReport" element={withSuspense(<TaskReport />)} />
            <Route path="/userReport" element={withSuspense(<UserReport />)} />
            <Route path="/itemReport" element={withSuspense(<ItemReport />)} />
            <Route path="/paymentReport" element={withSuspense(<PaymentReport />)} />
            <Route path="/priorityReport" element={withSuspense(<PriorityReport />)} />
            <Route path="/allBills" element={withSuspense(<AllBills />)} />
            <Route path="/vendorBills" element={withSuspense(<VendorBills />)} />
            <Route path="/AllVendors" element={withSuspense(<AllVendors />)} />
            <Route path="/SendMessage" element={withSuspense(<SendMessage />)} />
            <Route path="/SendMessageAll" element={withSuspense(<SendMessageAll />)} />
            <Route path="/WhatsAppLogin" element={withSuspense(<WhatsAppLogin />)} />
            <Route path="/WhatsAppAdminPanel" element={withSuspense(<WhatsAppAdminPanel />)} />
            <Route path="/WhatsAppSession" element={withSuspense(<WhatsAppSession />)} />
            <Route path="/whatsapp-cloud" element={withSuspense(<WhatsAppCloudDashboard />)} />
            <Route path="/PendingTasks" element={withSuspense(<PendingTasks />)} />
            <Route path="/AllAttandance" element={withSuspense(<AllAttandance />)} />
            <Route path="/CashLedger" element={withSuspense(<CashLedger />)} />
            <Route path="/addVendor" element={withSuspense(<Vendor />)} />
            <Route path="/migrate-orders" element={withSuspense(<MigrateOrders />)} />
            <Route path="/Followups" element={withSuspense(<PaymentFollowup />)} />
            <Route path="/attendance-report" element={withSuspense(<AttendanceReport />)} />
            <Route path="/customerMobile" element={withSuspense(<SearchMobile />)} />
            <Route path="/addUsertask" element={withSuspense(<AddUsertask />)} />
            <Route path="/calllogs" element={withSuspense(<CallLogs />)} />
            <Route path="/flow-builder" element={withSuspense(<FlowBuilderPage />)} />
            <Route path="/order-kanban" element={withSuspense(<OrderKanban />)} />
            <Route path="/customer-360" element={withSuspense(<CustomerDetails />)} />
            <Route path="/customer-360/:id" element={withSuspense(<CustomerDetails />)} />
            <Route path="/editCustomer/:id" element={withSuspense(<EditCustomer />)} />
            <Route path="/editTask/:id" element={withSuspense(<EditTask />)} />
            <Route path="/editItem/:id" element={withSuspense(<EditItem />)} />
            <Route path="/editUser/:id" element={withSuspense(<EditUser />)} />
            <Route path="/editPayment/:id" element={withSuspense(<EditPayment />)} />
            <Route path="/editPriority/:id" element={withSuspense(<EditPriority />)} />
            <Route path="/alltranscation1" element={<Navigate to="/allTransaction1" replace />} />
            <Route path="*" element={<div className="p-8">404 Not Found</div>} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
