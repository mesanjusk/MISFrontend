import axios from "../apiClient.js";

/* ==================================================
   API HELPERS
================================================== */

export const fetchUserNames = async () => {
  try {
    const { data } = await axios.get("/user/GetUserList");
    if (!data?.success) return {};

    const map = {};
    data.result.forEach((u) => {
      map[(u.User_uuid || "").trim()] = {
        name: (u.User_name || "").trim(),
        group: (u.User_group || "").trim(),
      };
    });

    return map;
  } catch {
    return {};
  }
};

export const fetchAttendanceList = async () => {
  const { data } = await axios.get("/attendance/GetAttendanceList");
  return data?.result || [];
};

/* ==================================================
   TIME HELPERS
================================================== */

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

const formatDateDMY = (iso) => {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

export const calculateWorkingHours = (
  inTime,
  outTime,
  breakTime,
  startTime
) => {
  if (!inTime || !outTime || inTime === "N/A" || outTime === "N/A") return 0;

  const inD = parseTime(inTime);
  const outD = parseTime(outTime);
  const breakD = parseTime(breakTime);
  const startD = parseTime(startTime);

  if (!inD || !outD) return 0;

  let secs = (outD - inD) / 1000;
  if (breakD && startD) secs -= (startD - breakD) / 1000;

  return Math.max(0, secs / 3600);
};

/* ==================================================
   PROCESS DATE RANGE (MAIN)
================================================== */

export const processAttendanceDataRange = (
  records,
  userLookup,
  startISO,
  endISO,
  forcedUserName = null // 🔒 HARD LOCK
) => {
  const grouped = new Map();
  const start = startISO ? new Date(startISO) : null;
  const end = endISO ? new Date(endISO) : null;

  records.forEach(({ Date: recDate, User, Employee_uuid }) => {
    if (!recDate) return;

    const d = new Date(recDate);
    if (start && d < start) return;
    if (end && d > end) return;

    const dateKey = d.toISOString().split("T")[0];
    const user = userLookup[(Employee_uuid || "").trim()] || {};
    const name = user.name || "Unknown";

    // 🔒 HARD FILTER (NON-ADMIN)
    if (forcedUserName && name !== forcedUserName) return;

    const key = `${name}-${dateKey}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        DateISO: dateKey,                 // 👈 INTERNAL
        Date: formatDateDMY(dateKey),     // 👈 DISPLAY
        User_name: name,
        In: "N/A",
        Break: "N/A",
        Start: "N/A",
        Out: "N/A",
        TotalHours: "0.00",
        Late: false,
        HalfDay: false,
      });
    }

    const ref = grouped.get(key);

    (User || []).forEach((u) => {
      if (u.Type === "In") ref.In = (u.Time || "").trim();
      if (u.Type === "Break") ref.Break = (u.Time || "").trim();
      if (u.Type === "Start") ref.Start = (u.Time || "").trim();
      if (u.Type === "Out") ref.Out = (u.Time || "").trim();
    });
  });

  return Array.from(grouped.values()).map((r) => {
    const hours = calculateWorkingHours(
      r.In,
      r.Out,
      r.Break,
      r.Start
    );

    const inTime = parseTime(r.In);
    const lateLimit = new Date();
    lateLimit.setHours(10, 15, 0, 0);

    return {
      ...r,
      TotalHours: hours.toFixed(2),
      Late: inTime ? inTime > lateLimit : false,
      HalfDay: hours > 0 && hours < 4.5,
    };
  });
};

/* ==================================================
   PROCESS SINGLE DATE (COMPATIBILITY)
================================================== */

export const processAttendanceDataForDate = (
  records,
  userLookup,
  dateISO
) => {
  return processAttendanceDataRange(
    records,
    userLookup,
    dateISO,
    dateISO
  );
};
