import { useEffect, useState } from "react";
import {
  ApprovalRequest,
  fetchPendingApprovals,
  approveRequest,
  rejectRequest,
} from "@/lib/approvalService";
import { ApprovalCard } from "./ApprovalCard";
import { toast } from "sonner";
import { Clock } from "lucide-react";

export function PendingApprovalList({ onActionComplete }: { onActionComplete: () => void }) {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await fetchPendingApprovals();
      setRequests(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load pending approvals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await approveRequest(id);
      toast.success("Request Approved Successfully");
      setRequests(requests.filter((r) => r._id !== id));
      onActionComplete();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve request");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectRequest(id);
      toast.success("Request Rejected Successfully");
      setRequests(requests.filter((r) => r._id !== id));
      onActionComplete();
    } catch (error: any) {
      toast.error(error.message || "Failed to reject request");
    }
  };

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
        <Clock className="h-10 w-10 mb-4 opacity-30" />
        <p>No pending approvals at the moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((req) => (
        <ApprovalCard
          key={req._id}
          request={req}
          isPending={true}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      ))}
    </div>
  );
}
