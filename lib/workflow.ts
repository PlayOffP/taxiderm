import { JobRow } from '@/types/database';

export type WorkflowStage = {
  id: string;
  label: string;
  description: string;
  color: string;
  order: number;
};

export const PROCESSING_WORKFLOW: WorkflowStage[] = [
  { id: 'received', label: 'Received', description: 'Animal dropped off', color: '#6B7280', order: 1 },
  { id: 'in_cooler', label: 'In Cooler', description: 'Hanging in cooler', color: '#3B82F6', order: 2 },
  { id: 'hide_removed', label: 'Hide Removed', description: 'Hide has been removed', color: '#8B5CF6', order: 3 },
  { id: 'cut_and_bagged', label: 'Cut & Bagged', description: 'Meat processed and bagged', color: '#F59E0B', order: 4 },
  { id: 'freezer', label: 'In Freezer', description: 'Ready in freezer', color: '#0EA5E9', order: 5 },
  { id: 'ready', label: 'Ready for Pickup', description: 'Customer can pick up', color: '#10B981', order: 6 },
  { id: 'picked_up', label: 'Picked Up', description: 'Customer collected', color: '#059669', order: 7 },
  { id: 'paid', label: 'Paid', description: 'Final payment complete', color: '#059669', order: 8 },
];

export const TAXIDERMY_WORKFLOW: WorkflowStage[] = [
  { id: 'prep', label: 'Prep', description: 'Initial preparation', color: '#6B7280', order: 1 },
  { id: 'mounting', label: 'Mounting', description: 'Mounting process', color: '#3B82F6', order: 2 },
  { id: 'painting', label: 'Painting', description: 'Detail painting', color: '#8B5CF6', order: 3 },
  { id: 'drying', label: 'Drying', description: 'Drying period', color: '#F59E0B', order: 4 },
  { id: 'finishing', label: 'Finishing', description: 'Final touches', color: '#0EA5E9', order: 5 },
  { id: 'qa', label: 'Quality Check', description: 'Final inspection', color: '#10B981', order: 6 },
];

export function getWorkflowStage(status: string): WorkflowStage | undefined {
  return PROCESSING_WORKFLOW.find(stage => stage.id === status);
}

export function getTaxidermyStage(stage: string | null): WorkflowStage | undefined {
  if (!stage) return undefined;
  return TAXIDERMY_WORKFLOW.find(s => s.id === stage);
}

export function getNextProcessingStage(currentStatus: string): string | null {
  const currentStage = PROCESSING_WORKFLOW.find(s => s.id === currentStatus);
  if (!currentStage) return null;

  const nextStage = PROCESSING_WORKFLOW.find(s => s.order === currentStage.order + 1);
  return nextStage ? nextStage.id : null;
}

export function getNextTaxidermyStage(currentStage: string | null): string | null {
  if (!currentStage) return 'prep';

  const current = TAXIDERMY_WORKFLOW.find(s => s.id === currentStage);
  if (!current) return null;

  const next = TAXIDERMY_WORKFLOW.find(s => s.order === current.order + 1);
  return next ? next.id : null;
}

export function formatStatus(status: string): string {
  return status.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

export function getWorkflowProgress(job: JobRow): number {
  if (job.mount_requested && job.taxidermy_stage) {
    const stage = TAXIDERMY_WORKFLOW.find(s => s.id === job.taxidermy_stage);
    if (stage) {
      return (stage.order / TAXIDERMY_WORKFLOW.length) * 100;
    }
  }

  const stage = PROCESSING_WORKFLOW.find(s => s.id === job.status);
  if (stage) {
    return (stage.order / PROCESSING_WORKFLOW.length) * 100;
  }

  return 0;
}

export function requiresDeposit(job: JobRow): boolean {
  return !job.deposit_paid;
}

export function canProceedToProcessing(job: JobRow): boolean {
  return job.deposit_paid;
}
