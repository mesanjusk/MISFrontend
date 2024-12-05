import React from 'react';

const OrderPrint = React.forwardRef((props, ref) => (
	<>
	<div ref={ref}>
    <h1>Order Print Preview</h1>
    <p>{props.content || "No content provided"}</p>
  </div>
	  </>
  ));

export default OrderPrint;
