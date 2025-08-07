import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

import UpdateDelivery from "../Pages/updateDelivery";

export default function AllDelivery() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [searchOrder, setSearchOrder] = useState("");
  const [filter, setFilter] = useState("");
  const [customers, setCustomers] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(20); // For lazy loading

  const formatDateDDMMYYYY = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date)) return "";
    return `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
  };

  useEffect(() => {
    setLoading(true);
    const fetchOrders = axios.get("http://localhost:10000/order/GetDeliveredList");
    console.log(fetchOrders);
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
      .catch((err) => console.log("Error fetching data:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredOrders = orders
    .map((order) => {
      const highestStatusTask = order.Status?.reduce((prev, current) =>
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

  const visibleOrders = filteredOrders.slice(0, visibleCount);

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
    const id = order._id || order.Order_id || null;
    if (!id) {
      alert("⚠️ Invalid order ID. Cannot open edit modal.");
      return;
    }
    setSelectedOrder({ ...order, _id: id });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedOrder(null);
  };

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

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Orders Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-9 gap-2">
              {visibleOrders.length > 0 ? (
                visibleOrders.map((order, index) => (
                  <div
                    key={index}
                    onClick={() => handleEditClick(order)}
                    className="bg-white border border-gray-200 hover:border-blue-500 rounded-lg p-2 shadow hover:shadow-md cursor-pointer transition"
                  >
                    <div className="text-blue-600 font-bold text-xl mb-1">
                      #{order.Order_Number}
                    </div>
                    <div className="text-gray-800 font-semibold text-md mb-1">
                      {order.Customer_name}
                    </div>
                    <div className="text-gray-600 text-sm">
                      Date {formatDateDDMMYYYY(order.highestStatusTask.Delivery_Date)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center text-gray-500 py-10">
                  No orders found
                </div>
              )}
            </div>

            {/* Load More */}
            {visibleCount < filteredOrders.length && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 20)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full shadow"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-4 max-w-3xl w-full">
            <UpdateDelivery mode="edit" order={selectedOrder} onClose={closeEditModal} />
          </div>
        </div>
      )}
    </>
  );
}
