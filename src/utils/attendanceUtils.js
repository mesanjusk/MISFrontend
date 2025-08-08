import axios from "axios";

// --- API helpers ---
export const fetchUserNames = async () => {
  try {
    const { data } = await axios.get("/user/GetUserList");
    if (!data?.success) return {};
    const map = {};
    data.result.forEach(u => (map[u.User_uuid] = (u.User_name || "").trim()));
    return map;
  } catch {
    return {};
  }
};

export const fetchAttendanceList = async () => {
  const { data } = await axios.get("/attendance/GetAttendanceList");
  return data?.result || [];
};

// --- Time + compute helpers ---
export const calculateWorkingHours = (inTime, outTime, breakTime, startTime) => {
  if (!inTime || !outTime || inTime === "N/A" || outTime === "N/A") return "N/A";

  const parseTime = (t) => {
    if (!t || t === "N/A") return null;
    const [time, period] = t.split(" ");
    const [hh, mm] = time.split(":").map(Number);
    let h = hh;
    if (period === "PM" && hh !== 12) h += 12;
    if (period === "AM" && hh === 12) h = 0;
    const d = new Date();
    d.setHours(h, mm, 0, 0);
    return d;
  };

  const inD = parseTime(inTime);
  const outD = parseTime(outTime);
  const breakD = parseTime(breakTime);
  const startD = parseTime(startTime);

  if (!inD || !outD) return "N/A";

  let secs = (outD - inD) / 1000;
  if (breakD && startD) secs -= (startD - breakD) / 1000;

  const h = Math.max(0, Math.floor(secs / 3600));
  const m = Math.max(0, Math.floor((secs % 3600) / 60));
  const s = Math.max(0, Math.floor(secs % 60));
  return `${h}h ${m}m ${s}s`;
};

export const processAttendanceDataForDate = (records, userLookup, dateISO) => {
  const grouped = new Map();

  records.forEach(({ Date: recDate, User, Employee_uuid }) => {
    if (!recDate) return;
    const keyDate = new Date(recDate).toISOString().split("T")[0];
    if (keyDate !== dateISO) return;

    const name = userLookup[(Employee_uuid || "").trim()] || "Unknown";
    const composite = `${name}-${keyDate}`;
    if (!grouped.has(composite)) {
      grouped.set(composite, {
        Date: keyDate,
        User_name: name,
        In: "N/A",
        Break: "N/A",
        Start: "N/A",
        Out: "N/A",
        TotalHours: "N/A",
      });
    }
    const ref = grouped.get(composite);
    (User || []).forEach(u => {
      switch (u.Type) {
        case "In": ref.In = (u.Time || "").trim(); break;
        case "Break": ref.Break = (u.Time || "").trim(); break;
        case "Start": ref.Start = (u.Time || "").trim(); break;
        case "Out": ref.Out = (u.Time || "").trim(); break;
        default: break;
      }
    });
  });

  return Array.from(grouped.values()).map(r => ({
    ...r,
    TotalHours: calculateWorkingHours(r.In, r.Out, r.Break, r.Start),
  }));
};

export const processAttendanceDataRange = (records, userLookup, startISO, endISO) => {
  const grouped = new Map();
  const start = startISO ? new Date(startISO) : null;
  const end = endISO ? new Date(endISO) : null;

  records.forEach(({ Date: recDate, User, Employee_uuid }) => {
    if (!recDate) return;
    const d = new Date(recDate);
    if (start && d < start) return;
    if (end && d > end) return;

    const dateKey = d.toISOString().split("T")[0];
    const name = userLookup[(Employee_uuid || "").trim()] || "Unknown";
    const composite = `${name}-${dateKey}`;

    if (!grouped.has(composite)) {
      grouped.set(composite, {
        Date: dateKey,
        User_name: name,
        In: "N/A",
        Break: "N/A",
        Start: "N/A",
        Out: "N/A",
        TotalHours: "N/A",
      });
    }
    const ref = grouped.get(composite);
    (User || []).forEach(u => {
      switch (u.Type) {
        case "In": ref.In = (u.Time || "").trim(); break;
        case "Break": ref.Break = (u.Time || "").trim(); break;
        case "Start": ref.Start = (u.Time || "").trim(); break;
        case "Out": ref.Out = (u.Time || "").trim(); break;
        default: break;
      }
    });
  });

  return Array.from(grouped.values()).map(r => ({
    ...r,
    TotalHours: calculateWorkingHours(r.In, r.Out, r.Break, r.Start),
  }));
};
