"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { theme } from "@/lib/new-home/theme/theme";

const generateTimeOptions = (extraTimes: string[] = []) => {
  const times = new Set<string>();
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      times.add(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  extraTimes.forEach((t) => t && times.add(t));
  return Array.from(times).sort();
};

interface TimeSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  extraTimes?: string[];
}

export function TimeSelect({
  value,
  onChange,
  disabled,
  placeholder = "Time",
  extraTimes = [],
}: TimeSelectProps) {
  const options = generateTimeOptions(extraTimes);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        className={`
    w-full
    rounded-xl
    border
    ${theme.borderAccent}
    bg-white
    shadow-none

    !ring-0
    !ring-offset-0

    focus:!ring-0
    focus-visible:!ring-0
    focus-visible:!outline-none

    data-[state=open]:!ring-0
    data-[state=open]:!outline-none
    data-[state=open]:border-[var(--brand-momentum)]
  `}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-60 overflow-y-auto">
        {options.map((t) => (
          <SelectItem key={t} value={t}>
            {t}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
