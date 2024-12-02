import React, { useRef, useState, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import axios from "axios";

const OrderPrint = ({order}) => {
  const [customers, setCustomers] = useState({});
  const [latestDeliveryDate, setLatestDeliveryDate] = useState("");
  const componentRef = useRef();

  useEffect(() => {
    axios.get("/customer/GetCustomersList")
      .then(res => {
        if (res.data.success) {
          const customerMap = res.data.result.reduce((acc, customer) => {
            if (customer.Customer_uuid && customer.Customer_name && customer.Mobile_number) {
              acc[customer.Customer_uuid] = {
                Customer_name: customer.Customer_name,
                Mobile_number: customer.Mobile_number,
              };
            }
            return acc;
          }, {});
          setCustomers(customerMap);
        } else {
          setCustomers({});
        }
      })
      .catch(err => console.log('Error fetching customers list:', err));
  }, []);

  useEffect(() => {
    if (order?.Status?.length) {
      const maxDeliveryDate = order.Status.reduce((latest, current) => {
        return new Date(current.Delivery_Date) > new Date(latest.Delivery_Date) ? current : latest;
      }, order.Status[0]);
      setLatestDeliveryDate(maxDeliveryDate.Delivery_Date);
    }
  }, [order]);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  const customerDetails = customers[order?.Customer_uuid] || {};

  return (
	<div style={{ textAlign: "center", padding: "10px" }}>
	{/* Print Button */}
	<button
        onClick={handlePrint}
        className="bg-green-500 text-white px-4 py-2 rounded-lg mb-4 hover:bg-green-600"
      >
	  Print
	</button>

	{/* Printable Content */}
	<div
	  ref={componentRef}
	  className="border p-6 max-w-screen-md mx-auto bg-white"
	>
	  <table style={{ width: "100%", borderCollapse: "collapse" }}>
		<tbody>
		  <tr>
			<td style={{ fontWeight: "600", fontSize: "larger" }}>SANJU SK</td>
		  </tr>
		  <tr>
			<td style={{ fontWeight: "600", fontSize: "x-small" }}>
			  In Front of Santoshi Mata Mandir,
			</td>
			<td></td>
			<td>Memo:</td>
		  </tr>
		  <tr>
			<td style={{ fontWeight: "600", fontSize: "x-small" }}>
			  Krishnapura Ward, Gondia - 441401
			</td>
			<td></td>
			<td>Order Date: {new Date(order.createdAt).toLocaleDateString()}</td>
		  </tr>
		  <tr>
			<td style={{ fontWeight: "600", fontSize: "x-small" }}>Email: skgondia@gmail.com</td>
			<td></td>
			<td>Invoice No.: {order.Order_Number}</td>
		  </tr>
		  <tr>
			<td style={{ fontWeight: "600", fontSize: "x-small" }}>Phone: 9372 633 633</td>
			<td></td>
			<td>Delivery Date: {new Date(latestDeliveryDate).toLocaleDateString()}</td>
		  </tr>
		</tbody>
	  </table>

	  {/* Order Details */}
	  <table style={{ width: "100%", borderCollapse: "collapse" }}>
		<thead>
		  <tr>
			<th>Item</th>
			<th>Remarks</th>
			<th>Qty</th>
			<th>Rate</th>
			<th>Amount</th>
		  </tr>
		</thead>
		<tbody>
		  {order.items?.map((item, index) => (
			<tr key={index}>
			  <td>{item.item_title}</td>
			  <td>{item.remarks}</td>
			  <td>{item.units}</td>
			  <td>{item.price}</td>
			  <td>{item.item_total}</td>
			</tr>
		  ))}
		</tbody>
	  </table>
	</div>
	<style>
        {`
          @media print {
            button {
              display: none !important; /* Hide the button during printing */
            }
          }
        `}
      </style>
  </div>
  );
};

export default OrderPrint;