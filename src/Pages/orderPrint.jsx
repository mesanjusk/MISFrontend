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
    <div style={{ textAlign: "center" }}>
      <button onClick={handlePrint} className="ml-2 bg-green-500 text-white p-2 rounded-lg">
        Print
      </button>

      <div
        ref={componentRef}
        style={{
          width: "170mm",
          height: "128mm",
          border: "1px solid black",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
        className="print-container"
      >
        <table style={{ width: "100%", border: "1px solid black" }}>
          <tr>
            <td style={{ fontWeight: "600", fontSize: "larger", lineHeight: 0.5 }}>SANJU SK</td>
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
        </table>
        <table>
          <tr>
            <td>Party :</td>
            <td>{customerDetails.Customer_name}</td>
            <td>Mobile :</td>
            <td>{customerDetails.Mobile_number}</td>
          </tr>
        </table>
        <hr />
        <table>
          <tr>
            <td>Item :</td>
            <td>Remarks :</td>
            <td>Qty. :</td>
            <td>Rate :</td>
            <td>Amount :</td>
          </tr>
          <tr>
            <td>{order?.Item}</td>
            <td>{order?.Remark}</td>
            <td>{order?.Quantity}</td>
            <td>{order?.Rate}</td>
            <td>{order?.Amount}</td>
          </tr>
        </table>
        <hr />
        <table style={{ width: "100%" }}>
          {order.items?.map((item) => (
            <tr style={{ borderBottom: "1px solid #000" }} className="order_item">
              <td>{item.item_title}</td>
              <td>{item.remarks}</td>
              <td>{item.units}</td>
              <td>{item.price}</td>
              <td>{item.item_total}</td>
            </tr>
          ))}
        </table>
      </div>

      {/* Add Media Queries for Mobile */}
      <style>
        {`
          @media print {
            .print-container {
              width: 100%;
              height: auto;
              margin: 0;
              padding: 0;
              page-break-inside: avoid;
              transform: scale(0.8);
            }
          }

          @media (max-width: 768px) {
            .print-container {
              width: 100%;
              height: auto;
              transform: scale(0.8); /* Adjust scaling for smaller screens */
            }
          }
        `}
      </style>
    </div>
   
  );
};

export default OrderPrint;