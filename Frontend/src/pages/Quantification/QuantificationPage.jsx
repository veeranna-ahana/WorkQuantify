import React, { useEffect, useState } from "react";
import ProjectSummaryCards from "./ProjectSummaryCards";
import QuantificationTable from "./QuantificationTable";
import {
  getProjectQuantification,
  getProjectSummary
} from "./quantification.service";

const QuantificationPage = () => {
  const [projectId, setProjectId] = useState("");
  const [tableData, setTableData] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!projectId) return;

    const fetchData = async () => {
      const [tableRes, summaryRes] = await Promise.all([
        getProjectQuantification(projectId),
        getProjectSummary(projectId)
      ]);

      setTableData(tableRes.data);
      setSummary(summaryRes.data);
    };

    fetchData();
  }, [projectId]);

  return (
    // <div>
    //   {/* Project Dropdown */}
    //   <select onChange={(e) => setProjectId(e.target.value)}>
    //     <option value="">Select Project</option>
    //     {/* map projects here */}
    //   </select>

    //   {/* Cards */}
    //   {summary && <ProjectSummaryCards data={summary} />}

    //   {/* Table */}
    //   <QuantificationTable rows={tableData} />
    // </div>
    <div>
        {"test"}
    </div>
  );
};

export default QuantificationPage;