import React from "react";
import { LoaderCircle } from "lucide-react";

const Loading: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-400">
      <LoaderCircle className="animate-spin text-blue-500 mb-3" size={40} />
      {message && <p className="text-sm font-medium">{message}</p>}
    </div>
  );
};

export default Loading;
