import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface BirthdayItem {
  id: string;
  name: string;
  designation?: string;
  dateOfBirth?: string;
}

interface BirthdayPanelProps {
  title: string;
  employees: BirthdayItem[];
  highlightToday?: boolean;
}

function formatBirthday(dateOfBirth?: string) {
  if (!dateOfBirth) return "—";
  return new Date(dateOfBirth).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
  });
}

export function BirthdayPanel({ title, employees, highlightToday = false }: BirthdayPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {employees.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            No upcoming birthdays.
          </div>
        ) : (
          <div className="space-y-3">
            {employees.map((employee) => {
              const isToday =
                highlightToday && employee.dateOfBirth
                  ? new Date(employee.dateOfBirth).getDate() === new Date().getDate() &&
                    new Date(employee.dateOfBirth).getMonth() === new Date().getMonth()
                  : false;

              return (
                <div
                  key={employee.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {employee.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{employee.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {employee.designation ?? "Employee"}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-semibold">
                      {formatBirthday(employee.dateOfBirth)}
                    </span>
                    {isToday && <Badge className="bg-emerald-100 text-emerald-800">Today</Badge>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
