import { hasFlag } from "country-flag-icons";
import * as Flags from "country-flag-icons/react/3x2";
import type { ElementType } from "react";

type CountryFlagProps = {
  value?: string;
  valueFormatted?: string;
  // 是否展示国家名称
  showName?: boolean;
  iconPosition?: "start" | "end";
  iconProps?: React.ComponentProps<"svg"> & { className?: string };
};

export default function CountryFlag({
  value,
  valueFormatted,
  showName = true,
  iconPosition = "start",
  iconProps,
}: CountryFlagProps) {
  if (!value) {
    return "-";
  }
  const country = value.toUpperCase();
  const flagCountry = country === "UK" ? "GB" : country;
  const name = valueFormatted || country;
  if (!hasFlag(flagCountry)) {
    return name;
  }
  const Flag = (Flags as Record<string, ElementType>)[flagCountry];
  const icon = Flag ? (
    <Flag className="h-4 w-6 shrink-0" {...iconProps} />
  ) : (
    <span>{country}</span>
  );

  return (
    <div className="flex items-center gap-1.5">
      {iconPosition === "start" && icon}
      {showName && <div className="truncate">{name}</div>}
      {iconPosition === "end" && icon}
    </div>
  );
}
