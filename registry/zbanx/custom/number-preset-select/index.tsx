"use client";

import { ChevronDown, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/registry/zbanx/ui/button";
import { Input } from "@/registry/zbanx/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/registry/zbanx/ui/popover";

export interface NumberPresetOption {
  value: number;
  label?: string;
}

export interface NumberPresetSelectProps {
  value?: number;
  options?: NumberPresetOption[];
  onChange?: (value: number | undefined) => void;
  placeholder?: string;
  unlimitedLabel?: string;
  prefix?: string;
  suffix?: string;
  inputPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  variant?: "form" | "condition";
  conditionLabel?: string;
}

function formatValue(
  value: number | undefined,
  options: NumberPresetOption[],
  prefix: string,
  suffix: string,
  unlimitedLabel: string,
  placeholder: string
) {
  if (value == null) return unlimitedLabel || placeholder;
  const option = options.find((item) => item.value === value);
  if (option?.label) return option.label;
  return `${prefix}${value}${suffix}`;
}

export function NumberPresetSelect({
  value,
  options = [],
  onChange,
  placeholder = "请选择",
  unlimitedLabel = "不限",
  prefix = "",
  suffix = "",
  inputPlaceholder = "请输入",
  disabled = false,
  className,
  variant = "form",
  conditionLabel,
}: NumberPresetSelectProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<number | undefined>(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const apply = (nextValue: number | undefined) => {
    onChange?.(nextValue);
    setOpen(false);
  };

  const displayValue = formatValue(
    value,
    options,
    prefix,
    suffix,
    unlimitedLabel,
    placeholder
  );
  return (
    <Popover open={disabled ? false : open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            disabled={disabled}
            className={cn(
              variant === "condition"
                ? "inline-flex h-6 cursor-pointer items-center gap-1 rounded-full border border-border bg-secondary px-2 text-secondary-foreground text-xs transition-colors hover:bg-accent"
                : "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-left text-sm",
              value == null && "text-muted-foreground",
              className
            )}
          />
        }
      >
        <span className="min-w-0 flex-1 truncate">
          {variant === "condition" && conditionLabel && (
            <span className="text-muted-foreground">{conditionLabel}：</span>
          )}
          <span className={variant === "condition" ? "font-medium" : ""}>
            {displayValue}
          </span>
        </span>
        {value != null ? (
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
            aria-label="清除数值"
          >
            <X className="size-4" />
          </span>
        ) : (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        )}
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "max-w-[calc(100vw-2rem)] p-2",
          variant === "condition" ? "w-64" : "w-(--anchor-width)"
        )}
        align="start"
      >
        <div className="flex flex-wrap gap-2 pb-2">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={cn(
                "rounded-md border bg-muted px-2 py-1.5 text-xs transition-colors hover:bg-accent hover:text-accent-foreground",
                draft === option.value &&
                  "border-primary bg-primary/10 text-primary"
              )}
              onClick={() => {
                setDraft(option.value);
              }}
            >
              {option.label ?? `${prefix}${option.value}${suffix}`}
            </button>
          ))}
        </div>
        <div className="flex h-8 items-stretch overflow-hidden rounded-md border border-input">
          {prefix && (
            <span className="flex shrink-0 items-center border-input border-r bg-muted px-2 text-muted-foreground text-sm">
              {prefix}
            </span>
          )}
          <Input
            type="number"
            min={0}
            value={draft ?? ""}
            onChange={(event) => {
              const raw = event.target.value;
              setDraft(raw === "" ? undefined : Number(raw));
            }}
            placeholder={inputPlaceholder}
            className="h-full min-w-0 flex-1 rounded-none border-0 text-center shadow-none focus-visible:ring-0"
          />
          {suffix && (
            <span className="flex shrink-0 items-center border-input border-l bg-muted px-2 text-muted-foreground text-sm">
              {suffix}
            </span>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setDraft(value);
              setOpen(false);
            }}
          >
            取消
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() =>
              apply(draft == null || Number.isNaN(draft) ? undefined : draft)
            }
          >
            确定
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default NumberPresetSelect;
