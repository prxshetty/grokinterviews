import React from "react"
import { motion } from "framer-motion"

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
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: delay + 0.3,
      },
    },
  }

  const item = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.5 } },
  }

  return (
    <motion.div
      className="relative overflow-hidden h-full bg-transparent min-h-[120px] sm:min-h-[140px] md:min-h-[160px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay }}
    >
      <AnimatedGradient colors={colors} speed={0.05} blur="medium" />
      <motion.div
        className="relative z-10 p-4 sm:p-6 md:p-8 text-foreground backdrop-blur-sm font-sans h-full flex flex-col justify-center"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.h3 
          className="text-xs sm:text-sm md:text-base lg:text-lg text-foreground font-normal mb-2 sm:mb-3" 
          variants={item}
        >
          {title}
        </motion.h3>
        <motion.p
          className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-normal mb-2 sm:mb-4 text-foreground"
          variants={item}
        >
          {value}
        </motion.p>
        {subtitle && (
          <motion.p 
            className="text-xs sm:text-sm text-foreground/80 font-normal" 
            variants={item}
          >
            {subtitle}
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  )
}

export { BentoCard }; 