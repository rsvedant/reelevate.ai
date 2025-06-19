"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed bottom-0 left-0 z-[100] flex w-full flex-col p-2 md:max-w-[320px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-lg border p-4 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-left-full data-[state=open]:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border-gray-800 bg-black text-white",
        destructive: "border-red-900 bg-black text-white",
        success: "border-green-900 bg-black text-white",
        warning: "border-amber-900 bg-black text-white",
        error: "border-red-900 bg-black text-white",
        info: "border-blue-900 bg-black text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface ToastProps extends 
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root>,
  VariantProps<typeof toastVariants> {
  duration?: number
  showProgress?: boolean
}

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  ToastProps
>(({ className, variant, duration = 5000, showProgress = true, ...props }, ref) => {
  const [progress, setProgress] = React.useState(100)
  const [isHovered, setIsHovered] = React.useState(false)
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const elapsedTimeRef = React.useRef(0)
  const lastUpdateRef = React.useRef(Date.now())
  
  React.useEffect(() => {
    if (!showProgress) return
    
    const interval = 50
    lastUpdateRef.current = Date.now()
    
    // Start the dismissal timer
    const startDismissalTimer = () => {
      const remainingTime = duration - elapsedTimeRef.current
      if (remainingTime > 0) {
        timeoutRef.current = setTimeout(() => {
          // Find and click the close button to dismiss the toast
          const toastElement = document.querySelector('[data-radix-toast-close]') as HTMLElement
          if (toastElement) {
            toastElement.click()
          }
        }, remainingTime)
      }
    }
    
    intervalRef.current = setInterval(() => {
      if (!isHovered) {
        const now = Date.now()
        const deltaTime = now - lastUpdateRef.current
        elapsedTimeRef.current += deltaTime
        
        const newProgress = Math.max(0, 100 - (elapsedTimeRef.current / duration) * 100)
        setProgress(newProgress)
        
        if (newProgress <= 0 && !timeoutRef.current) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
          }
          setTimeout(() => {
            const toastElement = document.querySelector('[data-radix-toast-close]') as HTMLElement
            if (toastElement) {
              toastElement.click()
            }
          }, 0)
        }
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
      }
      lastUpdateRef.current = Date.now()
    }, interval)
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [duration, showProgress, isHovered])
  
  const getProgressColor = () => {
    switch (variant) {
      case 'destructive': return 'bg-red-500'
      case 'success': return 'bg-green-500'
      case 'warning': return 'bg-amber-500'
      case 'error': return 'bg-red-500'
      case 'info': return 'bg-blue-500'
      default: return 'bg-white'
    }
  }

  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      duration={showProgress ? 1000000 : duration}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {/* Content */}
      <div className="flex-1 min-w-0">
        {props.children}
      </div>
      
      {/* Progress timer */}
      {showProgress && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-800">
          <div 
            className={`h-full transition-all duration-75 ease-linear ${getProgressColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </ToastPrimitives.Root>
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-gray-700 bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-gray-400 opacity-70 transition-opacity hover:text-white hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100",
      className
    )}
    data-radix-toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

const Toaster = () => {
  const { toasts } = useToast()

  return (
    <>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </>
  )
}

type ToastActionElement = React.ReactElement<typeof ToastAction>


export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  Toaster,
}