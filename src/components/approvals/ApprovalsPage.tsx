import { useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PendingApprovalList } from "./PendingApprovalList";
import { ApprovedRequestList } from "./ApprovedRequestList";

export function ApprovalsPage() {
  const [tab, setTab] = useState("pending");
  const [refreshApproved, setRefreshApproved] = useState(0);

  const handleActionComplete = () => {
    // When a request is approved, we want the Approved list to fetch the new data
    // if the user switches to it or if it's already rendered.
    setRefreshApproved((prev) => prev + 1);
  };

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Admin Approvals Management"
        description="Review and manage employee leave requests."
      />

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
          <TabsTrigger value="approved">Request History</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-0">
          <PendingApprovalList onActionComplete={handleActionComplete} />
        </TabsContent>

        <TabsContent value="approved" className="mt-0">
          <ApprovedRequestList refreshTrigger={refreshApproved} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
