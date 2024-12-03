import React from 'react';

const OrderPrint = React.forwardRef(({ order = {}, latestDeliveryDate, customerDetails = {} }, ref) => (
  <div
    id="print-content"
    className="print-container"
    ref={ref}
    style={{
      width: '100%', // Use full width
      height: '100%', // Allow content to scale
      border: '1px solid black',
      pageBreakAfter: 'always',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '10mm', // Add padding for better spacing
    }}
  >
    <table className="print-table" style={{ width: '100%', border: '1px solid black' }}>
      <thead>
        <tr>
          <th style={{ fontWeight: '600', fontSize: 'larger', lineHeight: 0.5, textAlign: 'left', padding: '5px' }}>
            SANJU SK
          </th>
        </tr>
        <tr>
          <td style={{ fontWeight: '600', fontSize: 'x-small' }}>In Front of Santoshi Mata Mandir,</td>
          <td></td>
          <td>Memo:</td>
        </tr>
        <tr>
          <td style={{ fontWeight: '600', fontSize: 'x-small' }}>Krishnapura Ward, Gondia - 441401</td>
          <td></td>
          <td>Order Date: {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</td>
        </tr>
        <tr>
          <td style={{ fontWeight: '600', fontSize: 'x-small' }}>Email: skgondia@gmail.com</td>
          <td></td>
          <td>Invoice No.: {order.Order_Number || 'N/A'}</td>
        </tr>
        <tr>
          <td style={{ fontWeight: '600', fontSize: 'x-small' }}>Phone: 9372 633 633</td>
          <td></td>
          <td>Delivery Date: {latestDeliveryDate ? new Date(latestDeliveryDate).toLocaleDateString() : 'N/A'}</td>
        </tr>
      </thead>
    </table>

    <table>
      <tbody>
        <tr>
          <td>Party:</td>
          <td>{customerDetails?.Customer_name || 'N/A'}</td>
          <td>Mobile:</td>
          <td>{customerDetails?.Mobile_number || 'N/A'}</td>
        </tr>
      </tbody>
    </table>

    <hr />

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Remarks</th>
          <th>Qty.</th>
          <th>Rate</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        {order?.Item ? (
          <tr>
            <td>{order.Item}</td>
            <td>{order.Remark}</td>
            <td>{order.Quantity || 0}</td>
            <td>{order.Rate || 0}</td>
            <td>{order.Amount || 0}</td>
          </tr>
        ) : (
          <tr>
            <td colSpan="5">No items available</td>
          </tr>
        )}
      </tbody>
    </table>

    <hr />

    <table style={{ width: '100%' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid #000' }} className="order_item">
          <td>In Words</td>
          <td></td>
          <td></td>
          <td>Total</td>
          <td>{order.Amount || 0}</td>
        </tr>
      </thead>
    </table>

    <style>
      {`
        @media print {
          #print-content {
            display: block !important;
            position: static;
            width: 100%;
            font-size: 12pt;
          }
          
          /* Adjustments for mobile screens */
          @media (max-width: 768px) {
            #print-content {
              width: 100% !important;
              height: auto !important;
              padding: 5mm;
            }

            .print-table {
              font-size: 10pt;
            }

            table {
              width: 100%;
              font-size: 10pt;
            }
          }
        }
      `}
    </style>
  </div>
));

export default OrderPrint;
