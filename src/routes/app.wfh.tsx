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

export const Route = createFileRoute("/app/wfh")({
  component: WfhPage,
});

function WfhPage() {
  const { currentUser, state, applyWfh } = useStore();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [reason, setReason] = useState("");

  if (!currentUser) return <Navigate to="/login" />;
  if (currentUser.role === "admin") return <Navigate to="/app/admin/approvals" />;

  const myWfh = state.wfh
    .filter((w) => w.userId === currentUser.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Please add a reason");
      return;
    }
    await applyWfh({ userId: currentUser.id, date, reason: reason.trim() });
    setReason("");
    toast.success("WFH request submitted");
  };

  return (
    <div className="p-6 sm:p-8 max-w-5xl">
      <PageHeader title="Work from Home" description="Request remote work days." />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">New WFH request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  rows={4}
                  placeholder="Why do you need to WFH?"
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
                  <TableHead>Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myWfh.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No WFH requests yet.
                    </TableCell>
                  </TableRow>
                )}
                {myWfh.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.date}</TableCell>
                    <TableCell className="max-w-[280px] truncate">{w.reason}</TableCell>
                    <TableCell className="text-right">
                      <StatusBadge status={w.status} />
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
