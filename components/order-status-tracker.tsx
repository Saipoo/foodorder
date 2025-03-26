"use client"

import { CheckCircle2, Circle, Clock } from "lucide-react"

interface OrderStatusTrackerProps {
  currentStatus: string
}

export function OrderStatusTracker({ currentStatus }: OrderStatusTrackerProps) {
  const statuses = [
    { key: "placed", label: "Order Placed" },
    { key: "preparing", label: "Preparing" },
    { key: "ready", label: "Ready for Pickup" },
    { key: "completed", label: "Completed" },
  ]

  // Find the index of the current status
  const currentIndex = statuses.findIndex((status) => status.key === currentStatus)

  return (
    <div className="w-full">
      <div className="flex justify-between mb-2">
        {statuses.map((status, index) => (
          <div key={status.key} className="flex flex-col items-center">
            <div className="relative">
              {index <= currentIndex ? (
                <CheckCircle2 className="h-6 w-6 text-primary" />
              ) : index === currentIndex + 1 ? (
                <Clock className="h-6 w-6 text-muted-foreground animate-pulse" />
              ) : (
                <Circle className="h-6 w-6 text-muted-foreground" />
              )}

              {/* Connecting line */}
              {index < statuses.length - 1 && (
                <div
                  className={`absolute top-3 left-6 h-0.5 w-[calc(100%-1.5rem)] -translate-y-1/2 ${
                    index < currentIndex ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                />
              )}
            </div>
            <span
              className={`text-xs mt-1 ${index <= currentIndex ? "font-medium text-primary" : "text-muted-foreground"}`}
            >
              {status.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

