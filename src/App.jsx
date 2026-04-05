import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import './apiClient.js';
import Layout from './Pages/Layout';
import { initVersionChecker } from './utils/versionChecker';
import { ToastContainer } from './Components';
import { ROUTE_ALIASES, ROUTES } from './constants/routes';

const Login = lazy(() => import('./Pages/login'));
const Register = lazy(() => import('./Pages/Register'));
const Planner = lazy(() => import('./Pages/Planner'));
const Review = lazy(() => import('./Pages/Review'));
const Team = lazy(() => import('./Pages/Team'));
const Dashboard = lazy(() => import('./Pages/Dashboard'));
const AddCustomer = lazy(() => import('./Pages/addCustomer'));
const AddCustGroup = lazy(() => import('./Pages/addCustomergroup'));
const AddUser = lazy(() => import('./Pages/addUser'));
const AddUserGroup = lazy(() => import('./Pages/addUsergroup'));
const AddItem = lazy(() => import('./Pages/addItem'));
const AddItemGroup = lazy(() => import('./Pages/addItemgroup'));
const AddTask = lazy(() => import('./Pages/addTask'));
const AddTaskGroup = lazy(() => import('./Pages/addTaskgroup'));
const AddPriority = lazy(() => import('./Pages/addPriority'));
const AddOrder1 = lazy(() => import('./Pages/addOrder1'));
const AllOrderTableView = lazy(() => import('./Reports/AllOrderTableView'));
const AllOrder = lazy(() => import('./Reports/allOrder'));
const AllOrderMobile = lazy(() => import('./Reports/allOrderMobile'));
const AllDelivery = lazy(() => import('./Reports/allDelivery'));
const OrderUpdate = lazy(() => import('./Pages/OrderUpdate'));
const UpdateDelivery = lazy(() => import('./Pages/updateDelivery'));
const AddEnquiry = lazy(() => import('./Pages/addEnquiry'));
const AddPayment = lazy(() => import('./Pages/addPayment'));
const AddTransaction = lazy(() => import('./Pages/AddTransaction'));
const AddTransaction1 = lazy(() => import('./Pages/addTransaction1'));
const AddRecievable = lazy(() => import('./Pages/addRecievable'));
const AddPayable = lazy(() => import('./Pages/addPayable'));
const AllTransaction = lazy(() => import('./Reports/allTransaction'));
const AllTransaction1 = lazy(() => import('./Reports/allTransaction1'));
const AllTransaction2 = lazy(() => import('./Reports/allTransaction2'));
const AllTransaction3 = lazy(() => import('./Reports/allTransaction3'));
const AllTransaction4D = lazy(() => import('./Reports/allTransaction4D'));
const CustomerReport = lazy(() => import('./Reports/customerReport'));
const TaskReport = lazy(() => import('./Reports/taskReport'));
const UserReport = lazy(() => import('./Reports/userReport'));
const ItemReport = lazy(() => import('./Reports/itemReport'));
const PaymentReport = lazy(() => import('./Reports/paymentReport'));
const PriorityReport = lazy(() => import('./Reports/priorityReport'));
const AllBills = lazy(() => import('./Reports/allBills'));
const VendorBills = lazy(() => import('./Reports/vendorBills'));
const AllVendors = lazy(() => import('./Reports/AllVendors'));
const EditCustomer = lazy(() => import('./Reports/editCustomer'));
const EditTask = lazy(() => import('./Reports/editTask'));
const EditItem = lazy(() => import('./Reports/editItem'));
const EditUser = lazy(() => import('./Reports/editUser'));
const EditPayment = lazy(() => import('./Reports/editPayment'));
const EditPriority = lazy(() => import('./Reports/editPriority'));
const SendMessage = lazy(() => import('./Pages/SendMessage'));
const SendMessageAll = lazy(() => import('./Pages/SendMessageAll'));
const WhatsAppLogin = lazy(() => import('./Pages/WhatsAppLogin'));
const WhatsAppSession = lazy(() => import('./Pages/WhatsAppSession'));
const WhatsAppAdminPanel = lazy(() => import('./Pages/WhatsAppAdminPanel'));
const WhatsAppCloudDashboard = lazy(() => import('./Pages/WhatsAppCloudDashboard'));
const PendingTasks = lazy(() => import('./Pages/PendingTasks'));
const AllAttandance = lazy(() => import('./Pages/AllAttandance'));
const CashLedger = lazy(() => import('./Pages/CashLedger'));
const Vendor = lazy(() => import('./Pages/vendor'));
const MigrateOrders = lazy(() => import('./Pages/MigrateOrders'));
const PaymentFollowup = lazy(() => import('./Pages/PaymentFollowup'));
const AttendanceReport = lazy(() => import('./Pages/AttendanceReport'));
const SearchMobile = lazy(() => import('./Pages/searchMobile'));
const AddUsertask = lazy(() => import('./Pages/addUsertask'));
const AddNote = lazy(() => import('./Pages/addNote'));
const CallLogs = lazy(() => import('./Pages/callLogs'));
const AdminHome = lazy(() => import('./Pages/adminHome'));
const VendorHome = lazy(() => import('./Pages/vendorHome'));
const FlowBuilderPage = lazy(() => import('./Pages/FlowBuilderPage'));
const OrderKanban = lazy(() => import('./Pages/OrderKanban'));
const CustomerDetails = lazy(() => import('./Pages/CustomerDetails'));

function RouteLoader() {
  return (
    <Stack alignItems="center" justifyContent="center" minHeight="50vh" spacing={2}>
      <CircularProgress size={32} />
      <Typography variant="body2" color="text.secondary">
        Loading page...
      </Typography>
    </Stack>
  );
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
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
        <Routes>
          <Route path={ROUTES.ROOT} element={withSuspense(<Login />)} />
          <Route path={ROUTES.LOGIN} element={withSuspense(<Login />)} />
          <Route path={ROUTES.REGISTER} element={withSuspense(<Register />)} />

          <Route element={<Layout />}>
            <Route path={ROUTES.HOME} element={withSuspense(<Dashboard />)} />
            <Route path="/planner" element={withSuspense(<Planner />)} />
            <Route path="/review" element={withSuspense(<Review />)} />
            <Route path="/team" element={withSuspense(<Team />)} />
            <Route path="/adminHome" element={withSuspense(<AdminHome />)} />
            <Route path="/vendorHome" element={withSuspense(<VendorHome />)} />
            <Route path={ROUTES.ADD_CUSTOMER} element={withSuspense(<AddCustomer />)} />
            <Route path="/addCustgroup" element={withSuspense(<AddCustGroup />)} />
            <Route path={ROUTES.ADD_USER} element={withSuspense(<AddUser />)} />
            <Route path={ROUTES.ADD_USER_GROUP} element={withSuspense(<AddUserGroup />)} />
            <Route path={ROUTES.ADD_ITEM} element={withSuspense(<AddItem />)} />
            <Route path={ROUTES.ADD_ITEM_GROUP} element={withSuspense(<AddItemGroup />)} />
            <Route path={ROUTES.ADD_TASK} element={withSuspense(<AddTask />)} />
            <Route path={ROUTES.ADD_TASK_GROUP} element={withSuspense(<AddTaskGroup />)} />
            <Route path="/addPriority" element={withSuspense(<AddPriority />)} />
            <Route path={ROUTES.ADD_ORDER} element={withSuspense(<AddOrder1 />)} />
            <Route path={ROUTES.ADD_ORDER_V2} element={<Navigate to={ROUTES.ADD_ORDER} replace />} />
            <Route path="/allOrderT" element={withSuspense(<AllOrderTableView />)} />
            <Route path="/allOrder" element={withSuspense(<AllOrder />)} />
            <Route path="/allOrderM" element={withSuspense(<AllOrderMobile />)} />
            <Route path="/allDelivery" element={withSuspense(<AllDelivery />)} />
            <Route path="/orderUpdate/:id" element={withSuspense(<OrderUpdate />)} />
            <Route path="/updateDelivery/:id" element={withSuspense(<UpdateDelivery />)} />
            <Route path={ROUTES.ADD_ENQUIRY} element={withSuspense(<AddEnquiry />)} />
            <Route path={ROUTES.ADD_NOTE} element={withSuspense(<AddNote />)} />
            <Route path={ROUTE_ALIASES.ADD_NOTE_LOWER} element={<Navigate to={ROUTES.ADD_NOTE} replace />} />
            <Route path="/addTransaction" element={withSuspense(<AddTransaction />)} />
            <Route path="/addTransactionOld" element={<Navigate to="/addTransaction1" replace />} />
            <Route path="/addTransaction1" element={withSuspense(<AddTransaction1 />)} />
            <Route path="/addTransaction1Old" element={<Navigate to="/addTransaction1" replace />} />
            <Route path="/addPayment" element={withSuspense(<AddPayment />)} />
            <Route path={ROUTES.ADD_RECEIVABLE} element={withSuspense(<AddRecievable />)} />
            <Route path={ROUTES.ADD_PAYABLE} element={withSuspense(<AddPayable />)} />
            <Route path={ROUTES.ALL_TRANSACTION} element={withSuspense(<AllTransaction />)} />
            <Route path={ROUTES.ALL_TRANSACTION_1} element={withSuspense(<AllTransaction1 />)} />
            <Route path="/allTransactionOld" element={<Navigate to={ROUTES.ALL_TRANSACTION} replace />} />
            <Route path={ROUTES.ALL_TRANSACTION_2} element={withSuspense(<AllTransaction2 />)} />
            <Route path="/allTransaction3" element={withSuspense(<AllTransaction3 />)} />
            <Route path="/allTransaction4D" element={withSuspense(<AllTransaction4D />)} />
            <Route path="/customerReport" element={withSuspense(<CustomerReport />)} />
            <Route path="/taskReport" element={withSuspense(<TaskReport />)} />
            <Route path="/userReport" element={withSuspense(<UserReport />)} />
            <Route path="/itemReport" element={withSuspense(<ItemReport />)} />
            <Route path={ROUTES.PAYMENT_REPORT} element={withSuspense(<PaymentReport />)} />
            <Route path={ROUTES.PRIORITY_REPORT} element={withSuspense(<PriorityReport />)} />
            <Route path={ROUTES.ALL_BILLS} element={withSuspense(<AllBills />)} />
            <Route path={ROUTES.VENDOR_BILLS} element={withSuspense(<VendorBills />)} />
            <Route path={ROUTES.ALL_VENDORS} element={withSuspense(<AllVendors />)} />
            <Route path="/SendMessage" element={withSuspense(<SendMessage />)} />
            <Route path="/SendMessageAll" element={withSuspense(<SendMessageAll />)} />
            <Route path="/WhatsAppLogin" element={withSuspense(<WhatsAppLogin />)} />
            <Route path="/WhatsAppAdminPanel" element={withSuspense(<WhatsAppAdminPanel />)} />
            <Route path="/WhatsAppSession" element={withSuspense(<WhatsAppSession />)} />
            <Route path={ROUTES.WHATSAPP_CLOUD} element={withSuspense(<WhatsAppCloudDashboard />)} />
            <Route path={ROUTES.PENDING_TASKS} element={withSuspense(<PendingTasks />)} />
            <Route path="/AllAttandance" element={withSuspense(<AllAttandance />)} />
            <Route path="/CashLedger" element={withSuspense(<CashLedger />)} />
            <Route path="/addVendor" element={withSuspense(<Vendor />)} />
            <Route path="/migrate-orders" element={withSuspense(<MigrateOrders />)} />
            <Route path="/Followups" element={withSuspense(<PaymentFollowup />)} />
            <Route path={ROUTES.ATTENDANCE_REPORT} element={withSuspense(<AttendanceReport />)} />
            <Route path="/customerMobile" element={withSuspense(<SearchMobile />)} />
            <Route path="/addUsertask" element={withSuspense(<AddUsertask />)} />
            <Route path={ROUTES.CALL_LOGS} element={withSuspense(<CallLogs />)} />
            <Route path={ROUTES.FLOW_BUILDER} element={withSuspense(<FlowBuilderPage />)} />
            <Route path={ROUTES.ORDER_KANBAN} element={withSuspense(<OrderKanban />)} />
            <Route path={ROUTES.CUSTOMER_360} element={withSuspense(<CustomerDetails />)} />
            <Route path={`${ROUTES.CUSTOMER_360}/:id`} element={withSuspense(<CustomerDetails />)} />
            <Route path="/editCustomer/:id" element={withSuspense(<EditCustomer />)} />
            <Route path="/editTask/:id" element={withSuspense(<EditTask />)} />
            <Route path="/editItem/:id" element={withSuspense(<EditItem />)} />
            <Route path="/editUser/:id" element={withSuspense(<EditUser />)} />
            <Route path="/editPayment/:id" element={withSuspense(<EditPayment />)} />
            <Route path="/editPriority/:id" element={withSuspense(<EditPriority />)} />
            <Route path={ROUTE_ALIASES.ADD_CUSTOMER_LOWER} element={<Navigate to={ROUTES.ADD_CUSTOMER} replace />} />
            <Route path={ROUTE_ALIASES.ADD_ITEM_LOWER} element={<Navigate to={ROUTES.ADD_ITEM} replace />} />
            <Route path={ROUTE_ALIASES.ADD_TASK_LOWER} element={<Navigate to={ROUTES.ADD_TASK} replace />} />
            <Route path={ROUTE_ALIASES.ADD_USER_LOWER} element={<Navigate to={ROUTES.ADD_USER} replace />} />
            <Route path={ROUTE_ALIASES.ADD_USER_GROUP_LOWER} element={<Navigate to={ROUTES.ADD_USER_GROUP} replace />} />
            <Route path={ROUTE_ALIASES.ADD_ORDER_V2_LOWER} element={<Navigate to={ROUTES.ADD_ORDER_V2} replace />} />
            <Route path={ROUTE_ALIASES.ALL_BILLS_LOWER} element={<Navigate to={ROUTES.ALL_BILLS} replace />} />
            <Route path={ROUTE_ALIASES.ADD_ENQUIRY_LOWER} element={<Navigate to={ROUTES.ADD_ENQUIRY} replace />} />
            <Route path={ROUTE_ALIASES.PENDING_TASK_LOWER} element={<Navigate to={ROUTES.PENDING_TASKS} replace />} />
            <Route path={ROUTE_ALIASES.ATTENDANCE_REPORT_MIXED} element={<Navigate to={ROUTES.ATTENDANCE_REPORT} replace />} />
            <Route path={ROUTE_ALIASES.ADD_PAYABLE_TYPO} element={<Navigate to={ROUTES.ADD_PAYABLE} replace />} />
            <Route path={ROUTE_ALIASES.ALL_TRANSACTION_2_LOWER} element={<Navigate to={ROUTES.ALL_TRANSACTION_2} replace />} />
            <Route path={ROUTE_ALIASES.ALL_TRANSACTION_1_TYPO} element={<Navigate to={ROUTES.ALL_TRANSACTION_1} replace />} />
            <Route
              path="*"
              element={
                <Stack alignItems="center" justifyContent="center" minHeight="50vh" spacing={1}>
                  <Typography variant="h5">404</Typography>
                  <Typography color="text.secondary">Page not found</Typography>
                </Stack>
              }
            />
          </Route>
        </Routes>
      </Box>
    </Router>
  );
}

export default App;
