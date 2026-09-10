// src/features/projects/components/ProjectStatusBadge.jsx
import React from "react";

// Exact colors from the design CSS spec mapped to Tailwind classes
const STATUS_STYLES = {
  Completed:    "bg-[#006C49]/10 text-[#006C49]",
  "In Progress": "bg-[#D6E3FF] text-[#2D476F]",
  "On Hold":    "bg-[#FFF3CD] text-[#856404]",
  "Not Started": "bg-[#F0F0F0] text-[#6B6B6B]",
  Cancelled:    "bg-[#DC3545]/10 text-[#B02A37]",
};

const DEFAULT_STYLE = "bg-[#F0F0F0] text-[#6B6B6B]";

const ProjectStatusBadge = ({ status }) => {
  const statusClass = STATUS_STYLES[status] || DEFAULT_STYLE;
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded text-xs font-normal leading-4 tracking-[0.6px] whitespace-nowrap font-roboto ${statusClass}`}
    >
      {status}
    </span>
  );
};

export default ProjectStatusBadge;
