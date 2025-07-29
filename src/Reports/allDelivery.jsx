import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

import UpdateDelivery from "../Pages/updateDelivery";
import AddOrder1 from "../Pages/addOrder1";

export default function AllDelivery() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [searchOrder, setSearchOrder] = useState("");
  const [filter, setFilter] = useState("");
  const [customers, setCustomers] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Helper to format dates as dd-mm-yyyy
  function formatDateDDMMYYYY(dateString) {
    const date = new Date(dateString);
    if (isNaN(date)) return ""; // fallback for invalid dates
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  function addOrder1() {
    navigate("/addOrder1");
  }

  useEffect(() => {
    const fetchOrders = axios.get("/order/GetDeliveredList");
    const fetchCustomers = axios.get("/customer/GetCustomersList");

    Promise.all([fetchOrders, fetchCustomers])
      .then(([ordersRes, customersRes]) => {
        if (ordersRes.data.success) {
          setOrders(ordersRes.data.result);
        } else {
          setOrders([]);
        }

        if (customersRes.data.success) {
          const customerMap = customersRes.data.result.reduce((acc, customer) => {
            if (customer.Customer_uuid && customer.Customer_name) {
              acc[customer.Customer_uuid] = customer.Customer_name;
            } else {
              console.warn("Invalid customer data:", customer);
            }
            return acc;
          }, {});
          setCustomers(customerMap);
        } else {
          setCustomers({});
        }
      })
      .catch((err) => console.log("Error fetching data:", err));
  }, []);

  const filteredOrders = orders
    .map((order) => {
      const highestStatusTask =
        order.Status.reduce((prev, current) =>
          prev.Status_number > current.Status_number ? prev : current,
        {}) || {};

      const customerName = customers[order.Customer_uuid] || "Unknown";

      return {
        ...order,
        highestStatusTask,
        Customer_name: customerName,
      };
    })
    .filter((order) => {
      const matchesSearch = order.Customer_name
        .toLowerCase()
        .includes(searchOrder.toLowerCase());

      const task = (order.highestStatusTask.Task || "").trim().toLowerCase();
      const filterValue = filter.trim().toLowerCase();
      const matchesFilter = filterValue === "" || task === filterValue;

      return matchesSearch && matchesFilter;
    });

  // PDF Export function
  const exportPDF = () => {
    const doc = new jsPDF();

    const tableColumn = [
      "Order Number",
      "Customer Name",
      "Created Date",
      "Remark",
      "Delivery Date",
      "Assigned",
      "Highest Status Task",
    ];

    const tableRows = [];

    filteredOrders.forEach((order) => {
      const orderData = [
        order.Order_Number,
        order.Customer_name,
        formatDateDDMMYYYY(order.createdAt),
        order.Remark || "",
        formatDateDDMMYYYY(order.highestStatusTask.Delivery_Date),
        order.highestStatusTask.Assigned || "",
        order.highestStatusTask.Task || "",
      ];
      tableRows.push(orderData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.text("Orders Report", 14, 15);
    doc.save("orders_report.pdf");
  };

  // Excel Export function
  const exportExcel = () => {
    const worksheetData = filteredOrders.map((order) => ({
      "Order Number": order.Order_Number,
      "Customer Name": order.Customer_name,
      "Created Date": formatDateDDMMYYYY(order.createdAt),
      Remark: order.Remark || "",
      "Delivery Date": formatDateDDMMYYYY(order.highestStatusTask.Delivery_Date),
      Assigned: order.highestStatusTask.Assigned || "",
      "Highest Status Task": order.highestStatusTask.Task || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    XLSX.writeFile(workbook, "orders_report.xlsx");
  };

  const handleEditClick = (order) => {
    setSelectedOrder(order);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedOrder(null);
  };

  const handleOrder = () => {
    setShowOrderModal(true);
  };

  const closeModal = () => {
    setShowOrderModal(false);
  };

  return (
    <>
      <div className="pt-12 pb-20  max-w-8xl mx-auto px-2">
        <div className="flex flex-wrap bg-white w-full p-2 mb-2 rounded-lg shadow">
          <input
            type="text"
            placeholder="Search by Customer Name"
            className="form-control text-black bg-gray-100 rounded-full flex-grow px-2 py-2"
            value={searchOrder}
            onChange={(e) => setSearchOrder(e.target.value)}
          />
          
        </div>
      <main className="flex-1 overflow-y-auto w-full px-1 md:px-2 lg:px-4">
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-2 w-full">
    {filteredOrders.length > 0 ? (
      filteredOrders.map((order, index) => (
        <div
          key={index}
          onClick={() => handleEditClick(order)}
          className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition w-full"
        >
          <div className="bg-gray-100 text-black rounded-full w-10 h-10 flex items-center justify-center font-bold mb-2">
            {order.Order_Number}
          </div>
          <div>
            <h3 className="text-md font-semibold text-black">
              {order.Customer_name}
            </h3>
            <p className="text-sm text-gray-600">
              {formatDateDDMMYYYY(order.createdAt)} - {order.Remark}
            </p>
            <p className="text-sm text-gray-700 mt-2">
              Delivery: {formatDateDDMMYYYY(order.highestStatusTask.Delivery_Date)}
              <br />
              Assigned: {order.highestStatusTask.Assigned}
            </p>
          </div>
        </div>
      ))
    ) : (
      <div className="col-span-full text-center">No orders found</div>
    )}
  </div>
  <button
            onClick={exportPDF}
            className="ml-2 bg-red-600 text-white rounded px-4 py-2 hover:bg-red-700 transition"
            title="Export PDF"
          >
            Export PDF
          </button>
          <button
            onClick={exportExcel}
            className="ml-2 bg-green-600 text-white rounded px-4 py-2 hover:bg-green-700 transition"
            title="Export Excel"
          >
            Export Excel
          </button>
</main>



        <div className="fixed bottom-20 right-8">
          <button
            onClick={handleOrder}
            className="w-12 h-12 bg-green-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-green-600 transition"
            title="Add New Order"
          >
            <svg
              className="h-8 w-8 text-white-500"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <line x1="9" y1="12" x2="15" y2="12" />
              <line x1="12" y1="9" x2="12" y2="15" />
            </svg>
          </button>
        </div>
      </div>

      {showOrderModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <AddOrder1 closeModal={closeModal} />
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center ">
          <UpdateDelivery order={selectedOrder} onClose={closeEditModal} />
        </div>
      )}

    </>
  );
}
