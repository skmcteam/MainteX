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

  const repairHours = (totalRepairMinutes - holdMinutes) / 60;
  const mtbf = correctiveWOCount > 0 ? totalUptimeHours / correctiveWOCount : 0;
  const mttr = correctiveWOCount > 0 ? repairHours / correctiveWOCount : 0;
  const availability = mtbf + mttr > 0 ? (mtbf / (mtbf + mttr)) * 100 : 100;
  const downtimeHours = repairHours;

  return {
    mtbf: Math.round(mtbf * 10) / 10,
    mttr: Math.round(mttr * 10) / 10,
    availability: Math.round(availability * 10) / 10,
    downtimeHours: Math.round(downtimeHours * 10) / 10,
  };
}

export function computePMCompliance(
  plannedCount: number,
  completedOnTimeCount: number
): number {
  if (plannedCount === 0) return 100;
  return Math.round((completedOnTimeCount / plannedCount) * 100 * 10) / 10;
}
