export interface KPIInput {
  totalUptimeHours: number;
  correctiveWOCount: number;
  totalRepairMinutes: number;
  holdMinutes: number;
}

export interface KPIResult {
  mtbf: number;
  mttr: number;
  availability: number;
  downtimeHours: number;
}

export function computeKPIs(input: KPIInput): KPIResult {
  const { totalUptimeHours, correctiveWOCount, totalRepairMinutes, holdMinutes } = input;

  // Net repair time excludes hold time (waiting for parts/approval, not actual work)
  const repairHours = (totalRepairMinutes - holdMinutes) / 60;

  // MTBF = Total uptime / Number of failures (corrective WOs)
  // Higher is better — measures how long the equipment runs between breakdowns
  const mtbf = correctiveWOCount > 0 ? totalUptimeHours / correctiveWOCount : 0;

  // MTTR = Total net repair hours / Number of failures
  // Lower is better — measures how quickly the team restores equipment
  const mttr = correctiveWOCount > 0 ? repairHours / correctiveWOCount : 0;

  // Availability = MTBF / (MTBF + MTTR) × 100%
  // Represents the fraction of planned time the equipment is actually operational
  const availability = mtbf + mttr > 0 ? (mtbf / (mtbf + mttr)) * 100 : 100;

  const downtimeHours = repairHours;

  return {
    mtbf: Math.round(mtbf * 10) / 10,
    mttr: Math.round(mttr * 10) / 10,
    availability: Math.round(availability * 10) / 10,
    downtimeHours: Math.round(downtimeHours * 10) / 10,
  };
}

// PM Compliance = (WOs completed on time) / (total planned WOs) × 100%
// "On time" = WO closed before or on the nextDueDate of its originating PM plan
export function computePMCompliance(
  plannedCount: number,
  completedOnTimeCount: number
): number {
  if (plannedCount === 0) return 100;
  return Math.round((completedOnTimeCount / plannedCount) * 100 * 10) / 10;
}
