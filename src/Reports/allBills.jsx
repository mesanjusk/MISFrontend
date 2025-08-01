import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import BillUpdate from "../Reports/billUpdate";
import AddOrder1 from "../Pages/addOrder1";
import OrderStepsModal from "../Components/OrderStepsModal";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function AllBills() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [searchOrder, setSearchOrder] = useState("");
  const [filter, setFilter] = useState("");
  const [customers, setCustomers] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showStepsModal, setShowStepsModal] = useState(false);
  const [stepsOrder, setStepsOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = axios.get("/order/GetBillList");
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
      const highestStatusTask = order.Status.reduce(
        (prev, current) =>
          prev.Status_number > current.Status_number ? prev : current,
        {}
      );
      return {
        ...order,
        highestStatusTask,
        Customer_name: customers[order.Customer_uuid] || "Unknown",
      };
    })
    .filter((order) => {
      const matchesSearch = order.Customer_name
        .toLowerCase()
        .includes(searchOrder.toLowerCase());
      const task = (order.highestStatusTask.Task || "").toLowerCase().trim();
      const filterValue = filter.toLowerCase().trim();
      return matchesSearch && (filterValue === "" || task === filterValue);
    });

  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = [
      "Order #",
      "Customer",
      "Created At",
      "Remark",
      "Assigned",
      "Delivery",
    ];
    const tableRows = [];

    filteredOrders.forEach((order) => {
      tableRows.push([
        order.Order_Number,
        order.Customer_name,
        new Date(order.createdAt).toLocaleDateString(),
        order.Remark || "-",
        order.highestStatusTask?.Assigned || "",
        order.highestStatusTask?.Delivery_Date
          ? new Date(order.highestStatusTask.Delivery_Date).toLocaleDateString()
          : "",
      ]);
    });

    doc.text("Bill Report", 14, 15);
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save("bill_report.pdf");
  };

  const exportToExcel = () => {
    const data = filteredOrders.map((order) => ({
      "Order Number": order.Order_Number,
      "Customer Name": order.Customer_name,
      "Created At": new Date(order.createdAt).toLocaleDateString(),
      Remark: order.Remark || "-",
      Assigned: order.highestStatusTask?.Assigned || "",
      "Delivery Date": order.highestStatusTask?.Delivery_Date
        ? new Date(order.highestStatusTask.Delivery_Date).toLocaleDateString()
        : "",
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bills");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const file = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(file, "bill_report.xlsx");
  };

  const handleEditClick = (order) => {
    setSelectedOrder(order);
    setShowEditModal(true);
  };

  const handleStepsClick = (e, order) => {
    e.stopPropagation();
    setStepsOrder(order);
    setShowStepsModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedOrder(null);
  };

  const closeStepsModal = () => {
    setShowStepsModal(false);
    setStepsOrder(null);
  };

  const handleOrder = () => setShowOrderModal(true);
  const closeModal = () => setShowOrderModal(false);

  return (
    <>
      <div className="pt-14 pb-20 max-w-8xl mx-auto px-4">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between gap-2 mb-4 items-center">
          <input
            type="text"
            placeholder="Search by customer name"
            className="form-control text-black bg-gray-100 rounded-full px-4 py-2 w-full max-w-md"
            value={searchOrder}
            onChange={(e) => setSearchOrder(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={exportToPDF}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Export PDF
            </button>
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Export Excel
            </button>
          </div>
        </div>

        {/* Orders Grid */}
        <main className="p-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order, index) => (
                <div
                  key={index}
                  onClick={() => handleEditClick(order)}
                  className="relative bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer"
                >
                  <button
                    className="absolute top-2 right-2 text-xs bg-blue-500 text-white px-2 py-1 rounded"
                    onClick={(e) => handleStepsClick(e, order)}
                  >
                    Steps
                  </button>
                  <div className="text-gray-900 font-bold text-lg">
                    #{order.Order_Number}
                  </div>
                  <div className="text-gray-700 font-medium">
                    {order.Customer_name}
                  </div>
                  <div className="text-gray-500 text-sm mb-2">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-600 italic">
                    {order.Remark || "-"}
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>👤 Assigned: {order.highestStatusTask?.Assigned || "N/A"}</p>
                    <p>
                      📅 Delivery:{" "}
                      {order.highestStatusTask?.Delivery_Date
                        ? new Date(order.highestStatusTask.Delivery_Date).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 py-10">
                No bills found
              </div>
            )}
          </div>
        </main>

       
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
            <BillUpdate order={selectedOrder} onClose={closeEditModal} />
          </div>
        </div>
      )}
      {showStepsModal && (
        <OrderStepsModal order={stepsOrder} onClose={closeStepsModal} />
      )}
    </>
  );
}
