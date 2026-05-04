import React from "react";

const LoadingStream = ({
  label = "Loading content",
  lines = 3,
  className = "",
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`loading-stream ${className}`}
    >
      <span className="sr-only">{label}</span>
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={`${label}-${index}`}
            className={`loading-stream-line h-3 rounded-full ${
              index === 0
                ? "w-5/6"
                : index === lines - 1
                  ? "w-2/3"
                  : "w-full"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default LoadingStream;