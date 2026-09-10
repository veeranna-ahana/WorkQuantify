// src/features/projects/mock/mockProjects.js

const statuses = ["Completed", "In Progress", "On Hold", "Not Started", "Cancelled"];
const customers = [
  "Enterprise IT Operations",
  "Global Logistics Corp",
  "FinTech Solutions Ltd",
  "Retail Co. Direct",
  "Nexus Healthcare",
  "TechVision Inc.",
  "Meridian Bank",
  "Summit Consulting",
  "Apex Manufacturing",
  "BlueOcean Ventures",
  "ClearPath Analytics",
  "DeltaEdge Systems",
];
const owners = [
  "Alice Johnson",
  "Bob Smith",
  "Carol Lee",
  "David Park",
  "Emily Chen",
  "Frank Rivera",
  "Grace Kim",
  "Henry Brown",
  "Isabella Wang",
  "James Miller",
  "Karen Wilson",
  "Liam Thomas",
];
const projectNames = [
  "FMS",
  "Cloud Migration Q1",
  "Security Audit FY24",
  "Mobile App Revamp",
  "ERP Integration",
  "Data Warehouse Build",
  "DevOps Pipeline Setup",
  "AI Analytics Platform",
  "Customer Portal v2",
  "Payroll Automation",
  "HR Self-Service App",
  "Compliance Tracker",
  "Network Modernisation",
  "API Gateway Rollout",
  "Digital Onboarding",
  "CRM Enhancement",
  "BI Dashboard Phase 2",
  "Legacy System Decom",
  "Zero Trust Implementation",
  "Disaster Recovery Plan",
];

function seededDate(seed, start, end) {
  const range = end.getTime() - start.getTime();
  const offset = (seed * 2654435761) % range;
  return new Date(start.getTime() + Math.abs(offset)).toISOString().split("T")[0];
}

// 4 seed rows from the spec
const seedRows = [
  {
    id: 1,
    projectName: "FMS",
    pmsId: "PMS-9021",
    customer: "Enterprise IT Operations",
    owner: "Alice Johnson",
    status: "Completed",
    startDate: "2023-10-12",
    endDate: "2024-01-15",
  },
  {
    id: 2,
    projectName: "Cloud Migration Q1",
    pmsId: "PMS-8834",
    customer: "Global Logistics Corp",
    owner: "Bob Smith",
    status: "In Progress",
    startDate: "2024-01-05",
    endDate: "2024-03-31",
  },
  {
    id: 3,
    projectName: "Security Audit FY24",
    pmsId: "PMS-9102",
    customer: "FinTech Solutions Ltd",
    owner: "Carol Lee",
    status: "In Progress",
    startDate: "2024-04-01",
    endDate: "2024-05-15",
  },
  {
    id: 4,
    projectName: "Mobile App Revamp",
    pmsId: "PMS-8755",
    customer: "Retail Co. Direct",
    owner: "David Park",
    status: "In Progress",
    startDate: "2023-11-20",
    endDate: "2024-02-28",
  },
];

// Generate remaining 141 rows deterministically (no Math.random — stable across reloads)
const generated = [];
for (let i = 5; i <= 145; i++) {
  const nameBase = projectNames[(i - 1) % projectNames.length];
  const version = Math.floor((i - 1) / projectNames.length);
  const start = seededDate(i * 3, new Date("2023-01-01"), new Date("2024-06-01"));
  const end = seededDate(i * 7, new Date("2024-06-15"), new Date("2025-08-30"));
  generated.push({
    id: i,
    projectName: version > 0 ? `${nameBase} v${version + 1}` : nameBase,
    pmsId: `PMS-${8000 + i}`,
    customer: customers[(i - 1) % customers.length],
    owner: owners[(i - 1) % owners.length],
    status: statuses[(i - 1) % statuses.length],
    startDate: start,
    endDate: end,
  });
}

export const mockProjects = [...seedRows, ...generated];
