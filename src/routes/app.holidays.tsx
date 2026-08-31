import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { format, parseISO, getMonth } from "date-fns";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app/holidays")({
  component: HolidaysPage,
});

function HolidaysPage() {
  const { state } = useStore();
  const holidays = state.holidays || [];

  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>("all");

  const filteredHolidays = useMemo(() => {
    return holidays.filter((h) => {
      const matchesSearch = h.name.toLowerCase().includes(searchQuery.toLowerCase());

      const holidayMonth = getMonth(parseISO(h.date)).toString();
      const matchesMonth = filterMonth === "all" || holidayMonth === filterMonth;

      return matchesSearch && matchesMonth;
    });
  }, [holidays, searchQuery, filterMonth]);

  const calendarEvents = useMemo(() => {
    return holidays.map((h) => ({
      title: h.name,
      date: h.date,
      backgroundColor: h.type === "Government" ? "#8b5cf6" : "#0ea5e9", // vibrant colors
      borderColor: h.type === "Government" ? "#7c3aed" : "#0284c7",
      textColor: "#ffffff",
      extendedProps: {
        type: h.type,
      },
    }));
  }, [holidays]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Holidays</h1>
        <p className="text-muted-foreground mt-2">
          View all upcoming company and government holidays.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg border-primary/10">
          <CardHeader className="bg-muted/50 pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Calendar View
            </CardTitle>
            <CardDescription>Overview of all holidays in the month.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <div className="p-4 holiday-calendar min-w-[300px]">
              <FullCalendar
                plugins={[dayGridPlugin]}
                initialView="dayGridMonth"
                events={calendarEvents}
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "",
                }}
                height="auto"
                eventDisplay="block"
                eventDidMount={(arg) => {
                  arg.el.title = `${arg.event.title} (${arg.event.extendedProps.type})`;
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-primary/10 flex flex-col">
          <CardHeader className="bg-muted/50 pb-4">
            <CardTitle className="text-xl">Holiday List</CardTitle>
            <CardDescription>Detailed list of holidays.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search holiday..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background/50"
                />
              </div>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="w-full sm:w-[140px] bg-background/50">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {format(new Date(2024, i, 1), "MMMM")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border flex-1 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Holiday Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHolidays.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No holidays found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredHolidays.map((holiday) => {
                      const dateObj = parseISO(holiday.date);
                      return (
                        <TableRow key={holiday.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-medium">{holiday.name}</TableCell>
                          <TableCell>{format(dateObj, "MMM dd, yyyy")}</TableCell>
                          <TableCell>{format(dateObj, "EEEE")}</TableCell>
                          <TableCell>
                            <Badge
                              variant={holiday.type === "Government" ? "default" : "secondary"}
                              className={
                                holiday.type === "Government"
                                  ? "bg-violet-500 hover:bg-violet-600"
                                  : "bg-sky-500 hover:bg-sky-600 text-white"
                              }
                            >
                              {holiday.type}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <style>{`
        .holiday-calendar .fc {
          --fc-border-color: hsl(var(--border));
          --fc-button-bg-color: hsl(var(--primary));
          --fc-button-border-color: hsl(var(--primary));
          --fc-button-hover-bg-color: hsl(var(--primary) / 0.9);
          --fc-button-hover-border-color: hsl(var(--primary) / 0.9);
          --fc-button-active-bg-color: hsl(var(--primary) / 0.8);
          --fc-button-active-border-color: hsl(var(--primary) / 0.8);
          --fc-text-muted-color: hsl(var(--muted-foreground));
          --fc-page-bg-color: transparent;
          font-family: inherit;
        }
        .holiday-calendar .fc .fc-button-primary:not(:disabled):not(.fc-button-active) {
          background-color: hsl(var(--primary));
          border-color: hsl(var(--border));
          color: hsl(var(--primary-foreground));
        }
        .holiday-calendar .fc .fc-button-primary:not(:disabled):not(.fc-button-active):hover {
          background-color: hsl(var(--primary) / 0.9);
        }
        .holiday-calendar .fc .fc-col-header-cell {
          padding: 8px 0;
          font-weight: 600;
          font-size: 0.875rem;
        }
        .holiday-calendar .fc .fc-daygrid-day {
          background-color: hsl(var(--background));
        }
        .holiday-calendar .fc .fc-daygrid-day.fc-day-other {
          background-color: hsl(var(--muted));
        }
        .holiday-calendar .fc .fc-event {
          padding: 2px 4px;
          cursor: default;
          border-radius: 4px;
          margin: 1px 2px;
          transition: transform 0.2s;
        }
        .holiday-calendar .fc .fc-event:hover {
          transform: scale(1.02);
        }
        .holiday-calendar .fc .fc-event-title {
          font-size: 0.75rem;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
