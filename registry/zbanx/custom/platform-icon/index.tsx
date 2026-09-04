"use client";

import { Globe, Handshake, UsersRound } from "lucide-react";
import {
  FaBloggerB,
  FaInstagram,
  FaPinterest,
  FaReddit,
  FaTiktok,
  FaYoutube,
} from "react-icons/fa6";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/registry/zbanx/ui/tooltip";

export type Platform =
  | "youtube"
  | "tiktok"
  | "instagram"
  | "group"
  | "other"
  | "blog"
  | "deal"
  | "reddit"
  | "pinterest"
  | string;

const PLATFORM_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    color: string;
  }
> = {
  youtube: { icon: FaYoutube, label: "YouTube", color: "text-[#FF0000]" },
  instagram: { icon: FaInstagram, label: "Instagram", color: "text-[#E4405F]" },
  tiktok: { icon: FaTiktok, label: "TikTok", color: "text-foreground" },
  group: { icon: UsersRound, label: "Group", color: "text-primary" },
  other: { icon: Globe, label: "Other", color: "text-muted-foreground" },
  blog: { icon: FaBloggerB, label: "Blog", color: "text-[#F57C00]" },
  deal: { icon: Handshake, label: "Deal", color: "text-muted-foreground" },
  reddit: { icon: FaReddit, label: "Reddit", color: "text-[#FF4500]" },
  pinterest: {
    icon: FaPinterest,
    label: "Pinterest",
    color: "text-[#E60023]",
  },
};

const SIZE_MAP = {
  xs: "size-3",
  sm: "size-4",
  md: "size-5",
  lg: "size-7",
  xl: "size-9",
} as const;

interface PlatformIconProps {
  platform: Platform;
  size?: keyof typeof SIZE_MAP;
  tooltip?: boolean;
  href?: string;
  className?: string;
}

export function PlatformIcon({
  platform,
  size = "md",
  tooltip = true,
  href,
  className,
}: PlatformIconProps) {
  const normalizedPlatform = platform.trim().toLowerCase();
  const config = PLATFORM_CONFIG[normalizedPlatform] ?? {
    icon: Globe,
    label: platform || "未知平台",
    color: "text-muted-foreground",
  };
  const Icon = config.icon;
  const sizeClass = SIZE_MAP[size];

  const icon = <Icon className={cn(sizeClass, config.color, className)} />;

  if (!tooltip) {
    return href ? (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-label={config.label}
        className="inline-flex cursor-pointer items-center rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {icon}
      </a>
    ) : (
      icon
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          href ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex cursor-pointer items-center rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          ) : (
            <span className="inline-flex cursor-default" />
          )
        }
      >
        {icon}
      </TooltipTrigger>
      <TooltipContent>{config.label}</TooltipContent>
    </Tooltip>
  );
}
