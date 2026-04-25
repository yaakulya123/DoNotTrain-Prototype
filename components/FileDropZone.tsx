"use client";

import { useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";

interface Props {
  onFile: (file: File) => void;
  accept?: string;
  hint?: string;
}

export function FileDropZone({ onFile, accept, hint }: Props) {
  const [hover, setHover] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setHover(false);
      const f = e.dataTransfer.files?.[0];
      if (f) onFile(f);
    },
    [onFile]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`group cursor-pointer border border-dashed rounded-lg px-8 py-14 text-center transition ${
        hover
          ? "border-accent bg-accent/5"
          : "border-border-strong hover:border-text-tertiary bg-surface/50"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      <div className="flex justify-center mb-4">
        <Upload
          className={`h-5 w-5 transition ${
            hover ? "text-accent" : "text-text-secondary group-hover:text-text-primary"
          }`}
          strokeWidth={1.5}
        />
      </div>
      <div className="text-[15px] font-medium text-text-primary">Drop a file or click to choose</div>
      <div className="text-[13px] text-text-secondary mt-2 max-w-md mx-auto">
        {hint ?? "Any file type. Your file stays on your device — only the hashes go on-chain."}
      </div>
    </div>
  );
}
