import React, { Component } from "react";
import ReactToPrint from "react-to-print";

export class OrderPrint extends Component {  
  constructor(props) {
    super(props);
    this.componentRef = React.createRef();
  }

  render() {
    return (
      <>
        <div>
          <ReactToPrint
            trigger={() => {
              return <button>Print</button>;
            }}
            content={() => this.componentRef.current}
            documentTitle="New Document"
            pageStyle="Print"
          />
        </div>
        <div
          ref={this.componentRef}
          style={{ width: "50%", height: "50%" }}
        >
          <h1 className="text-center my-3 border py-2" style={{ color: "black" }}>
            Neelam
          </h1>
          <p>Details to print here...</p>
        </div>
      </>
    );
  }
}


export default OrderPrint