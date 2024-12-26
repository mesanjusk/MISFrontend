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
    <div className="text-center p-4">
      <button onClick={handlePrint} className="bg-green-500 text-white px-4 py-2 rounded-lg mb-4 hover:bg-green-600"> 
		Print
		</button>
     
         <div
			ref={componentRef}
			
		
		>   
<table style={{ width: "100%"   }}>		
	

		<th class="px-3 py-1 text-xl text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">	
		S.K. DIGITAL 		
		</th>
		
		
		<tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
		<td class="px-3 py-1 ">
		In Front of Santoshi Mata Mandir, Krishnapura Ward, Gondia Email: skgondia@gmail.com Mob:9372633633
		</td>
		</tr>
                  
        <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">  <td class="px-4 py-1">Party : {customerDetails.Customer_name} </td>  
		<td class="px-1 py-1"></td>	   
		<td class="px-1 py-1">Bill No.: </td> 
		<td>{order.Order_Number}</td>
		</tr>
                  
		<tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">  <td class="px-4 py-1">Mobile : {customerDetails.Mobile_number} </td> 
		
		<td class="px-1 py-1"> </td>
		<td class="px-1 py-1">Date: </td>
		<td>{new Date(order.createdAt).toLocaleDateString()}</td>
		
		</tr>
									
		<tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
			<td></td>			
			<td></td>						
			<td class="px-1 py-1">Delivery </td>
			<td>{new Date(latestDeliveryDate).toLocaleDateString()}</td>
									</tr>
				
				
		 
		 
       
            <tr class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400" >
                <th scope="col" class="px-6 py-3">
                    Item
                </th>
				<th scope="col" class="px-6 py-3">
                   
                </th>
                <th scope="col" class="px-6 py-3">
                    Qty
                </th>
                <th scope="col" class="px-6 py-3">
                    Rate
                </th>
                <th scope="col" class="px-6 py-3">
                    Amount
                </th>
            </tr>
        
        <tbody>
            
			<tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
			<td class="px-6 py-4">{order?.Item}</td>
			<td class="px-6 py-4"></td>
			<td class="px-6 py-4">{order?.Quantity}</td>
			<td class="px-6 py-4">{order?.Rate}</td>
			<td class="px-6 py-4">{order?.Amount}</td>
						</tr>
						<tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    
                </th>
                <td class="px-4 py-2">
                   
                </td>
				<td class="px-4 py-2"></td>
                <td class="px-4 py-2">
                   Total
                </td>
                <td class="px-4 py-2">
                    {order?.Amount}
                </td>
            </tr>
            <tr> <td class="px-3 py-1">UPI </td>  </tr>
			<tr> <td class="px-3 py-1">SBI </td>  </tr>
			<tr> <td class="px-3 py-1">GPAY </td>  </tr>
        </tbody>
    </table>
		</div>
		{order.items?.map((item) => {
				
				return (
					<tr  >
						<td>
							{item.item_title}
						</td>
						
						<td>
							{item.units}
						</td>
						<td>
							{item.price}
						</td>
						<td>
							{item.item_total}
						</td>
					</tr>
				)
			})}
        </div>
   
  );
};

export default OrderPrint;
