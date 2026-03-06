import { Outlet } from "react-router-dom";
import Sidebar from "../layout/Sidebar";   // adjust path if yours differs
import Header  from "../layout/Header";    // ← NEW

const MainLayout = () => {
  return (
    <div style={styles.shell}>
      {/* ── Left: collapsible sidebar ── */}
      <Sidebar />

      {/* ── Right: header + page content ── */}
      <div style={styles.main}>
        <Header />
        <div style={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const styles = {
  shell: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
    background: "#f4f6f8",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  content: {
    flex: 1,
    overflowY: "auto",
    padding: "0",          // let each page control its own padding
  },
};

export default MainLayout;
