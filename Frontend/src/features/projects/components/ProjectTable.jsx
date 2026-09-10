// src/features/projects/components/ProjectTable.jsx
// Single consolidated table component — no separate sub-components
import React from "react";
import { useSelector } from "react-redux";
import { Eye } from "lucide-react";
import { selectPaginatedProjects, selectLoading } from "../../../store/slices/projectsSlice";
import ProjectStatusBadge from "./ProjectStatusBadge";
import { formatDateRange } from "../utils/formatProjectDate";
import LoadingSkeleton from "./LoadingSkeleton";
import EmptyProjects from "./EmptyProjects";

// Columns config — widths constrain the Actions column to avoid blank space
const COLUMNS = [
  { key: "projectName",  label: "Project Name",  align: "text-left",   width: "w-[168px]" },
  { key: "pmsId",        label: "PMS ID",         align: "text-left",   width: "w-[94px]"  },
  { key: "customer",     label: "Customer",       align: "text-center", width: "w-[193px]" },
  { key: "owner",        label: "Owner",          align: "text-center", width: "w-[145px]" },
  { key: "status",       label: "Status",         align: "text-center", width: "w-[120px]" },
  { key: "plannedDates", label: "Planned Dates",  align: "text-center", width: "w-auto"    },
  { key: "actions",      label: "Actions",        align: "text-right",  width: "w-[60px]"  },
];

const ProjectTable = () => {
  const projects = useSelector(selectPaginatedProjects);
  const loading  = useSelector(selectLoading);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse min-w-[800px] font-roboto">
        {/* ── Sticky header ── */}
        <thead className="sticky top-0 z-10">
          <tr>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className={`font-roboto font-semibold text-xs leading-4 tracking-[0.6px] capitalize text-[#43474E] px-4 py-3 bg-[#EFF4FF] border-b border-[#C4C6CF] whitespace-nowrap ${col.width} ${col.align}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={7} className="p-0">
                <LoadingSkeleton rows={10} />
              </td>
            </tr>
          ) : projects.length === 0 ? (
            <tr>
              <td colSpan={7}>
                <EmptyProjects />
              </td>
            </tr>
          ) : (
            projects.map((project) => (
              <tr
                key={project.id}
                className="border-t first:border-t-0 border-[#C4C6CF] bg-white hover:bg-[#F8F7FF] transition-colors duration-100"
              >
                {/* Project Name — 14px 500 #171C20 */}
                <td className="py-[18px] pl-4 pr-0 w-[168px]">
                  <span className="font-medium text-sm leading-5 text-[#171C20]">
                    {project.projectName}
                  </span>
                </td>

                {/* PMS ID — 13px 400 #43474E */}
                <td className="py-[19px] px-4 w-[94px]">
                  <span className="font-normal text-[13px] leading-[18px] text-[#43474E]">
                    {project.pmsId}
                  </span>
                </td>

                {/* Customer — 14px 400 #171C20 */}
                <td className="py-[18px] px-4 w-[193px]">
                  <span className="font-normal text-sm leading-5 text-[#171C20]">
                    {project.customer}
                  </span>
                </td>

                {/* Owner — 14px 400 #171C20 */}
                <td className="py-0 pl-4 pr-0 w-[145px]">
                  <span className="font-normal text-sm leading-5 text-[#171C20]">
                    {project.owner}
                  </span>
                </td>

                {/* Status badge */}
                <td className="py-[16.5px] pl-8 pr-4 w-[136px]">
                  <ProjectStatusBadge status={project.status} />
                </td>

                {/* Planned Dates — 14px 400 #43474E */}
                <td className="py-[18px] px-4 w-[224px] text-right">
                  <span className="font-normal text-sm leading-5 text-[#43474E]">
                    {formatDateRange(project.startDate, project.endDate)}
                  </span>
                </td>

                {/* Actions — eye icon #856BFF, centered vertically */}
                <td className="py-[18px] px-4 text-right align-middle">
                  <button
                    id={`view-${project.id}`}
                    onClick={() => console.log("View Project", project.id)}
                    title={`View ${project.projectName}`}
                    className="bg-transparent border-none outline-none p-0 m-0 cursor-pointer inline-flex items-center justify-center w-4 h-4 leading-none text-[#856BFF] hover:opacity-80 transition-opacity"
                  >
                    <Eye size={16} strokeWidth={1.8} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectTable;
