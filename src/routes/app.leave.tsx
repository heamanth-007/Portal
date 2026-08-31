import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "./app.dashboard";
import { toast } from "sonner";

export const Route = createFileRoute("/app/leave")({
  component: LeavePage,
});

function LeavePage() {
  const { currentUser, state, applyLeave } = useStore();
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [reason, setReason] = useState("");

  if (!currentUser) return <Navigate to="/login" />;
  if (currentUser.role === "admin") return <Navigate to="/app/admin/approvals" />;

  const myLeaves = state.leaves
    .filter((l) => l.userId === currentUser.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Please add a reason");
      return;
    }
    await applyLeave({ userId: currentUser.id, fromDate: from, toDate: to, reason: reason.trim() });
    setReason("");
    toast.success("Leave request submitted");
  };

  return (
    <div className="p-6 sm:p-8 max-w-5xl">
      <PageHeader
        title="Leave"
        description={`You have ${currentUser.leaveBalance} leave days available.`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Apply for leave</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="from">From</Label>
                  <Input
                    id="from"
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="to">To</Label>
                  <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  rows={4}
                  placeholder="Why do you need this leave?"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                Submit request
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">My requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myLeaves.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No leave requests yet.
                    </TableCell>
                  </TableRow>
                )}
                {myLeaves.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.fromDate}</TableCell>
                    <TableCell>{l.toDate}</TableCell>
                    <TableCell className="max-w-[220px] truncate">{l.reason}</TableCell>
                    <TableCell className="text-right">
                      <StatusBadge status={l.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
