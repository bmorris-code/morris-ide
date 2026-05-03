import React from "react";

interface Tab {
  id: string;
  name: string;
}

const FileTabs: React.FC<{ tabs: Tab[]; active: string }> = ({
  tabs,
  active,
}) => {
  return (
    <div className="flex bg-[#111827] border-b border-gray-800">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`px-4 py-2 text-sm cursor-pointer ${
            active === tab.id ? "bg-[#1f2937]" : ""
          }`}
        >
          {tab.name}
        </div>
      ))}
    </div>
  );
};

export default FileTabs;