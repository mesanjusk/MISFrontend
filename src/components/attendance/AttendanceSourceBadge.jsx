import { FaWhatsapp } from "react-icons/fa";

export default function AttendanceSourceBadge({ source }) {
  const resolvedSource = source === "WhatsApp" ? "WhatsApp" : "Dashboard";
  const isWhatsApp = resolvedSource === "WhatsApp";

  return (
    <span
      className={[
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border",
        isWhatsApp
          ? "bg-green-50 text-green-700 border-green-200"
          : "bg-slate-50 text-slate-700 border-slate-200",
      ].join(" ")}
      title={isWhatsApp ? "Marked via WhatsApp message" : "Marked from dashboard"}
    >
      {isWhatsApp ? <FaWhatsapp className="h-3 w-3" /> : null}
      {resolvedSource}
    </span>
  );
}
