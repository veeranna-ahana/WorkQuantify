// src/features/projects/utils/formatProjectDate.js

/**
 * Formats "YYYY-MM-DD" → "Oct 12, 2023"
 */
export const formatProjectDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

/**
 * Formats a date range: "Oct 12, 2023 - Jan 15, 2024"
 */
export const formatDateRange = (startDate, endDate) =>
  `${formatProjectDate(startDate)} - ${formatProjectDate(endDate)}`;
