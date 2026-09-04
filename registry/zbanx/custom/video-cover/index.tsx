"use client";

import type { CSSProperties, ReactNode, SyntheticEvent } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface VideoCoverProps {
  src?: string;
  alt?: string;
  className?: string;
  imageClassName?: string;
  children?: ReactNode;
}

export function VideoCover({
  src,
  alt = "",
  className,
  imageClassName,
  children,
}: VideoCoverProps) {
  const [isPortrait, setIsPortrait] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const handleLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    setIsPortrait(image.naturalHeight > image.naturalWidth);
    setHasLoaded(true);
  };

  const backgroundStyle: CSSProperties | undefined = src
    ? { backgroundImage: `url(${src})` }
    : undefined;

  return (
    <div
      className={cn("relative isolate overflow-hidden bg-muted", className)}
      data-loaded={hasLoaded}
      data-orientation={isPortrait ? "portrait" : "landscape"}
    >
      {src && isPortrait && (
        <div
          aria-hidden="true"
          className="absolute inset-0 scale-110 bg-center bg-cover"
          style={backgroundStyle}
        >
          <div className="absolute inset-0 bg-black/55" />
        </div>
      )}

      {src ? (
        <img
          src={src}
          alt={alt}
          className={cn(
            "absolute inset-0 size-full",
            isPortrait ? "object-contain" : "object-cover",
            imageClassName
          )}
          onLoad={handleLoad}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
          暂无视频封面
        </div>
      )}

      {children}
    </div>
  );
}
