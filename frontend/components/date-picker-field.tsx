"use client"

import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

export function DatePickerField({
  id,
  date,
  onDateChange,
}: {
  id: string
  date?: Date
  onDateChange: (date: Date | undefined) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex gap-2">
        <DialogTrigger asChild>
          <Button id={id} type="button" variant="outline" className="flex-1 justify-start">
            <CalendarIcon className="size-4" />
            {date ? format(date, "PPP") : "Pick a date"}
          </Button>
        </DialogTrigger>
        <Button type="button" variant="outline" onClick={() => onDateChange(undefined)}>
          Clear
        </Button>
      </div>
      <DialogContent className="w-auto max-w-none p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selected) => {
            onDateChange(selected)
            setOpen(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
