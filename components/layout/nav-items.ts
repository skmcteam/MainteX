import {
  LayoutDashboard,
  ClipboardList,
  CalendarClock,
  Gauge,
  Cpu,
  Package,
  BarChart3,
  Settings,
  Factory,
  Layers,
  Monitor,
  Thermometer,
  ScanLine,
  User,
} from "lucide-react";

export const mainNav = [
  {
    key: "dashboard",
    href: "/",
    icon: LayoutDashboard,
    labelKey: "nav.dashboard",
  },
  {
    key: "workOrders",
    href: "/work-orders",
    icon: ClipboardList,
    labelKey: "nav.workOrders",
  },
  {
    key: "pmSchedule",
    href: "/pm-schedule",
    icon: CalendarClock,
    labelKey: "nav.pmSchedule",
  },
  {
    key: "calibration",
    href: "/calibration",
    icon: Gauge,
    labelKey: "nav.calibration",
  },
];

export const assetNav = [
  {
    key: "machines",
    href: "/assets/machines",
    icon: Factory,
    labelKey: "nav.machines",
  },
  {
    key: "molds",
    href: "/assets/molds",
    icon: Layers,
    labelKey: "nav.molds",
  },
  {
    key: "it",
    href: "/assets/it",
    icon: Monitor,
    labelKey: "nav.it",
  },
  {
    key: "instruments",
    href: "/assets/instruments",
    icon: Thermometer,
    labelKey: "nav.instruments",
  },
];

export const secondaryNav = [
  {
    key: "spareParts",
    href: "/spare-parts",
    icon: Package,
    labelKey: "nav.spareParts",
  },
  {
    key: "reports",
    href: "/reports",
    icon: BarChart3,
    labelKey: "nav.reports",
  },
  {
    key: "admin",
    href: "/admin",
    icon: Settings,
    labelKey: "nav.admin",
  },
];

export const bottomNav = [
  {
    key: "dashboard",
    href: "/",
    icon: LayoutDashboard,
    labelKey: "nav.dashboard",
  },
  {
    key: "workOrders",
    href: "/work-orders",
    icon: ClipboardList,
    labelKey: "nav.workOrders",
  },
  {
    key: "pmSchedule",
    href: "/pm-schedule",
    icon: CalendarClock,
    labelKey: "nav.pmSchedule",
  },
  {
    key: "scan",
    href: "/scan",
    icon: ScanLine,
    labelKey: "nav.scan",
  },
  {
    key: "profile",
    href: "/profile",
    icon: User,
    labelKey: "nav.profile",
  },
];
