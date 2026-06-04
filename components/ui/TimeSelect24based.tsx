"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  className?: string;
}

export function TimeSelect({
  value,
  onChange,
  disabled,
  placeholder = "Time",
  extraTimes = [],
  className,
}: TimeSelectProps) {
  const options = generateTimeOptions(extraTimes);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className ?? "w-[110px] shrink-0"}>
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