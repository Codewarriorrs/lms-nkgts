import * as React from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";

// Props interface for type safety and component reusability
interface CircularProgressCardProps {
  title: string;
  description: string;
  currentValue: number;
  goalValue: number;
  currency?: string;
  progressColor?: string; // Prop to customize the progress bar color
  className?: string;
}

/**
 * A reusable card component to display goal progress with an animated circular bar.
 * The progress bar color is customizable via the `progressColor` prop.
 */
export const CircularProgressCard = ({
  title,
  description,
  currentValue,
  goalValue,
  currency = "$",
  progressColor,
  className,
}: CircularProgressCardProps) => {
  const cardRef = React.useRef<HTMLDivElement>(null);
  // Animate the progress bar when it enters the viewport
  const isInView = useInView(cardRef, { once: true, margin: "-20%" });

  // Memoize calculations for performance optimization
  const {
    progressPercentage,
    circumference,
    strokeDashoffset,
  } = React.useMemo(() => {
    const radius = 80;
    const circ = 2 * Math.PI * radius;
    const progress = goalValue > 0 ? Math.min(Math.max((currentValue / goalValue) * 100, 0), 100) : 0;
    const offset = circ * (1 - progress / 100);
    return {
      progressPercentage: Math.round(progress),
      circumference: circ,
      strokeDashoffset: offset,
    };
  }, [currentValue, goalValue]);

  // Determine the stroke color, defaulting to the primary theme color
  const color = progressColor || "var(--color-primary, #1A3F8F)";

  return (
    <Card ref={cardRef} className={cn("w-full max-w-sm text-center flex flex-col justify-between hover:border-neutral-200 transition-colors shadow-2xs bg-white", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-extrabold text-neutral-900 line-clamp-1">{title}</CardTitle>
        <CardDescription className="text-xs text-neutral-400 line-clamp-1">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="relative mx-auto h-36 w-36">
          {/* SVG container for the circular progress bar */}
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 200 200"
            role="img"
            aria-label={`Progress: ${progressPercentage}%`}
          >
            {/* Rotate the entire SVG to start the progress from the top */}
            <g transform="rotate(-90, 100, 100)">
              {/* Background track */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="transparent"
                stroke="var(--color-neutral-100, #E8ECF4)"
                strokeWidth="16"
              />
              {/* Animated foreground progress bar */}
              <motion.circle
                cx="100"
                cy="100"
                r="80"
                fill="transparent"
                stroke={color} // Apply the customizable color
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={isInView ? { strokeDashoffset } : {}}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </g>
          </svg>
          {/* Text content centered inside the circle */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-neutral-900">
              {progressPercentage}%
            </span>
            <span className="text-[10px] text-neutral-400 font-bold mt-0.5">
              {currentValue} / {goalValue} {currency ? currency : "Modul"}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 pb-4 border-t border-neutral-50 justify-center">
        <span className="text-[11px] text-primary hover:text-primary-light font-black tracking-wider uppercase transition-colors">
          Lihat Detail →
        </span>
      </CardFooter>
    </Card>
  );
};
