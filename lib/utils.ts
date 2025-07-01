import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const extractThinkingContent = (content: string) => {
  const thinkRegex = /<think>([\s\S]*?)<\/think>/g
  let thinking = ""
  let processedContent = content

  const thinkMatches = content.match(thinkRegex)
  if (thinkMatches) {
    thinkMatches.forEach((match) => {
      thinking += match.replace(/<think>|<\/think>/g, "")
      processedContent = processedContent.replace(match, "")
    })
  }

  const thinkStartIndex = processedContent.lastIndexOf("<think>")
  if (thinkStartIndex !== -1) {
    const thinkEndIndex = processedContent.lastIndexOf("</think>")
    if (thinkEndIndex < thinkStartIndex) {
      const partToMove = processedContent.substring(thinkStartIndex)
      thinking += partToMove.replace("<think>", "")
      processedContent = processedContent.substring(0, thinkStartIndex)
    }
  }

  return { content: processedContent.trim(), thinking: thinking.trim() }
}

export function truncateString(str: string, maxLength: number) {
  if (str.length <= maxLength) {
    return str
  }
  return str.slice(0, maxLength) + ".."
}
