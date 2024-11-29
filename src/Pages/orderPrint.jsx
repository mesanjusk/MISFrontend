import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";

const OrderPrint = ({order}) => {
  const componentRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  return (
    <div>
      <button onClick={handlePrint} className="ml-2 bg-green-500 text-white p-2 rounded-lg">Print</button>
      <div
       id="item-container"
       style={{
         height: "128mm",
         width: "170mm",
         fontSize: "small",
         fontWeight: "900",
        }}
      >
        <div
          ref={componentRef}
          id="item-container"
          style={{
            height: "100%",
            
          }}
        >
          <table
            className="user-table"
            style={{
              width: "50%",
              border: "1px solid black",
              pageBreakInside: "auto",
              display: "block",
              fontSize: "small",
              fontWeight: "900",
            }}
          >
            <thead>
              <tr>
                <th
                  colSpan={5}
                  style={{
                    width: "170mm",
                    backgroundColor: "#fff",
                    fontWeight: "900",
                  }}
                >
                  In:
                </th>
              </tr>
              <tr>
                <th
                  colSpan={2}
                  style={{ backgroundColor: "#fff", fontWeight: "900" }}
                >
                  Created At: {new Date(order?.created_at).toDateString()} -{" "}
               
                </th>
                <th
                  colSpan={3}
                  style={{ backgroundColor: "#fff", fontWeight: "900" }}
                >
                  Created By: 
                </th>
              </tr>
              <tr>
                <th
                  style={{
                    width: "10mm",
                    backgroundColor: "#fff",
                    fontWeight: "900",
                  }}
                >
                  S.N
                </th>
                <th style={{ backgroundColor: "#fff", fontWeight: "900" }}>
                  Item Name
                </th>
                <th style={{ backgroundColor: "#fff", fontWeight: "900" }}>
                  MRP
                </th>
                <th style={{ backgroundColor: "#fff", fontWeight: "900" }}>
                  Box
                </th>
                <th style={{ backgroundColor: "#fff", fontWeight: "900" }}>
                  Pcs
                </th>
              </tr>
            </thead>
           
            
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderPrint;