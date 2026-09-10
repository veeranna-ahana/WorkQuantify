// src/features/projects/pages/ProjectDetailsPage.jsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const ProjectDetailsPage = () => {
  const { id }    = useParams();
  const navigate  = useNavigate();

  return (
    <div className="min-h-full bg-gray-50 p-6">
      <button
        onClick={() => navigate("/projects")}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#6D4AFF] mb-6 transition-colors"
      >
        <ArrowLeft size={15} />
        Back to Projects
      </button>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
        <h1 className="text-lg font-bold text-gray-800 mb-2">Project #{id}</h1>
        <p className="text-sm text-gray-400">
          Project details — integrate with API to populate this view.
        </p>
      </div>
    </div>
  );
};

export default ProjectDetailsPage;
