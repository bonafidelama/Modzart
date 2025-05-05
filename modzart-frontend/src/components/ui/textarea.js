// src/components/ui/textarea.js

import React from "react";

const Textarea = React.forwardRef(({ className = "", ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={`w-full rounded-md border border-gray-300 bg-zinc-800 text-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent ${className}`}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export { Textarea };