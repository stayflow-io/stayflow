"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar, LayoutList } from "lucide-react"
import { CalendarView } from "./calendar-view"
import { CalendarTimeline } from "./calendar-timeline"
import { BulkBlockDialog } from "./bulk-block-dialog"

type Property = {
  id: string
  name: string
  ownerId: string | null
}

type Owner = {
  id: string
  name: string
}

interface CalendarWrapperProps {
  properties: Property[]
  owners: Owner[]
}

export function CalendarWrapper({ properties, owners }: CalendarWrapperProps) {
  const [viewMode, setViewMode] = useState<"month" | "timeline">("timeline")

  return (
    <div className="space-y-4">
      {/* Toggle de visualizacao e acoes */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground mr-2">Visualizacao:</span>
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === "timeline" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("timeline")}
              className="rounded-r-none"
            >
              <LayoutList className="h-4 w-4 mr-2" />
              Timeline
            </Button>
            <Button
              variant={viewMode === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("month")}
              className="rounded-l-none"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Mensal
            </Button>
          </div>
        </div>

        {/* Acoes */}
        <div className="flex items-center gap-2">
          <BulkBlockDialog />
        </div>
      </div>

      {/* Componente de calendario */}
      {viewMode === "timeline" ? (
        <CalendarTimeline properties={properties} owners={owners} />
      ) : (
        <CalendarView properties={properties} owners={owners} />
      )}
    </div>
  )
}
