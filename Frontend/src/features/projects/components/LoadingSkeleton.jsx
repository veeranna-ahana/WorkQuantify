// src/features/projects/components/LoadingSkeleton.jsx
import React from "react";

const Pulse = ({ w = "w-24", h = "h-3.5" }) => (
  <div className={`${h} ${w} bg-gray-200 rounded-full animate-pulse`} />
);

const LoadingSkeleton = ({ rows = 10 }) => (
  <div className="w-full">
    {/* Header */}
    <div className="grid grid-cols-7 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
      {["w-24", "w-16", "w-20", "w-16", "w-14", "w-28", "w-10"].map((w, i) => (
        <Pulse key={i} w={w} h="h-3" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="grid grid-cols-7 gap-4 px-5 py-[18px] border-b border-gray-50 last:border-0"
      >
        <div className="flex flex-col gap-1.5"><Pulse w="w-28" /><Pulse w="w-16" h="h-2.5" /></div>
        <Pulse w="w-20" />
        <Pulse w="w-32" />
        <Pulse w="w-24" />
        <div><Pulse w="w-20" h="h-5" /></div>
        <Pulse w="w-36" />
        <div className="flex"><Pulse w="w-8" h="h-8" /></div>
      </div>
    ))}
  </div>
);

export default LoadingSkeleton;
