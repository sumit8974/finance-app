import React from "react";

const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div
    className={`animate-pulse bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 rounded ${className}`}
  />
);

export default Skeleton;
