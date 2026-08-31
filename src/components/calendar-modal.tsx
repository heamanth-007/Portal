import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Calendar as CalendarIcon } from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";

interface Leave {
  id: string;
  userId: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: string;
}

interface CalendarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeName: string;
  leaves: Leave[];
  loading?: boolean;
  error?: string;
}

export function CalendarModal({
  open,
  onOpenChange,
  employeeName,
  leaves,
  loading = false,
  error,
}: CalendarModalProps) {
  const approvedLeaves = useMemo(() => {
    return leaves.filter((leave) => leave.status === "approved");
  }, [leaves]);

  // Calculate total leave days
  const totalLeaveDays = useMemo(() => {
    return approvedLeaves.reduce((total, leave) => {
      const from = new Date(leave.fromDate);
      const to = new Date(leave.toDate);
      const daysDiff = Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return total + daysDiff;
    }, 0);
  }, [approvedLeaves]);

  // Create calendar events from leave dates
  const calendarEvents = useMemo(() => {
    return approvedLeaves.flatMap((leave) => {
      const events = [];
      const from = new Date(leave.fromDate);
      const to = new Date(leave.toDate);

      // Generate events for each day in the leave period
      const currentDate = new Date(from);
      while (currentDate <= to) {
        events.push({
          title: "Leave",
          date: currentDate.toISOString().split("T")[0],
          backgroundColor: "#ef4444",
          borderColor: "#dc2626",
          textColor: "#ffffff",
          extendedProps: {
            reason: leave.reason,
          },
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return events;
    });
  }, [approvedLeaves]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <DialogTitle className="text-xl">{employeeName} - Leave Calendar</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Total approved leave days:{" "}
              <span className="font-semibold text-foreground">{totalLeaveDays}</span>
            </p>
            <DialogDescription className="sr-only">
              Calendar view showing all approved leaves.
            </DialogDescription>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-muted-foreground">Loading calendar...</span>
          </div>
        ) : error ? (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
        ) : (
          <div className="mt-4">
            {calendarEvents.length > 0 ? (
              <div className="calendar-wrapper rounded-md border border-border overflow-hidden">
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
                  contentHeight="auto"
                  eventDisplay="block"
                  dayCellDidMount={(arg: any) => {
                    arg.el.style.minHeight = "80px";
                  }}
                  eventDidMount={(arg: any) => {
                    if (arg.event.extendedProps.reason) {
                      arg.el.title = `${arg.event.extendedProps.reason}`;
                    }
                  }}
                />
                <style>{`
                  .fc {
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
                  .fc .fc-button-primary:not(:disabled):not(.fc-button-active) {
                    background-color: hsl(var(--primary));
                    border-color: hsl(var(--border));
                    color: hsl(var(--primary-foreground));
                  }
                  .fc .fc-button-primary:not(:disabled):not(.fc-button-active):hover {
                    background-color: hsl(var(--primary) / 0.9);
                  }
                  .fc .fc-col-header-cell {
                    padding: 10px 0;
                    font-weight: 600;
                    font-size: 0.875rem;
                  }
                  .fc .fc-daygrid-day {
                    background-color: hsl(var(--background));
                  }
                  .fc .fc-daygrid-day.fc-day-other {
                    background-color: hsl(var(--muted));
                  }
                  .fc .fc-event {
                    padding: 2px;
                    cursor: pointer;
                  }
                  .fc .fc-event-title {
                    font-size: 0.75rem;
                    font-weight: 500;
                  }
                `}</style>
              </div>
            ) : (
              <div className="rounded-md bg-muted p-8 text-center">
                <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No approved leave days for this employee.
                </p>
              </div>
            )}

            {approvedLeaves.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold mb-3">Leave Details</h4>
                <div className="space-y-2">
                  {approvedLeaves.map((leave) => {
                    const from = new Date(leave.fromDate);
                    const to = new Date(leave.toDate);
                    const dayCount =
                      Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    return (
                      <div
                        key={leave.id}
                        className="flex items-start gap-3 rounded-md border border-border bg-card p-3"
                      >
                        <div className="h-3 w-3 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                        <div className="flex-1 text-sm">
                          <div className="font-medium">
                            {from.toLocaleDateString()} → {to.toLocaleDateString()} ({dayCount}{" "}
                            days)
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">{leave.reason}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
