/**
 * Workflow Engine — Phase 5 (stub)
 *
 * The Workflow Designer lets admins configure approval steps, but this engine
 * is not yet wired to Work Orders. Implement in Phase 5 once the approval
 * flow requirements are signed off.
 *
 * TODO Phase 5:
 *   1. On WO create: call initWorkflow(workOrderId, workflowId) to write the
 *      first WOApproval record and set WO status to PENDING_APPROVAL.
 *   2. On approve/reject/return: call advanceWorkflow(woApprovalId, action, userId)
 *      which transitions the state machine and creates the next WOApproval row.
 *   3. When the final step is approved: set WO status back to OPEN so technicians
 *      can act on it.
 *   4. Each transition fires createNotificationEvent() for the next approver.
 */

export type WorkflowAction = "APPROVE" | "REJECT" | "RETURN";

export interface WorkflowStepResult {
  nextStepIndex: number | null; // null = workflow complete
  status: "PENDING" | "APPROVED" | "REJECTED" | "RETURNED";
}

/** Stub: will initialize a workflow instance for a newly created Work Order. */
export async function initWorkflow(
  _workOrderId: string,
  _workflowId: string,
): Promise<void> {
  // TODO Phase 5: create first WOApproval record, update WO status
  throw new Error("Workflow engine not yet implemented (Phase 5)");
}

/** Stub: will advance the approval state machine by one step. */
export async function advanceWorkflow(
  _woApprovalId: string,
  _action: WorkflowAction,
  _actorId: string,
  _comment?: string,
): Promise<WorkflowStepResult> {
  // TODO Phase 5: validate actor role, write transition, notify next approver
  throw new Error("Workflow engine not yet implemented (Phase 5)");
}
