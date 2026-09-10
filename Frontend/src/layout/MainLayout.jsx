// src/layout/MainLayout.jsx
import React, { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const MainLayout = () => {
  const { pathname } = useLocation();
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F7FA]">
      {/* ── Left: Fixed 260px Sidebar with top logo ── */}
      <Sidebar />

      {/* ── Right: Header + Scrollable Page Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <div id="main-content-scroll" ref={contentRef} className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;