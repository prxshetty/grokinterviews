import { useMemo, useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useDimensions } from "@/hooks/use-debounced-dimensions";

interface AnimatedGradientProps {
  colors: string[];
  speed?: number;
  blur?: "light" | "medium" | "heavy";
}

// Seeded random number generator for consistent results
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const AnimatedGradient: React.FC<AnimatedGradientProps> = ({
  colors,
  speed = 5,
  blur = "light",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dimensions = useDimensions(containerRef);
  const [isClient, setIsClient] = useState(false);

  // Ensure we only render after hydration to prevent mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  const circleSize = useMemo(
    () => Math.max(dimensions.width, dimensions.height),
    [dimensions.width, dimensions.height]
  );

  // Generate stable random values based on index
  const circleConfigs = useMemo(() => {
    return colors.map((color, index) => {
      const seed = index + 1;
      return {
        color,
        top: seededRandom(seed * 1.1) * 50,
        left: seededRandom(seed * 1.2) * 50,
        tx1: seededRandom(seed * 1.3) - 0.5,
        ty1: seededRandom(seed * 1.4) - 0.5,
        tx2: seededRandom(seed * 1.5) - 0.5,
        ty2: seededRandom(seed * 1.6) - 0.5,
        tx3: seededRandom(seed * 1.7) - 0.5,
        ty3: seededRandom(seed * 1.8) - 0.5,
        tx4: seededRandom(seed * 1.9) - 0.5,
        ty4: seededRandom(seed * 2.0) - 0.5,
        sizeMultiplier: 0.5 + seededRandom(seed * 2.1) * 1.0, // 0.5 to 1.5
      };
    });
  }, [colors]);

  const blurClass =
    blur === "light"
      ? "blur-2xl"
      : blur === "medium"
        ? "blur-3xl"
        : "blur-[100px]";

  // Don't render anything until after hydration
  if (!isClient) {
    return (
      <div ref={containerRef} className="absolute inset-0 overflow-hidden">
        <div className={cn(`absolute inset-0`, blurClass)} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <div className={cn(`absolute inset-0`, blurClass)}>
        {circleConfigs.map((config, index) => (
          <svg
            key={index}
            className="absolute animate-background-gradient"
            style={
              {
                top: `${config.top}%`,
                left: `${config.left}%`,
                "--background-gradient-speed": `${1 / speed}s`,
                "--tx-1": config.tx1,
                "--ty-1": config.ty1,
                "--tx-2": config.tx2,
                "--ty-2": config.ty2,
                "--tx-3": config.tx3,
                "--ty-3": config.ty3,
                "--tx-4": config.tx4,
                "--ty-4": config.ty4,
              } as React.CSSProperties
            }
            width={circleSize * config.sizeMultiplier}
            height={circleSize * config.sizeMultiplier}
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="50"
              fill={config.color}
              className="opacity-30 dark:opacity-[0.15]"
            />
          </svg>
        ))}
      </div>
    </div>
  );
};

export { AnimatedGradient }; 