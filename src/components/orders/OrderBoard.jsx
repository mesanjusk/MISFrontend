import OrderColumn from "./OrderColumn";
import { TASK_TYPES } from "../../hooks/useOrdersData";

export default function OrderBoard({
  columnOrder,
  groupedOrders,
  isAdmin,
  isTouchDevice,
  dragHandlers,
  onView,
  onEdit,
  onCancel,
  onMove,
  statusMessage,
}) {
  const columns = columnOrder || [];

  return (
    <>
      <div className="min-w-[1100px] mx-auto grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 2xl:grid-cols-12 gap-1.5" role="region" aria-label="Order board">
        {columns.map((taskName) => {
          const orders = groupedOrders[taskName] || [];
          const isCancel = taskName === TASK_TYPES.CANCEL;
          const allowDrop = !isTouchDevice && !isCancel;

          return (
            <OrderColumn
              key={taskName}
              title={taskName}
              orders={orders}
              isAdmin={isAdmin}
              allowDrop={allowDrop}
              onDrop={dragHandlers.onDrop}
              onDragOver={dragHandlers.onDragOver}
              onDragStart={dragHandlers.onDragStart}
              onView={onView}
              onEdit={onEdit}
              onCancel={onCancel}
              onMove={onMove}
              isTouchDevice={isTouchDevice}
            />
          );
        })}
      </div>

      <div className="sr-only" aria-live="polite">{statusMessage}</div>
    </>
  );
}
