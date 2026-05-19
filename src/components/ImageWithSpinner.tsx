import { useState } from "react";
import H3MasterSpinner from "@/components/H3MasterSpinner";
import { cn } from "@/lib/utils";

interface ImageWithSpinnerProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Optional classes for the wrapping <div>. Default fills its parent. */
  containerClassName?: string;
  /** Spinner size in px. Default 32. */
  spinnerSize?: number;
  /** If provided, swap src to fallbackSrc on first error event. */
  fallbackSrc?: string;
}

/**
 * <img> wrapper that overlays an H3MasterSpinner while the remote image
 * is loading. Fades the <img> in via opacity transition on onLoad.
 * Spinner is hidden after either onLoad or fatal onError.
 */
export default function ImageWithSpinner({
  src,
  alt,
  className,
  containerClassName,
  spinnerSize = 32,
  fallbackSrc,
  onLoad,
  onError,
  ...rest
}: ImageWithSpinnerProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const effectiveSrc = errored && fallbackSrc ? fallbackSrc : src;

  return (
    <div className={cn("relative w-full h-full", containerClassName)}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <H3MasterSpinner size={spinnerSize} variant="draw" className="text-primary" />
        </div>
      )}
      <img
        src={effectiveSrc}
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          className,
        )}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
        onError={(e) => {
          if (fallbackSrc && !errored) {
            setErrored(true);
            setLoaded(false);
          } else {
            setLoaded(true);
            onError?.(e);
          }
        }}
        {...rest}
      />
    </div>
  );
}
