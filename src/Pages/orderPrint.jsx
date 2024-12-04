import React from 'react';

const OrderPrint = React.forwardRef((_, ref) => (
	<div ref={ref}>
	  <p>Test Content</p>
	</div>
  ));

export default OrderPrint;
