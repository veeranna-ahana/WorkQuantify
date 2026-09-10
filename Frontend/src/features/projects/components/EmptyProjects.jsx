// src/features/projects/components/EmptyProjects.jsx
import React from "react";
import { FolderOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

const EmptyProjects = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-purple-50 flex items-center justify-center mb-5">
        <FolderOpen size={40} className="text-[#6D4AFF]" strokeWidth={1.5} />
      </div>
      <h3 className="text-[15px] font-semibold text-gray-800 mb-1.5">No Projects Found</h3>
      <p className="text-sm text-gray-400 max-w-xs mb-6">
        There are currently no projects available.
      </p>
      <button
        id="empty-create-project-btn"
        onClick={() => navigate("/projects/create")}
        className="
          px-5 py-2.5 bg-[#6D4AFF] text-white text-sm font-semibold
          rounded-xl shadow-md shadow-purple-200
          hover:bg-purple-700 active:scale-95 transition-all duration-150
        "
      >
        Create Project
      </button>
    </div>
  );
};

export default EmptyProjects;
