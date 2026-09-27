export type Attention =
  | "OVERDUE"
  | "DUE"
  | "AWAITING_CONTACT"
  | "ON_TRACK";

const DAY = 86400000;

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getAttentionStatus(p: {
  assignedWorkerId: string | null;
  nextFollowUpAt: Date | null;
  followUpCount: number;
}): Attention {
  if (!p.assignedWorkerId || p.followUpCount === 0) return "AWAITING_CONTACT";
  if (!p.nextFollowUpAt) return "ON_TRACK";
  const next = new Date(p.nextFollowUpAt).getTime();
  const today = startOfToday().getTime();
  if (next < today) return "OVERDUE";
  if (next < today + DAY) return "DUE";
  return "ON_TRACK";
}

export const ATTENTION_LABEL: Record<Attention, string> = {
  OVERDUE: "Overdue",
  DUE: "Due today",
  AWAITING_CONTACT: "Awaiting first contact",
  ON_TRACK: "On track",
};
