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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, CalendarDays, Plus, Edit2, Trash2 } from "lucide-react";
import { Holiday, HolidayType } from "@/lib/mock-data";

export const Route = createFileRoute("/app/admin/holidays")({
  component: AdminHolidaysPage,
});

function AdminHolidaysPage() {
  const { state, addHoliday, updateHoliday, deleteHoliday } = useStore();
  const holidays = state.holidays || [];

  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    date: "",
    type: "Government" as HolidayType,
    description: "",
  });

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
      id: h.id,
      title: h.name,
      date: h.date,
      backgroundColor: h.type === "Government" ? "#8b5cf6" : "#0ea5e9",
      borderColor: h.type === "Government" ? "#7c3aed" : "#0284c7",
      textColor: "#ffffff",
      extendedProps: {
        type: h.type,
      },
    }));
  }, [holidays]);

  const handleOpenAddModal = () => {
    setEditingHoliday(null);
    setFormData({ name: "", date: "", type: "Government", description: "" });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      name: holiday.name,
      date: holiday.date,
      type: holiday.type,
      description: holiday.description || "",
    });
    setIsModalOpen(true);
  };

  const handleSaveHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingHoliday) {
      updateHoliday(editingHoliday.id, formData);
    } else {
      addHoliday(formData);
    }
    setIsModalOpen(false);
  };

  const handleDeleteHoliday = (id: string) => {
    if (confirm("Are you sure you want to delete this holiday?")) {
      deleteHoliday(id);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Holidays</h1>
          <p className="text-muted-foreground mt-2">
            Add, edit, or remove company and government holidays.
          </p>
        </div>
        <Button onClick={handleOpenAddModal} className="gap-2 shrink-0 shadow-md">
          <Plus className="h-4 w-4" />
          Add Holiday
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_400px]">
        <Card className="shadow-lg border-primary/10 flex flex-col order-2 md:order-1">
          <CardHeader className="bg-muted/50 pb-4">
            <CardTitle className="text-xl">Holiday List</CardTitle>
            <CardDescription>All configured holidays.</CardDescription>
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
                    <TableHead>Holiday</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                          <TableCell>
                            <div className="font-medium">{holiday.name}</div>
                            {holiday.description && (
                              <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {holiday.description}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="whitespace-nowrap">
                              {format(dateObj, "MMM dd, yyyy")}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(dateObj, "EEEE")}
                            </div>
                          </TableCell>
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
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEditModal(holiday)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteHoliday(holiday.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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

        <Card className="shadow-lg border-primary/10 h-fit order-1 md:order-2 sticky top-6">
          <CardHeader className="bg-muted/50 pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <div className="p-4 admin-holiday-calendar min-w-[300px]">
              <FullCalendar
                plugins={[dayGridPlugin]}
                initialView="dayGridMonth"
                events={calendarEvents}
                headerToolbar={{
                  left: "prev",
                  center: "title",
                  right: "next",
                }}
                height="auto"
                eventDisplay="block"
                eventClick={(info) => {
                  const clickedHoliday = holidays.find((h) => h.id === info.event.id);
                  if (clickedHoliday) handleOpenEditModal(clickedHoliday);
                }}
                eventDidMount={(arg) => {
                  arg.el.title = `${arg.event.title} (${arg.event.extendedProps.type})`;
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSaveHoliday}>
            <DialogHeader>
              <DialogTitle>{editingHoliday ? "Edit Holiday" : "Add New Holiday"}</DialogTitle>
              <DialogDescription>
                {editingHoliday
                  ? "Update the details of the holiday."
                  : "Fill in the details to add a new holiday to the calendar."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Holiday Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. New Year's Day"
                  required
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(val) => setFormData({ ...formData, type: val as HolidayType })}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Government">Government</SelectItem>
                      <SelectItem value="Company">Company</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add any additional details..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingHoliday ? "Save Changes" : "Add Holiday"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <style>{`
        .admin-holiday-calendar .fc {
          --fc-border-color: hsl(var(--border));
          --fc-button-bg-color: transparent;
          --fc-button-border-color: transparent;
          --fc-button-hover-bg-color: hsl(var(--muted));
          --fc-button-hover-border-color: transparent;
          --fc-button-active-bg-color: hsl(var(--muted));
          --fc-button-active-border-color: transparent;
          --fc-text-muted-color: hsl(var(--muted-foreground));
          --fc-page-bg-color: transparent;
          font-family: inherit;
        }
        .admin-holiday-calendar .fc .fc-button-primary {
          color: hsl(var(--foreground));
        }
        .admin-holiday-calendar .fc .fc-toolbar-title {
          font-size: 1.125rem;
          font-weight: 600;
        }
        .admin-holiday-calendar .fc .fc-col-header-cell {
          padding: 8px 0;
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
        }
        .admin-holiday-calendar .fc .fc-daygrid-day {
          background-color: hsl(var(--background));
        }
        .admin-holiday-calendar .fc .fc-daygrid-day.fc-day-other {
          background-color: hsl(var(--muted) / 0.5);
        }
        .admin-holiday-calendar .fc .fc-event {
          padding: 2px 4px;
          cursor: pointer;
          border-radius: 4px;
          margin: 1px 2px;
          transition: transform 0.2s, opacity 0.2s;
        }
        .admin-holiday-calendar .fc .fc-event:hover {
          transform: scale(1.02);
          opacity: 0.9;
        }
        .admin-holiday-calendar .fc .fc-event-title {
          font-size: 0.7rem;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </div>
  );
}
