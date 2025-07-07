import React from "react"
// Removed framer-motion import for better LCP performance
import { AnimatedGradient } from "@/components/ui/animated-gradient-with-svg"

interface BentoCardProps {
  title: string
  value: string | number
  subtitle?: string
  colors: string[]
  delay: number
}

const BentoCard: React.FC<BentoCardProps> = ({
  title,
  value,
  subtitle,
  colors,
  delay,
}) => {
  return (
    <div
      className="relative overflow-hidden h-full bg-transparent min-h-[120px] sm:min-h-[140px] md:min-h-[160px] opacity-0 animate-fade-in"
      style={{
        animationDelay: `${delay}s`,
        animationFillMode: 'forwards'
      }}
    >
      <AnimatedGradient colors={colors} speed={0.05} blur="medium" />
      <div
        className="relative z-10 p-4 sm:p-6 md:p-8 text-foreground backdrop-blur-sm font-sans h-full flex flex-col justify-center"
      >
        <h3 
          className="text-xs sm:text-sm md:text-base lg:text-lg text-foreground font-normal mb-2 sm:mb-3" 
        >
          {title}
        </h3>
        <p
          className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-normal mb-2 sm:mb-4 text-foreground"
        >
          {value}
        </p>
        {subtitle && (
          <p 
            className="text-xs sm:text-sm text-foreground/80 font-normal" 
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

export { BentoCard }; 