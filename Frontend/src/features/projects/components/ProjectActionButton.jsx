// src/features/projects/components/ProjectActionButton.jsx
import React from "react";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProjectActionButton = ({ project }) => {
  const navigate = useNavigate();

  const handleView = () => {
    console.log("View Project", project.id);
    // Uncomment when detail page is ready:
    // navigate(`/projects/${project.id}`);
  };

  return (
    <button
      id={`view-project-${project.id}`}
      onClick={handleView}
      title={`View ${project.projectName}`}
      className="
        inline-flex items-center justify-center
        w-8 h-8 rounded-lg
        text-[#6D4AFF]
        hover:bg-purple-50
        transition-colors duration-150
        focus:outline-none
      "
    >
      <Eye size={15} strokeWidth={2} />
    </button>
  );
};

export default ProjectActionButton;
