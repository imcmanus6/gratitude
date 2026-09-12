import Image from "next/image";
import { NAI_MARK_DARK_SRC, NAI_MARK_LIGHT_SRC } from "@/lib/brand";

interface LogoProps {
  className?: string;
  /** 'light' renders the white mark for dark surfaces, 'dark' the black mark. */
  variant?: "light" | "dark";
  priority?: boolean;
}

export function Logo({
  className = "w-8 h-8",
  variant = "light",
  priority = false,
}: LogoProps) {
  return (
    <div className={className}>
      <Image
        src={variant === "light" ? NAI_MARK_LIGHT_SRC : NAI_MARK_DARK_SRC}
        alt="Gratitude Circles"
        width={512}
        height={512}
        priority={priority}
        className="w-full h-full object-contain"
      />
    </div>
  );
}
