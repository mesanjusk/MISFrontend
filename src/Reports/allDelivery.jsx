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

  const formatDateDDMMYYYY = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date)) return "";
    return `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
  };

  useEffect(() => {
    const fetchOrders = axios.get("/order/GetDeliveredList");
    const fetchCustomers = axios.get("/customer/GetCustomersList");

    Promise.all([fetchOrders, fetchCustomers])
      .then(([ordersRes, customersRes]) => {
        setOrders(ordersRes.data.success ? ordersRes.data.result : []);
        if (customersRes.data.success) {
          const customerMap = customersRes.data.result.reduce((acc, c) => {
            if (c.Customer_uuid && c.Customer_name) {
              acc[c.Customer_uuid] = c.Customer_name;
            }
            return acc;
          }, {});
          setCustomers(customerMap);
        }
      })
      .catch((err) => console.log("Error fetching data:", err));
  }, []);

  const filteredOrders = orders
    .map((order) => {
      const highestStatusTask = order.Status.reduce((prev, current) =>
        prev.Status_number > current.Status_number ? prev : current, {}) || {};
      return {
        ...order,
        highestStatusTask,
        Customer_name: customers[order.Customer_uuid] || "Unknown",
      };
    })
    .filter((order) => {
      const matchesSearch = order.Customer_name.toLowerCase().includes(searchOrder.toLowerCase());
      const task = (order.highestStatusTask.Task || "").toLowerCase().trim();
      const filterValue = filter.toLowerCase().trim();
      return matchesSearch && (filterValue === "" || task === filterValue);
    });

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Orders Report", 14, 15);
    doc.autoTable({
      head: [["Order Number", "Customer Name", "Created Date", "Remark", "Delivery Date", "Assigned", "Highest Status Task"]],
      body: filteredOrders.map((order) => [
        order.Order_Number,
        order.Customer_name,
        formatDateDDMMYYYY(order.createdAt),
        order.Remark || "",
        formatDateDDMMYYYY(order.highestStatusTask.Delivery_Date),
        order.highestStatusTask.Assigned || "",
        order.highestStatusTask.Task || "",
      ]),
      startY: 20,
    });
    doc.save("orders_report.pdf");
  };

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

  const handleOrder = () => setShowOrderModal(true);
  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedOrder(null);
  };
  const closeModal = () => setShowOrderModal(false);

  return (
    <>
      <div className="max-w-8xl mx-auto p-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
          <div className="flex flex-grow items-center gap-2">
            <input
              type="text"
              placeholder="Search by customer name"
              className="bg-white shadow-sm border border-gray-300 rounded-full px-4 py-2 w-full max-w-md focus:outline-none"
              value={searchOrder}
              onChange={(e) => setSearchOrder(e.target.value)}
            />
          </div>
          <div className="flex gap-2 mt-2 md:mt-0">
            <button
              onClick={exportPDF}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow transition"
              title="Export as PDF"
            >
              Export PDF
            </button>
            <button
              onClick={exportExcel}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow transition"
              title="Export as Excel"
            >
              Export Excel
            </button>
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order, index) => (
              <div
                key={index}
                onClick={() => handleEditClick(order)}
                className="bg-white border border-gray-200 hover:border-blue-500 rounded-lg p-4 shadow hover:shadow-md cursor-pointer transition"
              >
                <div className="text-blue-600 font-bold text-xl mb-2">
                  #{order.Order_Number}
                </div>
                <div className="text-gray-800 font-semibold text-md">
                  {order.Customer_name}
                </div>
                <div className="text-gray-500 text-sm">
                  Created: {formatDateDDMMYYYY(order.createdAt)}
                </div>
                <div className="text-gray-600 mt-1 text-sm">
                  Remark: {order.Remark || "-"}
                </div>
                <div className="mt-2 text-sm">
                  <p>🗓 Delivery: {formatDateDDMMYYYY(order.highestStatusTask.Delivery_Date)}</p>
                  <p>👤 Assigned: {order.highestStatusTask.Assigned || "N/A"}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 py-10">
              No orders found
            </div>
          )}
        </div>

        
        </div>
      

      {/* Modals */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-4 max-w-2xl w-full">
            <AddOrder1 closeModal={closeModal} />
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-4 max-w-3xl w-full">
            <UpdateDelivery order={selectedOrder} onClose={closeEditModal} />
          </div>
        </div>
      )}
    </>
  );
}
