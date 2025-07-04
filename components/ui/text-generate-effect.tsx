"use client"

import { useEffect } from "react"
import { motion, useAnimation } from "framer-motion"

export const TextGenerateEffect = ({ words }: { words: string }) => {
  const controls = useAnimation()
  const wordArray = words.split(" ")

  useEffect(() => {
    controls.start((i) => ({
      opacity: 1,
      transition: { delay: i * 0.1 },
    }))
  }, [controls, wordArray.length])

  return (
    <div className="font-bold">
      {wordArray.map((word, i) => (
        <motion.span
          key={i}
          custom={i}
          animate={controls}
          initial={{ opacity: 0 }}
          className="inline-block mr-1"
        >
          {word}
        </motion.span>
      ))}
    </div>
  )
}