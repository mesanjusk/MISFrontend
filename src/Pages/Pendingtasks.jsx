import React from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function PendingTasks({ tasks = [], isLoading, onTaskClick }) {
  const pendingTasks = tasks.filter((task) => task.Status === "Pending");

  return (
    <div className="w-full max-w-screen-xl mx-auto">
      <SkeletonTheme>
        {isLoading ? (
          Array(5)
            .fill()
            .map((_, index) => (
              <Skeleton
                key={index}
                height={80}
                width="100%"
                style={{ marginBottom: "10px" }}
              />
            ))
        ) : (
          <div>
            {pendingTasks.map((taskGroup) => {
              const taskGroupOrders = pendingTasks.filter(
                (order) => order.highestStatusTask?.Task === taskGroup
              );

              if (taskGroupOrders.length === 0) return null;

              return (
                <div
                  key={taskGroup}
                  className="mb-6 p-4 bg-[#e5ddd5] rounded-lg shadow-lg"
                >
                  <h3 className="font-semibold text-lg text-green-700 mb-3">
                    {taskGroup}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {taskGroupOrders.map((order) => {
                      const latestStatusDateRaw = order.highestStatusTask?.CreatedAt;
                      const latestStatusDate = latestStatusDateRaw
                        ? new Date(latestStatusDateRaw)
                        : null;
                      const currentDate = new Date();

                      let timeDifference = 0;
                      if (latestStatusDate) {
                        const current = new Date(
                          currentDate.setHours(0, 0, 0, 0)
                        );
                        const latest = new Date(
                          latestStatusDate.setHours(0, 0, 0, 0)
                        );
                        const diffTime = current - latest;
                        timeDifference = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                      }

                      let cardClass = "bg-white";
                      if (timeDifference === 0) {
                        cardClass = "bg-green-100";
                      } else if (timeDifference === 1) {
                        cardClass = "bg-yellow-100";
                      } else if (timeDifference >= 2) {
                        cardClass = "bg-red-100";
                      }

                      return (
                        <div
                          key={order.Order_uuid}
                          className={`${cardClass} rounded-lg p-4 cursor-pointer hover:bg-green-50 transition-all shadow-sm`}
                          onClick={() => onTaskClick(order)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full text-sm font-bold text-green-800">
                              {order.Order_Number}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <div className="font-semibold text-gray-800 truncate">
                                  {order.Customer_name}
                                </div>
                                <div
                                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                    timeDifference === 0
                                      ? "bg-green-200 text-green-800"
                                      : timeDifference === 1
                                      ? "bg-yellow-200 text-yellow-800"
                                      : "bg-red-200 text-red-800"
                                  }`}
                                >
                                  {timeDifference === 0
                                    ? "Today"
                                    : timeDifference === 1
                                    ? "1 day delay"
                                    : `${timeDifference} days delay`}
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                {latestStatusDateRaw
                                  ? new Date(latestStatusDateRaw).toLocaleDateString()
                                  : ""}{" "}
                                • {order.Remark}
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center mt-2 text-xs text-gray-600">
                            <span>
                              {order.highestStatusTask?.Delivery_Date
                                ? new Date(order.highestStatusTask.Delivery_Date).toLocaleDateString()
                                : ""}
                            </span>
                            <span className="text-green-500">
                              {order.highestStatusTask?.Assigned}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SkeletonTheme>
    </div>
  );
}
