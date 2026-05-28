import type {
  Asset,
  WorkOrder,
  User,
  Role,
  Priority,
  WOType,
  Department,
  Section,
  Area,
  AssetClass,
  SparePart,
  PMPlan,
  PMFrequency,
  ChecklistTemplate,
  Calibration,
  CalibrationLab,
  InstrumentType,
  Workflow,
  WorkflowStep,
  Notification,
  AssetStatus,
  AssetCategory,
  WOStatus,
  CalStatus,
  NotificationType,
  Criticality,
} from "@prisma/client";

export type {
  Asset,
  WorkOrder,
  User,
  Role,
  Priority,
  WOType,
  Department,
  Section,
  Area,
  AssetClass,
  SparePart,
  PMPlan,
  PMFrequency,
  ChecklistTemplate,
  Calibration,
  CalibrationLab,
  InstrumentType,
  Workflow,
  WorkflowStep,
  Notification,
  AssetStatus,
  AssetCategory,
  WOStatus,
  CalStatus,
  NotificationType,
  Criticality,
};

export type AssetWithRelations = Asset & {
  assetClass?: AssetClass | null;
  department?: Department | null;
  section?: Section | null;
  area?: Area | null;
  instrumentType?: InstrumentType | null;
  calLab?: CalibrationLab | null;
  _count?: {
    workOrders: number;
    pmPlans: number;
    calibrations: number;
  };
};

export type WorkOrderWithRelations = WorkOrder & {
  asset: Asset;
  priority: Priority;
  type: WOType;
  creator: Pick<User, "id" | "nameTh" | "nameEn" | "email">;
  assignee?: Pick<User, "id" | "nameTh" | "nameEn" | "email"> | null;
  department?: Department | null;
};

export type UserWithRole = User & {
  role: Role;
  department?: Department | null;
  section?: Section | null;
};

export type DashboardStats = {
  openWOs: number;
  urgentWOs: number;
  activeAssets: number;
  calOverdue: number;
  calDueSoon: number;
  pmCompliance: number;
  mtbf: number;
  mttr: number;
  availability: number;
  downtimeHours: number;
};

export type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  children?: NavItem[];
};

export type ThemeMode = "light" | "dark" | "system";
