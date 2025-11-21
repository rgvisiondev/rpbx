"use client";

import { useEffect, useId, useState } from "react";

export default function OwnershipRange({
  defaultMin = 10,
  defaultMax = 60,
  nameMin,
  nameMax,
}: {
  defaultMin?: number;
  defaultMax?: number;
  nameMin: string;
  nameMax: string;
}) {
  const id = useId();
  const [minVal, setMinVal] = useState(defaultMin);
  const [maxVal, setMaxVal] = useState(defaultMax);

  useEffect(() => {
    if (minVal > maxVal) setMinVal(maxVal);
    if (maxVal < minVal) setMaxVal(minVal);
  }, [minVal, maxVal]);

  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span id={`${id}-min`} className="text-sm text-gray-600">Min %</span>
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            value={minVal}
            onChange={(e) => setMinVal(clamp(Number(e.target.value)))}
            className="mt-1 w-full border rounded px-3 py-2"
            aria-labelledby={`${id}-min`}
          />
        </label>
        <label className="block">
          <span id={`${id}-max`} className="text-sm text-gray-600">Max %</span>
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            value={maxVal}
            onChange={(e) => setMaxVal(clamp(Number(e.target.value)))}
            className="mt-1 w-full border rounded px-3 py-2"
            aria-labelledby={`${id}-max`}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={minVal}
          onChange={(e) => setMinVal(clamp(Number(e.target.value)))}
          aria-label="Minimum ownership percent"
        />
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={maxVal}
          onChange={(e) => setMaxVal(clamp(Number(e.target.value)))}
          aria-label="Maximum ownership percent"
        />
      </div>

      <div className="text-sm text-gray-700">
        Targeting <strong>{minVal}%</strong> – <strong>{maxVal}%</strong> ownership
      </div>

      <input type="hidden" name={nameMin} value={minVal} />
      <input type="hidden" name={nameMax} value={maxVal} />
    </div>
  );
}
