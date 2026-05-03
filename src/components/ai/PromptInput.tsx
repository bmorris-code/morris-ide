import React from "react";

const PromptInput: React.FC<{ onSend: (v: string) => void }> = ({
  onSend,
}) => {
  const [value, setValue] = React.useState("");

  return (
    <div className="flex gap-2">
      <input
        className="flex-1 p-2 bg-[#111827] text-white"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button
        onClick={() => {
          onSend(value);
          setValue("");
        }}
        className="bg-blue-600 px-3"
      >
        Ask
      </button>
    </div>
  );
};

export default PromptInput;