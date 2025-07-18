import React, { useState, useEffect } from "react";
import axios from "axios";
import TopNavbar from "../Pages/topNavbar";
import Footer from "../Pages/footer";

export default function CancelledOrderTable() {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const res = await axios.get("/order/GetOrderList");
                if (res.data.success) {
                    setOrders(res.data.result);
                } else {
                    setOrders([]);
                }
            } catch {
                setOrders([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Find latest status (by Status_number) and filter for cancel
    const cancelledOrders = orders.filter(order => {
        if (!order.Status || order.Status.length === 0) return false;
        const latestStatus = order.Status.reduce((prev, curr) =>
            prev.Status_number > curr.Status_number ? prev : curr
        );
        return (latestStatus.Status || "").toLowerCase() === "cancel";
    });

    return (
        <>
            <div className="bg-[#e5ddd5] min-h-screen">
                <TopNavbar />
                <div className="pt-2 pb-2">
                    <main className="flex flex-1 p-2 overflow-x-auto">
                        <div className="w-full mx-auto">
                            {isLoading ? (
                                <div className="text-center text-gray-400 py-10">Loading...</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full bg-white rounded-xl shadow-lg">
                                        <thead>
                                            <tr className="bg-red-200 text-red-900">
                                                <th className="py-2 px-3 text-left">Order #</th>
                                                <th className="py-2 px-3 text-left">Order Date</th>
                                                <th className="py-2 px-3 text-left">Customer UUID</th>
                                                <th className="py-2 px-3 text-left">Remark</th>
                                                <th className="py-2 px-3 text-left">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cancelledOrders.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="text-center text-gray-400 py-10">
                                                        No cancelled orders found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                cancelledOrders.map((order) => {
                                                    const latestStatus = order.Status.reduce((prev, curr) =>
                                                        prev.Status_number > curr.Status_number ? prev : curr
                                                    );
                                                    return (
                                                        <tr key={order.Order_uuid} className="border-b hover:bg-red-50">
                                                            <td className="py-2 px-3 font-bold">{order.Order_Number}</td>
                                                            <td className="py-2 px-3">
                                                                {latestStatus.CreatedAt
                                                                    ? new Date(latestStatus.CreatedAt).toLocaleDateString()
                                                                    : (order.OrderDate
                                                                        ? new Date(order.OrderDate).toLocaleDateString()
                                                                        : "")}
                                                            </td>
                                                            <td className="py-2 px-3">{order.Customer_uuid}</td>
                                                            <td className="py-2 px-3">{order.Remark || latestStatus.Remark || ""}</td>
                                                            <td className="py-2 px-3 text-red-700 font-semibold">{latestStatus.Status}</td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
                <Footer />
            </div>
        </>
    );
}
