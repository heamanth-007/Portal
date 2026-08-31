import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchWfhToday } from "@/lib/api";
import { Home } from "lucide-react";

interface WFHEmployee {
  employeeId: string;
  name: string;
  designation: string;
  status: string;
  checkInTime: string;
}

export function WFHEmployeesCard() {
  const [employees, setEmployees] = useState<WFHEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        const { records } = await fetchWfhToday();
        if (mounted) {
          setEmployees(records);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || "Failed to load WFH employees");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Card className="flex flex-col h-full shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Home className="h-4 w-4" />
          </div>
          <CardTitle className="text-base font-semibold">
            Today's Work From Home Employees
          </CardTitle>
        </div>
        {!loading && !error && (
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
            {employees.length}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32 text-destructive text-sm p-4 text-center">
            {error}
          </div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground p-6 text-center space-y-3">
            <Home className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm">No employees are working from home today.</p>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[300px] p-4 space-y-4 scrollbar-thin">
            {employees.map((emp) => (
              <div
                key={emp.employeeId}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    {/* Green dot indicating they checked in */}
                    {emp.checkInTime && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">{emp.name}</h4>
                    <p className="text-xs text-muted-foreground">{emp.designation || "Employee"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {emp.status}
                  </span>
                  {emp.checkInTime && (
                    <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                      In:{" "}
                      {new Date(emp.checkInTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
