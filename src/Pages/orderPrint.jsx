import React from 'react';

const OrderPrint = React.forwardRef(({ order, latestDeliveryDate, customerDetails }, ref) => (
  <div ref={ref} className="print-container">
    <h1>Order Details</h1>
    <p>Order Number: {order.Order_Number}</p>
    <p>Customer Name: {customerDetails?.Customer_name}</p>
    <p>Contact: {customerDetails?.Mobile_number}</p>
    <p>Delivery Date: {latestDeliveryDate}</p>
    <p>Remarks: {order.Remark}</p>
  </div>
));

export default OrderPrint;
