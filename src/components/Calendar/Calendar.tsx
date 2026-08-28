"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

interface CalendarProps {
  date: Date;
  onDateChange: (date: Date) => void;
  onDateSelect: (date: Date) => void;
  selectedDates: Date[];
  availableDates?: Date[];
}

export function Calendar({
  date,
  onDateChange,
  onDateSelect,
  selectedDates,
  availableDates = [],
}: CalendarProps) {
  const daysOfWeek = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const months = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    onDateChange(new Date(date.getFullYear(), date.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    onDateChange(new Date(date.getFullYear(), date.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(date.getFullYear(), date.getMonth(), day);
    onDateSelect(newDate);
  };

  const isDateSelected = (day: number) => {
    const testDate = new Date(date.getFullYear(), date.getMonth(), day);
    return selectedDates.some(
      (d) =>
        d.getDate() === testDate.getDate() &&
        d.getMonth() === testDate.getMonth() &&
        d.getFullYear() === testDate.getFullYear()
    );
  };

  const isDateAvailable = (day: number) => {
    const testDate = new Date(date.getFullYear(), date.getMonth(), day);
    return availableDates.some(
      (d) =>
        d.getDate() === testDate.getDate() &&
        d.getMonth() === testDate.getMonth() &&
        d.getFullYear() === testDate.getFullYear()
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    const testDate = new Date(date.getFullYear(), date.getMonth(), day);
    return (
      testDate.getDate() === today.getDate() &&
      testDate.getMonth() === today.getMonth() &&
      testDate.getFullYear() === today.getFullYear()
    );
  };

  const isPastDate = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const testDate = new Date(date.getFullYear(), date.getMonth(), day);
    return testDate < today;
  };

  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);

  // Adjust for Monday as first day of week
  const firstDay = (firstDayOfMonth + 6) % 7;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" onClick={prevMonth} size="sm">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">
          {months[month]} {year}
        </h2>
        <Button variant="outline" onClick={nextMonth} size="sm">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-muted-foreground p-2"
          >
            {day}
          </div>
        ))}

        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="p-2" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, day) => {
          const dayNum = day + 1;
          const isSelected = isDateSelected(dayNum);
          const isAvailable = isDateAvailable(dayNum);
          const isPast = isPastDate(dayNum);
          const isCurrentDay = isToday(dayNum);

          return (
            <Button
              key={dayNum}
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0 text-sm",
                isSelected && "bg-primary text-primary-foreground",
                isAvailable && !isSelected && "bg-accent",
                isPast && "text-muted-foreground cursor-not-allowed opacity-50",
                isCurrentDay && !isSelected && "border-2 border-primary"
              )}
              onClick={() => !isPast && handleDateClick(dayNum)}
              disabled={isPast}
            >
              {dayNum}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
