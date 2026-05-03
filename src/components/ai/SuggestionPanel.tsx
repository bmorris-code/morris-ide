import React from "react";

const SuggestionPanel: React.FC = () => {
  const suggestions = ["Refactor code", "Explain error", "Generate API"];

  return (
    <div className="p-2 text-sm text-gray-400">
      {suggestions.map((s) => (
        <div key={s} className="hover:text-white cursor-pointer">
          {s}
        </div>
      ))}
    </div>
  );
};

export default SuggestionPanel;