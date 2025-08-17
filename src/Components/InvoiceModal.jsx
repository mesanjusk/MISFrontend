import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "react-toastify";
import InvoicePreview from "./InvoicePreview";

const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/dadcprflr/raw/upload";
const CLOUDINARY_UPLOAD_PRESET = "missk_invoice";

/**
 * InvoiceModal
 * Props:
 * - open, onClose
 * - orderNumber, partyName, items
 * - addressLines, storeName, qrSrc
 * - onWhatsApp: (invoiceUrl: string) => void
 * - onReady: (invoiceUrl: string) => void  // when Cloudinary upload finishes
 */
export default function InvoiceModal({
  open,
  onClose,
  orderNumber,
  partyName,
  items = [],
  addressLines = ["Infront of Santoshi Mata Mandir", "Krishnapura Ward, Gondia"],
  storeName = "S.K. Digital",
  qrSrc = "/qr.png",
  onWhatsApp,
  onReady,
}) {
  const previewRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState("");

  const dateStr = new Date().toLocaleDateString("en-GB");

  useEffect(() => {
    async function uploadInvoice() {
      if (!open) return;
      // give DOM a moment to render
      await new Promise((r) => setTimeout(r, 120));
      if (!previewRef.current) return;

      try {
        setUploading(true);
        const element = previewRef.current;
        const canvas = await html2canvas(element, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL("image/jpeg", 0.9);

        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [74, 105] });
        pdf.addImage(imgData, "JPEG", 0, 0, 74, 105);

        const pdfBlob = pdf.output("blob");
        const cloudForm = new FormData();
        const fileName = `${orderNumber || "invoice"}.pdf`;

        cloudForm.append("file", pdfBlob, fileName);
        cloudForm.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const res = await axios.post(CLOUDINARY_UPLOAD_URL, cloudForm);
        const url = res.data?.secure_url;
        setInvoiceUrl(url || "");
        onReady?.(url || "");
        if (url) toast.success("Invoice uploaded");
        else toast.error("Upload returned no URL");
      } catch (err) {
        console.error("❌ Invoice upload error:", err);
        toast.error("Upload failed");
      } finally {
        setUploading(false);
      }
    }

    if (open) uploadInvoice();
    else setInvoiceUrl("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, orderNumber]);

  if (!open) return null;

  const handlePrint = () => {
    const html = previewRef.current?.innerHTML || "";
    const win = window.open("", "", "height=600,width=800");
    win.document.write("<html><head><title>Invoice</title></head><body>");
    win.document.write(html);
    win.document.write("</body></html>");
    win.document.close();
    win.print();
  };

  const handleDownloadPDF = async () => {
    const element = previewRef.current;
    if (!element) return;
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/jpeg", 0.9);
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [74, 105] });
    pdf.addImage(imgData, "JPEG", 0, 0, 74, 105);
    const fileName = `${orderNumber || "invoice"}.pdf`;
    pdf.save(fileName);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white w-full max-w-3xl p-6 rounded-lg shadow-xl relative">
        <button className="absolute top-2 right-3 text-xl" onClick={onClose}>✕</button>

        <InvoicePreview
          ref={previewRef}
          store={storeName}
          addressLines={addressLines}
          orderNumber={orderNumber}
          dateStr={dateStr}
          partyName={partyName}
          items={items}
          qrSrc={qrSrc}
        />

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => {
              if (!invoiceUrl) {
                toast.error(uploading ? "Invoice is generating…" : "Invoice not ready yet");
                return;
              }
              onWhatsApp?.(invoiceUrl);
            }}
            disabled={uploading}
            className={`px-4 py-2 rounded text-white ${uploading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {uploading ? "Preparing…" : "WhatsApp"}
          </button>

          <button onClick={handlePrint} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
            Print
          </button>
          <button onClick={handleDownloadPDF} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
