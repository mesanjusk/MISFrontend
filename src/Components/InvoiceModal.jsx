/* eslint-disable react/prop-types */
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function InvoiceModal({
  isOpen,
  onClose,
  invoiceRef,
  customerName,
  customerMobile,
  items = [],
  remark = '',
  orderId = '',
  onSendWhatsApp,
}) {
  if (!isOpen) return null;

  const handlePrint = () => {
    const printContents = invoiceRef.current?.innerHTML;
    const win = window.open('', '', 'height=600,width=800');
    if (!win) return;
    win.document.write('<html><head><title>Invoice</title></head><body>');
    win.document.write(printContents || '');
    win.document.write('</body></html>');
    win.document.close();
    win.print();
  };

  const handlePDF = async () => {
    const element = invoiceRef.current;
    if (!element) return;
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    pdf.addImage(imgData, 'PNG', 10, 10);
    pdf.save('invoice.pdf');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white w-full max-w-3xl p-6 rounded-lg shadow-xl relative">
        <button className="absolute top-2 right-3 text-xl" onClick={onClose}>✕</button>
        <div ref={invoiceRef} className="p-6 bg-white space-y-4 border rounded shadow-md">
          <div className="text-center mb-4">
            <h2 className="text-3xl font-bold text-gray-800">🧾 Invoice</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Invoice To:</strong></p>
              <p>{customerName}</p>
              {customerMobile && <p>📞 {customerMobile}</p>}
            </div>
            <div className="text-right">
              <p><strong>Invoice Date:</strong> {new Date().toLocaleDateString('en-GB')}</p>
              {orderId && <p><strong>Order No:</strong> #{String(orderId).slice(-6).toUpperCase()}</p>}
            </div>
          </div>

          {items.length > 0 && (
            <table className="w-full mt-4 border-t border-b text-sm">
              <thead>
                <tr className="bg-gray-200 text-left">
                  <th className="p-2">#</th>
                  <th className="p-2">Item</th>
                  <th className="p-2 text-right">Qty</th>
                  <th className="p-2 text-right">Rate</th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2">{idx + 1}</td>
                    <td className="p-2">{item.Item}</td>
                    <td className="p-2 text-right">{item.Quantity}</td>
                    <td className="p-2 text-right">₹{item.Rate}</td>
                    <td className="p-2 text-right">₹{item.Amount}</td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan="4" className="p-2 text-right">Total</td>
                  <td className="p-2 text-right">₹{items.reduce((sum, i) => sum + Number(i.Amount || 0), 0)}</td>
                </tr>
              </tbody>
            </table>
          )}

          {remark && (
            <div className="mt-4">
              <p><strong>Remark:</strong> {remark}</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          {onSendWhatsApp && (
            <button onClick={onSendWhatsApp} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              📩 Send WhatsApp
            </button>
          )}
          <button onClick={handlePrint} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
            🖨️ Print
          </button>
          <button onClick={handlePDF} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
            📄 Download PDF
          </button>
          <button onClick={onClose} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
            ❌ Close
          </button>
        </div>
      </div>
    </div>
  );
}

