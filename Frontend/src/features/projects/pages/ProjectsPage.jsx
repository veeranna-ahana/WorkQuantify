// src/features/projects/pages/ProjectsPage.jsx
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import ProjectsHeader    from "../components/ProjectsHeader";
import ProjectTable      from "../components/ProjectTable";
import ProjectPagination from "../components/ProjectPagination";
import {
  setProjects,
  setLoading,
  setError,
} from "../../../store/slices/projectsSlice";
import { getProjects } from "../services/projectsService";


// ── Main Page ─────────────────────────────────────────────────────────────────
const ProjectsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      dispatch(setLoading(true));
      try {
        const data = await getProjects();
        if (!cancelled) dispatch(setProjects(data));
      } catch (err) {
        if (!cancelled) dispatch(setError(err.message ?? "Failed to load projects"));
      } finally {
        if (!cancelled) dispatch(setLoading(false));
      }
    })();
    return () => { cancelled = true; };
  }, [dispatch]);

  return (
    <div className="flex flex-col items-stretch py-3 px-5 gap-6 min-h-full font-roboto">
      {/* Page Header */}
      <ProjectsHeader onImportClick={() => navigate("/projects/import")} />

      {/* Table Container — exact spec: border #C4C6CF, border-radius 8px, shadow */}
      <div className="w-full bg-white border border-[#C4C6CF] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-lg overflow-hidden box-border">
        <ProjectTable />
        <ProjectPagination />
      </div>
    </div>
  );
};

export default ProjectsPage;
