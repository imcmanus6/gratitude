import { SeedHeart } from "@/components/seed-heart";
import { Logo } from "@/components/logo";
import { NAI_ATTRIBUTION, NAI_PRODUCT_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

const MARK_SIZE = {
  sm: "w-16 h-16",
  md: "w-28 h-28",
  lg: "w-40 h-40 sm:w-48 sm:h-48",
} as const;

const NAME_SIZE = {
  sm: "text-sm",
  md: "text-xl",
  lg: "text-3xl sm:text-4xl",
} as const;

interface NaiLockupProps {
  size?: keyof typeof MARK_SIZE;
  variant?: "light" | "dark";
  /** Hide the attribution line where the lockup sits inside dense UI. */
  showAttribution?: boolean;
  className?: string;
  priority?: boolean;
  animated?: boolean;
}

/**
 * Vertical brand lockup: the flower, the product name in tracked uppercase,
 * and the NAI attribution set smaller and visually secondary.
 */
export function NaiLockup({
  size = "md",
  variant = "light",
  showAttribution = true,
  className,
  priority = false,
  animated = false,
}: NaiLockupProps) {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      {animated ? (
        <div
          className={`${MARK_SIZE[size]} ${variant === "light" ? "text-white" : "text-neutral-900"}`}
        >
          <SeedHeart />
        </div>
      ) : (
        <Logo
          className={MARK_SIZE[size]}
          variant={variant}
          priority={priority}
        />
      )}
      <p
        className={cn(
          "mt-6 font-light uppercase tracking-[0.35em]",
          NAME_SIZE[size],
        )}
      >
        {NAI_PRODUCT_NAME}
      </p>
      {showAttribution && (
        <p
          className={cn(
            "mt-3 text-[0.65rem] uppercase tracking-[0.3em]",
            variant === "light" ? "text-white/45" : "text-black/45",
          )}
        >
          {NAI_ATTRIBUTION}
        </p>
      )}
    </div>
  );
}
