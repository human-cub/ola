import React from "react";

export type VirtualSpeedMark = number;

interface VirtualSpeedSliderProps {
  label?: string;
  marks: VirtualSpeedMark[];
  value: VirtualSpeedMark;
  onValueChange: (next: VirtualSpeedMark) => void;
  disabled?: boolean;
}

const clampIndex = (idx: number, max: number) => Math.max(0, Math.min(idx, max));

const nearestMarkIndex = (marks: VirtualSpeedMark[], value: VirtualSpeedMark) => {
  let bestIdx = 0;
  let bestDist = Infinity;
  marks.forEach((m, idx) => {
    const d = Math.abs(m - value);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = idx;
    }
  });
  return bestIdx;
};

const VirtualSpeedSlider = ({
  label = "Velocidad:",
  marks,
  value,
  onValueChange,
  disabled,
}: VirtualSpeedSliderProps) => {
  const maxIndex = Math.max(0, marks.length - 1);
  const index = clampIndex(nearestMarkIndex(marks, value), maxIndex);
  const percent = maxIndex === 0 ? 0 : (index / maxIndex) * 100;

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground font-medium">{label}</div>

      <div className="relative pt-2 pb-8">
        <input
          type="range"
          min={0}
          max={maxIndex}
          step={1}
          value={index}
          disabled={disabled}
          onChange={(e) => {
            const nextIndex = clampIndex(parseInt(e.target.value, 10) || 0, maxIndex);
            onValueChange(marks[nextIndex]);
          }}
          className="ola-virtual-speed-range"
          style={{
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            "--ola-virtual-speed-percent": `${percent}%`,
          }}
          aria-label="Velocidad"
        />

        {/* tick marks */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2">
          {marks.map((_, idx) => {
            const left = maxIndex === 0 ? 0 : (idx / maxIndex) * 100;
            return (
              <div
                key={idx}
                className="absolute -translate-x-1/2"
                style={{ left: `${left}%` }}
              >
                <div className="h-3 w-px bg-muted-foreground/60" />
              </div>
            );
          })}
        </div>

        {/* labels */}
        <div className="pointer-events-none absolute inset-x-0 top-[calc(50%+12px)] text-[10px] leading-none text-muted-foreground">
          {marks.map((mark, idx) => {
            const left = maxIndex === 0 ? 0 : (idx / maxIndex) * 100;
            const transform = idx === 0 ? "none" : idx === maxIndex ? "translateX(-100%)" : "translateX(-50%)";

            return (
              <span
                key={mark}
                className={idx === index ? "absolute font-semibold text-foreground" : "absolute"}
                style={{ left: `${left}%`, transform }}
              >
                {mark}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VirtualSpeedSlider;
