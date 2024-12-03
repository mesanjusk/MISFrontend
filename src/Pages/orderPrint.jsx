import React from 'react';

const OrderPrint = React.forwardRef(({ order, latestDeliveryDate, customerDetails }, ref) => (
  <>
     <div
      id="print-content"
      ref={ref}
      style={{
        width: '170mm',
        height: '128mm',
        border: '1px solid black',
        pageBreakAfter: 'always',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <table style={{ width: '100%', border: '1px solid black' }}>
        <thead>
          <tr>
            <th
              style={{
                fontWeight: '600',
                fontSize: 'larger',
                lineHeight: 0.5,
                textAlign: 'left',
                padding: '5px',
              }}
            >
              SANJU SK
            </th>
          </tr>
          <tr>
            <td style={{ fontWeight: '600', fontSize: 'x-small' }}>
              In Front of Santoshi Mata Mandir,
            </td>
            <td></td>
            <td>Memo:</td>
          </tr>
          <tr>
            <td style={{ fontWeight: '600', fontSize: 'x-small' }}>
              Krishnapura Ward, Gondia - 441401
            </td>
            <td></td>
            <td>Order Date: {new Date(order.createdAt).toLocaleDateString()}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: '600', fontSize: 'x-small' }}>
              Email: skgondia@gmail.com
            </td>
            <td></td>
            <td>Invoice No.: {order.Order_Number}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: '600', fontSize: 'x-small' }}>
              Phone: 9372 633 633
            </td>
            <td></td>
            <td>Delivery Date: {new Date(latestDeliveryDate).toLocaleDateString()}</td>
          </tr>
        </thead>
      </table>

      <table>
        <tbody>
          <tr>
            <td>Party :</td>
            <td>{customerDetails?.Customer_name}</td>
            <td>Mobile :</td>
            <td>{customerDetails?.Mobile_number}</td>
          </tr>
        </tbody>
      </table>

      <hr />

      <table>
        <thead>
          <tr>
            <th>Item :</th>
            <th>Remarks :</th>
            <th>Qty. :</th>
            <th>Rate :</th>
            <th>Amount :</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{order?.Item}</td>
            <td>{order?.Remark}</td>
            <td>{order?.Quantity}</td>
            <td>{order?.Rate}</td>
            <td>{order?.Amount}</td>
          </tr>
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
            <td>{order?.Amount}</td>
          </tr>
        </thead>
      </table>
    </div>
  </>
));

export default OrderPrint;
