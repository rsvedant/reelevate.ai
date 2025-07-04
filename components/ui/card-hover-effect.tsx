"use client"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"
import { LucideIcon } from "lucide-react"
import { useState } from "react"

export const HoverEffect = ({
  items,
  className,
}: {
  items: {
    title: string
    description: string
    link?: string
    icon: LucideIcon
  }[]
  className?: string
}) => {
  let [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 py-4 sm:py-8",
        className
      )}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      {items.map((item, idx) => (
        <div
          key={idx}
          className="relative group block p-1 sm:p-2 h-full w-full"
          onMouseEnter={() => setHoveredIndex(idx)}
        >
          <AnimatePresence>
            {hoveredIndex === idx && (
              <motion.span
                className="absolute inset-0 h-full w-full bg-neutral-200 dark:bg-slate-800/[0.8] block rounded-xl sm:rounded-2xl"
                layoutId="hoverBackground"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: 0.15 },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.15 },
                }}
              />
            )}
          </AnimatePresence>
          <Card icon={item.icon}>
            <CardTitle>{item.title}</CardTitle>
            <CardDescription>{item.description}</CardDescription>
          </Card>
        </div>
      ))}
    </div>
  )
}

export const Card = ({
  className,
  children,
  icon: Icon,
}: {
  className?: string
  children: React.ReactNode
  icon: LucideIcon
}) => {
  return (
    <div
      className={cn(
        "rounded-2xl sm:rounded-xl h-full w-full p-5 sm:p-6 overflow-hidden bg-neutral/80 backdrop-blur-sm border border-white/[0.05] dark:border-white/[0.1] group-hover:border-slate-700 relative z-20",
        "transform transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-lg",
        className
      )}
    >
      <div className="relative z-50">
        <Icon className="w-6 h-6 sm:w-6 sm:h-6 text-primary mb-3 sm:mb-3" />
        <div className="space-y-2">{children}</div>
      </div>
    </div>
  )
}

export const CardTitle = ({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) => {
  return (
    <h4 className={cn("text-zinc-100 font-semibold tracking-wide text-base sm:text-base mb-1", className)}>
      {children}
    </h4>
  )
}

export const CardDescription = ({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) => {
  return (
    <p
      className={cn(
        "text-zinc-400 tracking-wide leading-relaxed text-sm sm:text-sm",
        className
      )}
    >
      {children}
    </p>
  )
}
