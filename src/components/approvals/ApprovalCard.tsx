import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { ApprovalRequest } from "@/lib/approvalService";
import { StatusBadge } from "@/routes/app.dashboard";

interface ApprovalCardProps {
  request: ApprovalRequest;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  isPending: boolean;
}

export function ApprovalCard({ request, onApprove, onReject, isPending }: ApprovalCardProps) {
  const empName = request.employeeId?.name || "Unknown";
  const empDesignation = request.employeeId?.designation || "Employee";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/30 transition-colors shadow-sm gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
            {empName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 className="text-sm font-semibold">{empName}</h4>
            <p className="text-xs text-muted-foreground">{empDesignation}</p>
          </div>
          <div className="ml-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
              LEAVE
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">From Date</p>
            <p className="text-sm font-medium">{new Date(request.fromDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">To Date</p>
            <p className="text-sm font-medium">{new Date(request.toDate).toLocaleDateString()}</p>
          </div>
          <div className="col-span-2 sm:col-span-2">
            <p className="text-xs text-muted-foreground mb-1">Reason</p>
            <p className="text-sm truncate" title={request.reason}>
              {request.reason || "N/A"}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          {isPending ? (
            <span>Applied: {new Date(request.appliedDate).toLocaleDateString()}</span>
          ) : (
            <>
              {request.status === "REJECTED" ? (
                <>
                  <span>
                    Rejected:{" "}
                    {request.approvedDate
                      ? new Date(request.approvedDate).toLocaleDateString()
                      : "N/A"}
                  </span>
                  <span>By: {request.approvedBy?.name || "Admin"}</span>
                </>
              ) : (
                <>
                  <span>
                    Approved:{" "}
                    {request.approvedDate
                      ? new Date(request.approvedDate).toLocaleDateString()
                      : "N/A"}
                  </span>
                  <span>By: {request.approvedBy?.name || "Admin"}</span>
                </>
              )}
              <StatusBadge status={request.status.toLowerCase() as any} />
            </>
          )}
        </div>
      </div>

      {isPending && onApprove && onReject && (
        <div className="flex sm:flex-col gap-2 mt-2 sm:mt-0 border-t sm:border-t-0 sm:border-l pt-3 sm:pt-0 sm:pl-4">
          <Button
            size="sm"
            variant="outline"
            className="w-full sm:w-auto border-success/40 text-success hover:bg-success/10 bg-success/5"
            onClick={() => onApprove(request._id)}
          >
            <Check className="h-4 w-4 mr-1" /> Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-full sm:w-auto border-destructive/40 text-destructive hover:bg-destructive/10 bg-destructive/5"
            onClick={() => onReject(request._id)}
          >
            <X className="h-4 w-4 mr-1" /> Reject
          </Button>
        </div>
      )}
    </div>
  );
}
