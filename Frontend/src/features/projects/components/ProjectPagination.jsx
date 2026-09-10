// src/features/projects/components/ProjectPagination.jsx
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectCurrentPage,
  selectPageSize,
  selectTotalProjects,
  setCurrentPage,
} from "../../../store/slices/projectsSlice";

// Chevron SVG icons (matches spec: small arrow icons)
const ChevronLeft = () => (
  <svg width="6" height="9" viewBox="0 0 6 9" fill="none">
    <path d="M5 1L1 4.5L5 8" stroke="#43474E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const ChevronRight = () => (
  <svg width="6" height="9" viewBox="0 0 6 9" fill="none">
    <path d="M1 1L5 4.5L1 8" stroke="#43474E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ProjectPagination = () => {
  const dispatch    = useDispatch();
  const currentPage = useSelector(selectCurrentPage);
  const pageSize    = useSelector(selectPageSize);
  const total       = useSelector(selectTotalProjects);

  const totalPages = Math.ceil(total / pageSize);
  const startItem  = (currentPage - 1) * pageSize + 1;
  const endItem    = Math.min(currentPage * pageSize, total);

  const goTo = (p) => { if (p >= 1 && p <= totalPages) dispatch(setCurrentPage(p)); };

  // Always show 1 2 3 … lastPage
  const pages = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const list = [1, 2, 3];
    if (currentPage > 4) list.push("...");
    if (currentPage > 3 && currentPage < totalPages - 1) {
      [currentPage - 1, currentPage, currentPage + 1].forEach((n) => !list.includes(n) && list.push(n));
    }
    if (currentPage < totalPages - 2) list.push("...");
    if (!list.includes(totalPages)) list.push(totalPages);
    return list;
  };

  if (!total) return null;

  return (
    <div className="flex flex-row justify-end items-center px-4 py-2 gap-2 h-[49px] bg-[#EFF4FF] border-t border-[#C4C6CF] box-border">
      {/* Showing text — takes up remaining space pushing buttons right */}
      <span className="flex-1 font-roboto font-medium text-xs leading-4 tracking-[0.6px] text-[#43474E]">
        Showing {startItem}-{endItem} of {total} projects
      </span>

      {/* Prev button */}
      <button
        id="pg-prev"
        onClick={() => goTo(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-8 h-8 flex items-center justify-center rounded-sm p-0 bg-white border border-[#C4C6CF] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors hover:bg-gray-50"
      >
        <ChevronLeft />
      </button>

      {/* Page number buttons */}
      {pages().map((p, i) =>
        p === "..." ? (
          <span
            key={`e${i}`}
            className="w-5 text-center font-roboto text-sm text-[#43474E] px-1"
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            id={`pg-${p}`}
            onClick={() => goTo(p)}
            className={`w-8 h-8 flex items-center justify-center rounded-sm p-0 font-roboto font-semibold text-xs leading-4 tracking-[0.6px] cursor-pointer ${
              currentPage === p
                ? "bg-[#856BFF] text-white border-none"
                : "bg-white text-[#43474E] border border-[#C4C6CF] hover:bg-gray-50"
            }`}
          >
            {p}
          </button>
        )
      )}

      {/* Next button */}
      <button
        id="pg-next"
        onClick={() => goTo(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-8 h-8 flex items-center justify-center rounded-sm p-0 bg-white border border-[#C4C6CF] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors hover:bg-gray-50"
      >
        <ChevronRight />
      </button>
    </div>
  );
};

export default ProjectPagination;
