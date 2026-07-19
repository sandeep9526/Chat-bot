"use client";

import { useRef } from "react";

interface LogoFieldProps {
  value: string;
  onChange: (v: string) => void;
}

export function LogoField({ value, onChange }: LogoFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result)); // data URL
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- user logo preview
          <img
            src={value}
            alt="Logo preview"
            className="h-10 w-10 rounded-[10px] border border-border object-cover"
          />
        ) : (
          <div className="grid h-10 w-10 place-items-center rounded-[10px] border border-dashed border-border text-faint">
            <ImageIcon className="h-4 w-4" />
          </div>
        )}
        <button
          type="button"
          className="cursor-pointer rounded-[8px] border border-border bg-panel px-3 py-[7px] font-ui text-xs font-[600] text-fg hover:border-accent focus-visible:outline-2 focus-visible:outline-accent"
          onClick={() => fileRef.current?.click()}
        >
          Upload
        </button>
        {value && (
          <button
            type="button"
            className="cursor-pointer rounded-[8px] border border-border bg-panel px-3 py-[7px] font-ui text-xs font-[600] text-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
            onClick={() => onChange("")}
          >
            Remove
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>
      <input
        className="w-full rounded-[9px] border border-border bg-surface px-[11px] py-[9px] font-ui text-[13px] text-fg outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-ring"
        placeholder="…or paste an image URL"
        value={value.startsWith("data:") ? "" : value}
        onChange={(e) => onChange(e.target.value.trim())}
      />
    </div>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}
