import { useEffect, useState } from "react";
import { ApprovalRequest, fetchApprovedRequests } from "@/lib/approvalService";
import { ApprovalCard } from "./ApprovalCard";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

export function ApprovedRequestList({ refreshTrigger }: { refreshTrigger: number }) {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRequests = async () => {
      try {
        setLoading(true);
        const data = await fetchApprovedRequests();
        setRequests(data);
      } catch (error: any) {
        toast.error(error.message || "Failed to load approved requests");
      } finally {
        setLoading(false);
      }
    };
    loadRequests();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-card rounded-xl border">
        <CheckCircle2 className="h-10 w-10 mb-4 opacity-30" />
        <p>No requests found in history.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((req) => (
        <ApprovalCard key={req._id} request={req} isPending={false} />
      ))}
    </div>
  );
}
