import React from "react";
import Avatar from "../common/Avatar";
import { ROLE_TYPES } from "../../constants/roles";

const roleCopy = {
  [ROLE_TYPES.ADMIN]: "Full operational control including cancellations and workflow oversight.",
  [ROLE_TYPES.OFFICE]: "Focus on your assigned orders and keep them moving today.",
  default: "Stay on top of your tasks and keep work flowing.",
};

export default function RoleWidget({ role, userName }) {
  const subtitle = roleCopy[role] || roleCopy.default;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Avatar label={userName || "User"} />
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Current Role</p>
          <p className="text-lg font-semibold text-slate-900">{role}</p>
          <p className="text-sm text-slate-600">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
