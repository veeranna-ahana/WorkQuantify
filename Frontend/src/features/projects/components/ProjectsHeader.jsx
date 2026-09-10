// src/features/projects/components/ProjectsHeader.jsx
import React from "react";

// proicons:arrow-import — arrow pointing right into a frame
const ImportIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Horizontal arrow shaft + arrowhead */}
    <path d="M1 8H11M11 8L8 5M11 8L8 11" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Vertical bar (the "into" frame) */}
    <path d="M14 4V12" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const ProjectsHeader = ({ onImportClick }) => (
  <div className="flex flex-row justify-between items-center p-0 mb-6">
    {/* Title — Roboto 700 24px #171C20 letter-spacing -0.6px */}
    <h1 className="m-0 font-roboto font-bold text-2xl leading-[38px] tracking-[-0.6px] text-[#171C20]">
      Projects
    </h1>

    {/* Import Project button — #856BFF, border-radius 8px, padding 11px 24px */}
    <button
      id="import-project-btn"
      onClick={onImportClick}
      className="inline-flex flex-row items-center justify-center px-6 gap-2 h-[38px] bg-[#856BFF] hover:bg-[#7457fc] rounded-lg border-none outline-none cursor-pointer box-border shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] font-roboto font-semibold text-xs leading-none tracking-[0.24px] text-white whitespace-nowrap shrink-0 transition-colors"
    >
      <ImportIcon />
      Import Project
    </button>
  </div>
);

export default ProjectsHeader;
