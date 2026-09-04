"use client";

import { ChevronDown, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/registry/zbanx/ui/button";
import { Input } from "@/registry/zbanx/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/registry/zbanx/ui/popover";

export type NumberRangeValue = {
  min?: number;
  max?: number;
};

export type NumberRangeOption = NumberRangeValue & {
  label: string;
  value?: string;
};

export type NumberRangeSelectProps = {
  value?: NumberRangeValue;
  options?: NumberRangeOption[];
  onChange?: (value: NumberRangeValue | undefined) => void;
  placeholder?: string;
  unit?: string;
  disabled?: boolean;
  skipConfirm?: boolean;
  className?: string;
  contentClassName?: string;
};

export function parseNumberRange(value?: string): NumberRangeValue | undefined {
  if (!value) return undefined;
  const [min, max] = value.split("|").map((item) => Number(item));
  return {
    ...(Number.isFinite(min) ? { min } : {}),
    ...(Number.isFinite(max) ? { max } : {}),
  };
}

export function stringifyNumberRange(
  value?: NumberRangeValue
): string | undefined {
  if (!value || (value.min == null && value.max == null)) return undefined;
  return `${value.min ?? ""}|${value.max ?? ""}`;
}

function formatCompactNumber(value: number, unit = "") {
  const suffix = unit || (value >= 1_000_000 ? "M" : value >= 1_000 ? "K" : "");
  const divisor =
    unit === "M" || (!unit && value >= 1_000_000)
      ? 1_000_000
      : unit === "K" || (!unit && value >= 1_000)
        ? 1_000
        : 1;
  const amount = value / divisor;
  const formatted = Number.isInteger(amount)
    ? String(amount)
    : amount.toFixed(1);
  return `${formatted}${suffix}`;
}

function formatRange(
  value: NumberRangeValue | undefined,
  options: NumberRangeOption[],
  unit: string
) {
  if (!value || (value.min == null && value.max == null)) return "";
  const matchedOption = options.find(
    (option) => option.min === value.min && option.max === value.max
  );
  if (matchedOption) return matchedOption.label;

  const min = value.min == null ? "0" : formatCompactNumber(value.min, unit);
  const max = value.max == null ? "" : formatCompactNumber(value.max, unit);
  return max ? `${min} - ${max}` : `${min}+`;
}

function getUnitScale(unit: string) {
  if (unit === "M") return 1_000_000;
  if (unit === "K") return 1_000;
  return 1;
}

function formatInputValue(value: number | undefined, unit: string) {
  if (value == null) return "";
  return String(value / getUnitScale(unit));
}

function normalizeRange(value?: NumberRangeValue): NumberRangeValue {
  if (value?.min != null && value.max != null && value.min > value.max) {
    return { min: value.max, max: value.min };
  }

  return {
    min: value?.min,
    max: value?.max,
  };
}

function sameRange(first?: NumberRangeValue, second?: NumberRangeValue) {
  return first?.min === second?.min && first?.max === second?.max;
}

export function NumberRangeSelect({
  value,
  options = [],
  onChange,
  placeholder = "请选择范围",
  unit = "",
  disabled = false,
  skipConfirm = false,
  className,
  contentClassName,
}: NumberRangeSelectProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<NumberRangeValue>(normalizeRange(value));
  const unitScale = getUnitScale(unit);
  const displayValue = useMemo(
    () => formatRange(value, options, unit),
    [value, options, unit]
  );

  useEffect(() => {
    setDraft(normalizeRange(value));
  }, [value]);

  const apply = (nextValue?: NumberRangeValue) => {
    const normalized = normalizeRange(nextValue);
    onChange?.(
      normalized.min == null && normalized.max == null ? undefined : normalized
    );
    setOpen(false);
  };

  const updateDraft = (key: "min" | "max", rawValue: string) => {
    const parsed = rawValue === "" ? undefined : Number(rawValue) * unitScale;
    setDraft((current) => ({
      ...current,
      [key]: parsed == null || Number.isNaN(parsed) ? undefined : parsed,
    }));
  };

  return (
    <Popover open={disabled ? false : open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-left text-sm",
              !displayValue && "text-muted-foreground",
              className
            )}
          />
        }
      >
        <span className="min-w-0 flex-1 truncate">
          {displayValue || placeholder}
        </span>
        {displayValue ? (
          <span
            role="button"
            tabIndex={0}
            className="shrink-0 text-muted-foreground"
            onClick={(event) => {
              event.stopPropagation();
              apply(undefined);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                apply(undefined);
              }
            }}
            aria-label="清除范围"
          >
            <X className="size-4" />
          </span>
        ) : (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        )}
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-(--anchor-width) max-w-[calc(100vw-2rem)] p-2",
          contentClassName
        )}
        align="start"
      >
        {options.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-2">
            {options.map((option) => {
              const selected = sameRange(draft, option);
              return (
                <button
                  key={option.value ?? option.label}
                  type="button"
                  className={cn(
                    "rounded-md border bg-muted px-2 py-1.5 text-xs transition-colors hover:bg-accent hover:text-accent-foreground",
                    selected && "border-primary bg-primary/10 text-primary"
                  )}
                  onClick={() => {
                    setDraft(option);
                    if (skipConfirm) apply(option);
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        )}
        <div className="flex h-8 items-stretch overflow-hidden rounded-md border border-input">
          <Input
            type="number"
            min={0}
            value={formatInputValue(draft.min, unit)}
            onChange={(event) => updateDraft("min", event.target.value)}
            placeholder="最小值"
            aria-label="最小值"
            className="h-full min-w-0 flex-1 rounded-none border-0 text-center shadow-none focus-visible:ring-0"
          />
          <span className="flex w-8 shrink-0 items-center justify-center border-input border-x bg-muted text-muted-foreground">
            -
          </span>
          <Input
            type="number"
            min={0}
            value={formatInputValue(draft.max, unit)}
            onChange={(event) => updateDraft("max", event.target.value)}
            placeholder="最大值"
            aria-label="最大值"
            className="h-full min-w-0 flex-1 rounded-none border-0 text-center shadow-none focus-visible:ring-0"
          />
          <span className="flex w-8 shrink-0 items-center justify-center border-input border-l bg-muted font-medium text-muted-foreground text-sm">
            {unit || "-"}
          </span>
        </div>
        <div className="flex justify-end gap-2 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
          >
            取消
          </Button>
          <Button type="button" size="sm" onClick={() => apply(draft)}>
            确定
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default NumberRangeSelect;
