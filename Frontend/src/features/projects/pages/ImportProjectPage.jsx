// src/features/projects/pages/ImportProjectPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// Stepper
// ─────────────────────────────────────────────────────────────────────────────
const STEPS = [
  { num: "01", label: "Project Info" },
  { num: "02", label: "Task Info" },
  { num: "03", label: "Effort Estimate" },
  { num: "04", label: "Document Checklist" },
];

const Stepper = ({ active }) => (
  <div className="relative w-full h-[69px]">
    {/* Horizontal divider line */}
    <div className="absolute h-[2px] left-4 right-4 top-[calc(50%-28px)] bg-[#E4E9EE] rounded-xl z-0" />
    {/* Steps row */}
    <div className="relative z-10 flex flex-row justify-between items-start p-0 h-full">
      {STEPS.map((step, i) => {
        const isActive = i === active;
        return (
          <div key={step.num} className="flex flex-col items-center gap-2">
            {/* Circle */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isActive ? "bg-[#856BFF]" : "bg-[#DEE3E8]"
              }`}
            >
              <span
                className={`font-roboto font-semibold text-xs leading-4 tracking-[0.6px] ${
                  isActive ? "text-white" : "text-[#545F72]"
                }`}
              >
                {step.num}
              </span>
            </div>
            {/* Label */}
            <span
              className={`font-roboto text-xs leading-4 tracking-[0.6px] whitespace-nowrap ${
                isActive ? "font-semibold text-[#856BFF]" : "font-normal text-[#545F72]"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Field components
// ─────────────────────────────────────────────────────────────────────────────

/** Label above a field */
const FieldLabel = ({ children, fromPMS = false }) => (
  <div className="flex flex-row items-center gap-2 mb-1">
    <span className="font-roboto font-medium text-xs leading-4 tracking-[0.66px] text-[#6B778C]">
      {children}
    </span>
    {fromPMS && (
      <span className="inline-flex items-center px-1.5 py-0.5 bg-[#EBECF0] rounded font-roboto font-bold text-[10px] leading-[15px] tracking-[0.5px] text-[#42526E]">
        FROM PMS
      </span>
    )}
  </div>
);

/** Read-only (PMS-synced) text input */
const ReadInput = ({ value, placeholder }) => (
  <div className="box-border flex flex-row items-center px-3 py-[7px] h-11 bg-[#F8F9FF] border border-[#DFE1E6] rounded w-full">
    <span className="font-roboto font-normal text-base leading-[19px] text-[#6B7280] overflow-hidden whitespace-nowrap text-ellipsis">
      {value || placeholder}
    </span>
  </div>
);

/** Editable text input */
const TextInput = ({ value, onChange, placeholder, id }) => (
  <input
    id={id}
    type="text"
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className="box-border flex flex-row items-center px-3 py-[7px] h-11 bg-white border border-[#DFE1E6] rounded font-roboto font-normal text-base leading-[19px] text-[#171C20] outline-none w-full focus:border-[#856BFF] transition-colors"
  />
);

/** Dropdown / select */
const SelectInput = ({ value, onChange, options, placeholder, id, fromPMS = false }) => (
  <div className="relative w-full">
    <select
      id={id}
      value={value}
      onChange={onChange}
      className={`box-border appearance-none w-full h-11 pl-3 pr-10 py-[7px] border border-[#DFE1E6] rounded font-roboto font-normal text-base leading-[19px] cursor-pointer outline-none focus:border-[#856BFF] transition-colors ${
        fromPMS ? "bg-[#F8F9FF]" : "bg-white"
      } ${value ? "text-[#171C20]" : "text-[#6B7280]"}`}
    >
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
    {/* Chevron */}
    <svg
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill="none"
      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
    >
      <path d="M1 1L5 5L9 1" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Sync icon (lucide-style refresh)
// ─────────────────────────────────────────────────────────────────────────────
const SyncIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
const ImportProjectPage = () => {
  const navigate = useNavigate();

  // PMS sync state
  const [pmsId, setPmsId]       = useState("");
  const [synced, setSynced]     = useState(false);
  const [syncing, setSyncing]   = useState(false);

  // PMS-filled fields (read-only after sync)
  const [pmsData, setPmsData] = useState({
    projectName: "",
    customerName: "",
    presaleId: "",
    startDate: "",
    endDate: "",
    description: "",
    projectStatus: "",
  });

  // Manual fields
  const [form, setForm] = useState({
    projectType:   "",
    nbdId:         "",
    o2dId:         "",
    projectCode:   "",
    subCategory:   "",
  });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  // ── Sync handler (mock) ────────────────────────────────────────────────────
  const handleSync = async () => {
    if (!pmsId.trim()) return;
    setSyncing(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 900));
    setPmsData({
      projectName:   "FMS – Field Management System",
      customerName:  "Ahana IT",
      presaleId:     pmsId + "-PRE",
      startDate:     "09/08/2026",
      endDate:       "08/09/2027",
      description:   "Automated field workforce tracking platform with GPS, task dispatch, and real-time analytics.",
      projectStatus: "In Progress",
    });
    setSynced(true);
    setSyncing(false);
  };

  const handleCancel  = () => navigate("/projects");
  const handleSaveDraft = () => { console.log("Save Draft", { pmsId, pmsData, form }); };
  const handleNext    = () => { console.log("Next →", { pmsId, pmsData, form }); };

  // ── Project Type options ───────────────────────────────────────────────────
  const projectTypeOptions = [
    { value: "one-time",   label: "One Time Project" },
    { value: "retainer",   label: "Retainer" },
    { value: "milestone",  label: "Milestone-Based" },
  ];
  const statusOptions = [
    { value: "In Progress",   label: "In Progress" },
    { value: "Not Started",   label: "Not Started" },
    { value: "Completed",     label: "Completed" },
    { value: "On Hold",       label: "On Hold" },
  ];

  // ── Layout ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center px-6 gap-2 font-roboto min-h-full bg-[#F5F7FA]">
      {/* ── Header area (title + stepper) ── */}
      <div className="flex flex-col items-start py-2 px-0 gap-[19px] w-full max-w-[2058px]">
        {/* Title */}
        <h1 className="m-0 font-roboto font-bold text-2xl leading-8 text-[#0B1C30] self-stretch">
          Import Project
        </h1>

        {/* Stepper */}
        <div className="w-full max-w-[2058px]">
          <Stepper active={0} />
        </div>
      </div>

      {/* ── Form card ── */}
      <div className="box-border flex flex-col items-start px-4  py-2 gap-4 w-full max-w-[2058px] bg-white border border-[#E5E7EB] rounded-lg">
        <div className="flex flex-col items-start p-0 gap-3 w-full">
          {/* ── Row 0: PMS ID ── */}
          <div className="w-full">
            <FieldLabel>PMS ID</FieldLabel>
            <div className="flex flex-row items-start gap-2 pt-1">
              <input
                id="pms-id-input"
                type="text"
                value={pmsId}
                onChange={(e) => { setPmsId(e.target.value); setSynced(false); }}
                placeholder="Enter PMS ID to sync"
                className="box-border px-3 py-[9px] w-[207px] h-[39px] bg-white border border-[#CBC3D7] rounded font-roboto font-normal text-base leading-[19px] text-[#171C20] outline-none shrink-0 focus:border-[#856BFF] transition-colors"
              />
              <button
                id="pms-sync-btn"
                onClick={handleSync}
                disabled={syncing || !pmsId.trim()}
                className={`flex flex-row justify-center items-center px-4 py-2.5 gap-2 h-9 rounded border-none transition-colors ${
                  syncing ? "bg-[#a897ff]" : "bg-[#856BFF] hover:bg-[#7457fc]"
                } ${pmsId.trim() ? "cursor-pointer opacity-100" : "cursor-not-allowed opacity-60"}`}
              >
                <span className="text-white flex items-center">
                  <SyncIcon />
                </span>
                <span className="font-roboto font-semibold text-sm leading-4 text-white">
                  {syncing ? "Syncing…" : "Sync"}
                </span>
              </button>
              {synced && (
                <span className="flex items-center gap-1 text-xs text-[#10b981] font-semibold self-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Synced
                </span>
              )}
            </div>
          </div>

          {/* ── Row 1: Project Name | Project Type | Customer Name ── */}
          <div className="flex flex-row justify-between items-end gap-[33px] w-full">
            {/* Project Name (PMS) */}
            <div className="flex-1 min-w-0">
              <FieldLabel fromPMS={synced}>Project Name*</FieldLabel>
              <ReadInput
                value={pmsData.projectName}
                placeholder="FMS"
              />
            </div>

            {/* Project Type (manual) */}
            <div className="flex-1 min-w-0">
              <FieldLabel>Project Type</FieldLabel>
              <SelectInput
                id="project-type-select"
                value={form.projectType}
                onChange={(e) => setForm((f) => ({ ...f, projectType: e.target.value }))}
                options={projectTypeOptions}
                placeholder="One Time Project"
              />
            </div>

            {/* Customer Name (PMS) */}
            <div className="flex-1 min-w-0">
              <FieldLabel fromPMS={synced}>Customer Name</FieldLabel>
              <SelectInput
                id="customer-name-select"
                value={pmsData.customerName}
                onChange={() => {}}
                options={[{ value: pmsData.customerName || "Ahana IT", label: pmsData.customerName || "Ahana IT" }]}
                placeholder="Ahana IT"
                fromPMS
              />
            </div>
          </div>

          {/* ── Row 2: Presale ID | NBD ID | O2D ID | Project Code ── */}
          <div className="flex flex-row justify-between items-end gap-6 w-full">
            {/* Presale ID (PMS) */}
            <div className="flex-1 min-w-0">
              <FieldLabel fromPMS={synced}>Presale ID</FieldLabel>
              <ReadInput value={pmsData.presaleId} placeholder="Presale ID" />
            </div>

            {/* NBD ID (manual) */}
            <div className="flex-1 min-w-0">
              <FieldLabel>NBD ID</FieldLabel>
              <TextInput
                id="nbd-id-input"
                value={form.nbdId}
                onChange={set("nbdId")}
                placeholder="eg 1234"
              />
            </div>

            {/* O2D ID (manual) */}
            <div className="flex-1 min-w-0">
              <FieldLabel>O2D ID</FieldLabel>
              <TextInput
                id="o2d-id-input"
                value={form.o2dId}
                onChange={set("o2dId")}
                placeholder="eg 1234"
              />
            </div>

            {/* Project Code (manual) */}
            <div className="flex-1 min-w-0">
              <FieldLabel>Project Code</FieldLabel>
              <TextInput
                id="project-code-input"
                value={form.projectCode}
                onChange={set("projectCode")}
                placeholder="eg 1234"
              />
            </div>
          </div>

          {/* ── Row 3: Sub Category | Start Date | End Date | Project Status ── */}
          <div className="flex flex-row justify-between items-end gap-6 w-full">
            {/* Sub Category (manual) */}
            <div className="flex-1 min-w-0">
              <FieldLabel>Sub Category</FieldLabel>
              <TextInput
                id="sub-category-input"
                value={form.subCategory}
                onChange={set("subCategory")}
                placeholder="FMS"
              />
            </div>

            {/* Start Date (PMS) */}
            <div className="flex-1 min-w-0">
              <FieldLabel fromPMS={synced}>Start Date</FieldLabel>
              <ReadInput value={pmsData.startDate} placeholder="09/08/2026" />
            </div>

            {/* End Date (PMS) */}
            <div className="flex-1 min-w-0">
              <FieldLabel fromPMS={synced}>End Date</FieldLabel>
              <ReadInput value={pmsData.endDate} placeholder="08/09/2026" />
            </div>

            {/* Project Status (PMS) */}
            <div className="flex-1 min-w-0">
              <FieldLabel fromPMS={synced}>Project Status</FieldLabel>
              <SelectInput
                id="project-status-select"
                value={pmsData.projectStatus || "In Progress"}
                onChange={() => {}}
                options={statusOptions}
                placeholder="In Progress"
                fromPMS
              />
            </div>
          </div>

          {/* ── Row 4: Description ── */}
          <div className="w-full pt-1 pb-1.5">
            <div className="flex flex-row justify-between items-start mb-1">
              <FieldLabel fromPMS={synced}>Description</FieldLabel>
            </div>
            <textarea
              id="description-input"
              value={pmsData.description}
              onChange={(e) => setPmsData((d) => ({ ...d, description: e.target.value }))}
              placeholder="Enter high-level project objectives and scope..."
              rows={4}
              className="box-border w-full p-3 bg-[#F8F9FF] border border-[#DFE1E6] rounded font-roboto font-normal text-base leading-6 text-[#6B7280] resize-y outline-none min-h-[96px] focus:border-[#856BFF] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* ── Footer Actions ── */}
      <div className="box-border flex flex-row justify-between items-center py-2 px-0 gap-2 w-full max-w-[1058px] border-t border-[#DFE1E6]">
        {/* Cancel */}
        <button
          id="import-cancel-btn"
          onClick={handleCancel}
          className="box-border flex justify-center items-center px-4 py-1.5 h-9 bg-transparent border-none rounded font-roboto font-normal text-sm leading-5 text-[#42526E] hover:text-[#171C20] hover:bg-gray-100 cursor-pointer transition-colors"
        >
          Cancel
        </button>

        {/* Right actions */}
        <div className="flex flex-row gap-3">
          {/* Save Draft */}
          <button
            id="import-save-draft-btn"
            onClick={handleSaveDraft}
            className="box-border flex justify-center items-center px-4 py-1.5 h-11 bg-transparent border border-[#DFE1E6] rounded font-roboto font-normal text-base leading-5 text-[#42526E] hover:bg-gray-50 cursor-pointer transition-colors"
          >
            Save Draft
          </button>

          {/* Next */}
          <button
            id="import-next-btn"
            onClick={handleNext}
            className="flex flex-row items-center justify-center px-4 py-2 gap-2 h-11 bg-[#856BFF] hover:bg-[#7457fc] rounded border-none cursor-pointer transition-colors"
          >
            <span className="font-roboto font-semibold text-base leading-5 text-white">
              Next
            </span>
            {/* Arrow icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportProjectPage;
