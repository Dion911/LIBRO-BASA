import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="currentColor" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Hair/Head */}
      <path d="M30 25C30 10 70 10 70 25C55 20 45 20 30 25Z" />
      {/* Eyes */}
      <circle cx="42" cy="27" r="4" />
      <circle cx="62" cy="27" r="4" />
      {/* Nose */}
      <path d="M51 22H55V35H48V31H51V22Z" />
      {/* Book */}
      <path d="M19 25L50 38L81 25V73L50 86L19 73V25Z" />
    </svg>
  );
};
