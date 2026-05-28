import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding SKMC CMMS database...");

  // ─── Plant & Organization ─────────────────────────────────
  const plant = await prisma.plant.upsert({
    where: { code: "SKMC" },
    update: {},
    create: { code: "SKMC", nameTh: "โรงงาน SKMC", nameEn: "SKMC Factory" },
  });

  const depts = await Promise.all([
    prisma.department.upsert({
      where: { code: "MAINT" },
      update: {},
      create: { code: "MAINT", nameTh: "แผนกซ่อมบำรุง", nameEn: "Maintenance", plantId: plant.id },
    }),
    prisma.department.upsert({
      where: { code: "PROD" },
      update: {},
      create: { code: "PROD", nameTh: "แผนกผลิต", nameEn: "Production", plantId: plant.id },
    }),
    prisma.department.upsert({
      where: { code: "QA" },
      update: {},
      create: { code: "QA", nameTh: "แผนกควบคุมคุณภาพ", nameEn: "Quality Assurance", plantId: plant.id },
    }),
    prisma.department.upsert({
      where: { code: "IT" },
      update: {},
      create: { code: "IT", nameTh: "แผนกไอที", nameEn: "IT Department", plantId: plant.id },
    }),
  ]);
  const [maintDept, prodDept, qaDept, itDept] = depts;

  const sections = await Promise.all([
    prisma.section.upsert({
      where: { code: "MAINT-ELEC" },
      update: {},
      create: { code: "MAINT-ELEC", nameTh: "ซ่อมบำรุงไฟฟ้า", nameEn: "Electrical Maintenance", departmentId: maintDept.id },
    }),
    prisma.section.upsert({
      where: { code: "MAINT-MECH" },
      update: {},
      create: { code: "MAINT-MECH", nameTh: "ซ่อมบำรุงเครื่องกล", nameEn: "Mechanical Maintenance", departmentId: maintDept.id },
    }),
    prisma.section.upsert({
      where: { code: "PROD-MOLD" },
      update: {},
      create: { code: "PROD-MOLD", nameTh: "ส่วนแม่พิมพ์", nameEn: "Molding Section", departmentId: prodDept.id },
    }),
  ]);

  const areas = await Promise.all([
    prisma.area.upsert({ where: { code: "MOLD-LINE-A" }, update: {}, create: { code: "MOLD-LINE-A", nameTh: "สายการผลิต A", nameEn: "Molding Line A" } }),
    prisma.area.upsert({ where: { code: "MOLD-LINE-B" }, update: {}, create: { code: "MOLD-LINE-B", nameTh: "สายการผลิต B", nameEn: "Molding Line B" } }),
    prisma.area.upsert({ where: { code: "TRIM-ROOM" }, update: {}, create: { code: "TRIM-ROOM", nameTh: "ห้องตัดแต่ง", nameEn: "Trimming Room" } }),
    prisma.area.upsert({ where: { code: "TOOL-ROOM" }, update: {}, create: { code: "TOOL-ROOM", nameTh: "ห้องเครื่องมือ", nameEn: "Tool Room" } }),
    prisma.area.upsert({ where: { code: "SERVER-ROOM" }, update: {}, create: { code: "SERVER-ROOM", nameTh: "ห้องเซิร์ฟเวอร์", nameEn: "Server Room" } }),
  ]);
  const [areaA, areaB, trimRoom, toolRoom, serverRoom] = areas;

  // ─── Roles ────────────────────────────────────────────────
  const roles = await Promise.all([
    prisma.role.upsert({ where: { code: "SYSTEM_ADMIN" }, update: {}, create: { code: "SYSTEM_ADMIN", nameTh: "ผู้ดูแลระบบ", nameEn: "System Admin", isSystem: true } }),
    prisma.role.upsert({ where: { code: "MAINTENANCE_MANAGER" }, update: {}, create: { code: "MAINTENANCE_MANAGER", nameTh: "ผู้จัดการซ่อมบำรุง", nameEn: "Maintenance Manager", isSystem: true } }),
    prisma.role.upsert({ where: { code: "MAINTENANCE_SUPERVISOR" }, update: {}, create: { code: "MAINTENANCE_SUPERVISOR", nameTh: "หัวหน้าซ่อมบำรุง", nameEn: "Maintenance Supervisor", isSystem: true } }),
    prisma.role.upsert({ where: { code: "DEPT_TECHNICIAN" }, update: {}, create: { code: "DEPT_TECHNICIAN", nameTh: "ช่างซ่อมบำรุง", nameEn: "Technician", isSystem: true } }),
    prisma.role.upsert({ where: { code: "DEPT_SUPERVISOR" }, update: {}, create: { code: "DEPT_SUPERVISOR", nameTh: "หัวหน้าแผนก", nameEn: "Department Supervisor", isSystem: true } }),
    prisma.role.upsert({ where: { code: "DEPT_REQUESTER" }, update: {}, create: { code: "DEPT_REQUESTER", nameTh: "ผู้แจ้งซ่อม", nameEn: "Requester", isSystem: true } }),
    prisma.role.upsert({ where: { code: "READONLY" }, update: {}, create: { code: "READONLY", nameTh: "ดูอย่างเดียว", nameEn: "Read Only", isSystem: false } }),
  ]);
  const [adminRole, managerRole, supervisorRole, techRole] = roles;

  // ─── Users ────────────────────────────────────────────────
  const pw = await bcrypt.hash("skmc1234", 10);
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@skmc.co.th" },
      update: {},
      create: { email: "admin@skmc.co.th", passwordHash: pw, nameTh: "ผู้ดูแลระบบ", nameEn: "System Admin", roleId: adminRole.id, departmentId: maintDept.id },
    }),
    prisma.user.upsert({
      where: { email: "manager@skmc.co.th" },
      update: {},
      create: { email: "manager@skmc.co.th", passwordHash: pw, nameTh: "สมชาย ใจดี", nameEn: "Somchai Jaidee", roleId: managerRole.id, departmentId: maintDept.id },
    }),
    prisma.user.upsert({
      where: { email: "supervisor@skmc.co.th" },
      update: {},
      create: { email: "supervisor@skmc.co.th", passwordHash: pw, nameTh: "วิชัย แสงทอง", nameEn: "Wichai Sangtong", roleId: supervisorRole.id, departmentId: maintDept.id, sectionId: sections[1].id },
    }),
    prisma.user.upsert({
      where: { email: "tech1@skmc.co.th" },
      update: {},
      create: { email: "tech1@skmc.co.th", passwordHash: pw, nameTh: "อนันต์ พรมมา", nameEn: "Anan Prommaa", roleId: techRole.id, departmentId: maintDept.id, sectionId: sections[1].id },
    }),
    prisma.user.upsert({
      where: { email: "tech2@skmc.co.th" },
      update: {},
      create: { email: "tech2@skmc.co.th", passwordHash: pw, nameTh: "ประสิทธิ์ บุญมา", nameEn: "Prasit Boonma", roleId: techRole.id, departmentId: maintDept.id, sectionId: sections[0].id },
    }),
  ]);
  const [adminUser, , , techUser1, techUser2] = users;

  // ─── Asset Classes ────────────────────────────────────────
  const assetClasses = await Promise.all([
    prisma.assetClass.upsert({ where: { code: "PRESS" }, update: {}, create: { code: "PRESS", nameTh: "เครื่องอัด (Press)", nameEn: "Press Machine", category: "MACHINE", criticality: "A", color: "#1B6FE8" } }),
    prisma.assetClass.upsert({ where: { code: "ROBOT" }, update: {}, create: { code: "ROBOT", nameTh: "หุ่นยนต์ (Robot)", nameEn: "Robot", category: "MACHINE", criticality: "A", color: "#6340C8" } }),
    prisma.assetClass.upsert({ where: { code: "CONVEYOR" }, update: {}, create: { code: "CONVEYOR", nameTh: "สายพาน (Conveyor)", nameEn: "Conveyor", category: "MACHINE", criticality: "B", color: "#0A7FA0" } }),
    prisma.assetClass.upsert({ where: { code: "COMPRESSOR" }, update: {}, create: { code: "COMPRESSOR", nameTh: "คอมเพรสเซอร์", nameEn: "Compressor", category: "MACHINE", criticality: "A", color: "#B97B00" } }),
    prisma.assetClass.upsert({ where: { code: "COMP-MOLD" }, update: {}, create: { code: "COMP-MOLD", nameTh: "แม่พิมพ์อัด", nameEn: "Compression Mold", category: "MOLD", criticality: "A", color: "#C03030" } }),
    prisma.assetClass.upsert({ where: { code: "INJ-MOLD" }, update: {}, create: { code: "INJ-MOLD", nameTh: "แม่พิมพ์ฉีด", nameEn: "Injection Mold", category: "MOLD", criticality: "B", color: "#E8A020" } }),
    prisma.assetClass.upsert({ where: { code: "SERVER" }, update: {}, create: { code: "SERVER", nameTh: "เซิร์ฟเวอร์", nameEn: "Server", category: "IT", criticality: "A", color: "#6340C8" } }),
    prisma.assetClass.upsert({ where: { code: "WORKSTATION" }, update: {}, create: { code: "WORKSTATION", nameTh: "คอมพิวเตอร์", nameEn: "Workstation", category: "IT", criticality: "B", color: "#0A7FA0" } }),
  ]);
  const [pressClass, , , , compMoldClass, injMoldClass, serverClass, wsClass] = assetClasses;

  // ─── Instrument Types & Cal Labs ─────────────────────────
  const instrTypes = await Promise.all([
    prisma.instrumentType.upsert({ where: { code: "PRESSURE-GAUGE" }, update: {}, create: { code: "PRESSURE-GAUGE", nameTh: "เกจวัดแรงดัน", nameEn: "Pressure Gauge" } }),
    prisma.instrumentType.upsert({ where: { code: "LOAD-CELL" }, update: {}, create: { code: "LOAD-CELL", nameTh: "โหลดเซลล์", nameEn: "Load Cell" } }),
    prisma.instrumentType.upsert({ where: { code: "THERMOCOUPLE" }, update: {}, create: { code: "THERMOCOUPLE", nameTh: "เทอร์โมคัปเปิล", nameEn: "Thermocouple" } }),
    prisma.instrumentType.upsert({ where: { code: "CALIPER" }, update: {}, create: { code: "CALIPER", nameTh: "เวอร์เนียร์คาลิเปอร์", nameEn: "Vernier Caliper" } }),
    prisma.instrumentType.upsert({ where: { code: "MICROMETER" }, update: {}, create: { code: "MICROMETER", nameTh: "ไมโครมิเตอร์", nameEn: "Micrometer" } }),
  ]);
  const [pgType, lcType, tcType, calType, micType] = instrTypes;

  const calLabs = await Promise.all([
    prisma.calibrationLab.upsert({ where: { code: "SP-METRO" }, update: {}, create: { code: "SP-METRO", nameTh: "SP Metrology", nameEn: "SP Metrology", accreditNo: "T-0123", phone: "02-xxx-xxxx" } }),
    prisma.calibrationLab.upsert({ where: { code: "PCAL" }, update: {}, create: { code: "PCAL", nameTh: "PCaL", nameEn: "PCaL Co., Ltd.", accreditNo: "T-0456", phone: "02-xxx-xxxx" } }),
    prisma.calibrationLab.upsert({ where: { code: "KAWATA" }, update: {}, create: { code: "KAWATA", nameTh: "KAWATA", nameEn: "Kawata Calibration", accreditNo: "T-0789", phone: "02-xxx-xxxx" } }),
    prisma.calibrationLab.upsert({ where: { code: "GOSHU" }, update: {}, create: { code: "GOSHU", nameTh: "Goshu", nameEn: "Goshu Instruments", accreditNo: "T-0321", phone: "02-xxx-xxxx" } }),
  ]);
  const [spLab, pcalLab] = calLabs;

  // ─── WO Priorities ────────────────────────────────────────
  const priorities = await Promise.all([
    prisma.priority.upsert({ where: { code: "URGENT" }, update: {}, create: { code: "URGENT", nameTh: "เร่งด่วน", nameEn: "Urgent", color: "#C03030", slaHours: 2, sortOrder: 1 } }),
    prisma.priority.upsert({ where: { code: "HIGH" }, update: {}, create: { code: "HIGH", nameTh: "สูง", nameEn: "High", color: "#C05800", slaHours: 8, sortOrder: 2 } }),
    prisma.priority.upsert({ where: { code: "MEDIUM" }, update: {}, create: { code: "MEDIUM", nameTh: "ปานกลาง", nameEn: "Medium", color: "#B97B00", slaHours: 24, sortOrder: 3 } }),
    prisma.priority.upsert({ where: { code: "LOW" }, update: {}, create: { code: "LOW", nameTh: "ต่ำ", nameEn: "Low", color: "#64748B", slaHours: 72, sortOrder: 4 } }),
  ]);
  const [urgentPri, highPri, medPri, lowPri] = priorities;

  // ─── WO Number Series ─────────────────────────────────────
  await prisma.wONumberSeries.upsert({
    where: { pattern: "WO-{YY}{MM}-{####}" },
    update: {},
    create: { pattern: "WO-{YY}{MM}-{####}", lastNumber: 0 },
  });

  // ─── Default Workflow (6 steps) ───────────────────────────
  const workflow = await prisma.workflow.upsert({
    where: { code: "DEFAULT-6STEP" },
    update: {},
    create: {
      code: "DEFAULT-6STEP",
      nameTh: "Workflow มาตรฐาน 6 ขั้นตอน",
      nameEn: "Default 6-Step Workflow",
      isDefault: true,
      isActive: true,
      steps: {
        create: [
          { stepNumber: 1, nameTh: "ออกใบสั่งซ่อม", nameEn: "Issue WO", roleCode: "DEPT_TECHNICIAN", allowedActions: ["approve"], slaHours: 1 },
          { stepNumber: 2, nameTh: "อนุมัติหัวหน้าแผนก", nameEn: "Dept. Approval", roleCode: "DEPT_SUPERVISOR", allowedActions: ["approve", "reject", "return"], slaHours: 4 },
          { stepNumber: 3, nameTh: "ตรวจสอบซ่อมบำรุง", nameEn: "Maintenance Review", roleCode: "MAINTENANCE_SUPERVISOR", allowedActions: ["approve", "reject", "return"], slaHours: 4 },
          { stepNumber: 4, nameTh: "มอบหมายงาน", nameEn: "Assignment", roleCode: "MAINTENANCE_SUPERVISOR", allowedActions: ["approve"], slaHours: 2 },
          { stepNumber: 5, nameTh: "อนุมัติปิดงาน", nameEn: "Manager Closure", roleCode: "MAINTENANCE_MANAGER", allowedActions: ["approve", "reject"], slaHours: 8 },
          { stepNumber: 6, nameTh: "ประเมินผล", nameEn: "Assessment", roleCode: "DEPT_SUPERVISOR", allowedActions: ["approve"], slaHours: 24 },
        ],
      },
    },
  });

  // ─── WO Types ─────────────────────────────────────────────
  const woTypes = await Promise.all([
    prisma.wOType.upsert({ where: { code: "CM" }, update: {}, create: { code: "CM", nameTh: "ซ่อมแซม (CM)", nameEn: "Corrective Maintenance", color: "#C03030", sortOrder: 1, defaultWorkflowId: workflow.id } }),
    prisma.wOType.upsert({ where: { code: "PM" }, update: {}, create: { code: "PM", nameTh: "บำรุงรักษาตามแผน (PM)", nameEn: "Preventive Maintenance", color: "#0D9062", sortOrder: 2, defaultWorkflowId: workflow.id } }),
    prisma.wOType.upsert({ where: { code: "CALIBRATION" }, update: {}, create: { code: "CALIBRATION", nameTh: "สอบเทียบ", nameEn: "Calibration", color: "#1B6FE8", sortOrder: 3 } }),
    prisma.wOType.upsert({ where: { code: "INSPECTION" }, update: {}, create: { code: "INSPECTION", nameTh: "ตรวจสอบ", nameEn: "Inspection", color: "#0A7FA0", sortOrder: 4 } }),
    prisma.wOType.upsert({ where: { code: "IMPROVEMENT" }, update: {}, create: { code: "IMPROVEMENT", nameTh: "ปรับปรุง", nameEn: "Improvement", color: "#6340C8", sortOrder: 5 } }),
  ]);
  const [cmType, pmType, calType2] = woTypes;

  // ─── Standard Codes ───────────────────────────────────────
  const failureCodes = await Promise.all([
    prisma.failureCode.upsert({ where: { code: "F-EL-01" }, update: {}, create: { code: "F-EL-01", nameTh: "ไฟฟ้าขัดข้อง", nameEn: "Electrical Failure" } }),
    prisma.failureCode.upsert({ where: { code: "F-ME-01" }, update: {}, create: { code: "F-ME-01", nameTh: "เครื่องกลขัดข้อง", nameEn: "Mechanical Failure" } }),
    prisma.failureCode.upsert({ where: { code: "F-HY-01" }, update: {}, create: { code: "F-HY-01", nameTh: "ระบบไฮดรอลิกขัดข้อง", nameEn: "Hydraulic Failure" } }),
    prisma.failureCode.upsert({ where: { code: "F-PU-01" }, update: {}, create: { code: "F-PU-01", nameTh: "ปั๊มขัดข้อง", nameEn: "Pump Failure" } }),
    prisma.failureCode.upsert({ where: { code: "F-SE-01" }, update: {}, create: { code: "F-SE-01", nameTh: "เซ็นเซอร์ขัดข้อง", nameEn: "Sensor Failure" } }),
  ]);

  const causeCodes = await Promise.all([
    prisma.causeCode.upsert({ where: { code: "C-WR-01" }, update: {}, create: { code: "C-WR-01", nameTh: "การสึกหรอ", nameEn: "Normal Wear" } }),
    prisma.causeCode.upsert({ where: { code: "C-CF-01" }, update: {}, create: { code: "C-CF-01", nameTh: "ขาดการบำรุงรักษา", nameEn: "Lack of Maintenance" } }),
    prisma.causeCode.upsert({ where: { code: "C-MI-01" }, update: {}, create: { code: "C-MI-01", nameTh: "ความผิดพลาดของผู้ปฏิบัติงาน", nameEn: "Operator Error" } }),
    prisma.causeCode.upsert({ where: { code: "C-MF-01" }, update: {}, create: { code: "C-MF-01", nameTh: "ชิ้นส่วนชำรุด", nameEn: "Manufacturing Defect" } }),
  ]);

  const actionCodes = await Promise.all([
    prisma.actionCode.upsert({ where: { code: "A-RP-01" }, update: {}, create: { code: "A-RP-01", nameTh: "ซ่อมแซม", nameEn: "Repaired" } }),
    prisma.actionCode.upsert({ where: { code: "A-RE-01" }, update: {}, create: { code: "A-RE-01", nameTh: "เปลี่ยนชิ้นส่วน", nameEn: "Part Replaced" } }),
    prisma.actionCode.upsert({ where: { code: "A-LU-01" }, update: {}, create: { code: "A-LU-01", nameTh: "หล่อลื่น", nameEn: "Lubricated" } }),
    prisma.actionCode.upsert({ where: { code: "A-CL-01" }, update: {}, create: { code: "A-CL-01", nameTh: "ทำความสะอาด", nameEn: "Cleaned" } }),
  ]);

  // ─── PM Frequencies ───────────────────────────────────────
  const pmFreqs = await Promise.all([
    prisma.pMFrequency.upsert({ where: { code: "M" }, update: {}, create: { code: "M", nameTh: "ทุกเดือน", nameEn: "Monthly", intervalDays: 30 } }),
    prisma.pMFrequency.upsert({ where: { code: "3M" }, update: {}, create: { code: "3M", nameTh: "ทุก 3 เดือน", nameEn: "Every 3 Months", intervalDays: 90 } }),
    prisma.pMFrequency.upsert({ where: { code: "6M" }, update: {}, create: { code: "6M", nameTh: "ทุก 6 เดือน", nameEn: "Every 6 Months", intervalDays: 180 } }),
    prisma.pMFrequency.upsert({ where: { code: "1Y" }, update: {}, create: { code: "1Y", nameTh: "ทุกปี", nameEn: "Yearly", intervalDays: 365 } }),
    prisma.pMFrequency.upsert({ where: { code: "50K-SHOTS" }, update: {}, create: { code: "50K-SHOTS", nameTh: "ทุก 50,000 ช็อต", nameEn: "Every 50,000 Shots", usageBased: true, usageUnit: "shots", usageInterval: 50000 } }),
  ]);
  const [mFreq, q3Freq, q6Freq, yFreq] = pmFreqs;

  // ─── Checklist Categories ─────────────────────────────────
  const checkCats = await Promise.all([
    prisma.checklistCategory.upsert({ where: { code: "SAFETY" }, update: {}, create: { code: "SAFETY", nameTh: "ความปลอดภัย", nameEn: "Safety", color: "#C03030" } }),
    prisma.checklistCategory.upsert({ where: { code: "MECHANICAL" }, update: {}, create: { code: "MECHANICAL", nameTh: "เครื่องกล", nameEn: "Mechanical", color: "#B97B00" } }),
    prisma.checklistCategory.upsert({ where: { code: "ELECTRICAL" }, update: {}, create: { code: "ELECTRICAL", nameTh: "ไฟฟ้า", nameEn: "Electrical", color: "#1B6FE8" } }),
    prisma.checklistCategory.upsert({ where: { code: "HYDRAULIC" }, update: {}, create: { code: "HYDRAULIC", nameTh: "ไฮดรอลิก", nameEn: "Hydraulic", color: "#0A7FA0" } }),
    prisma.checklistCategory.upsert({ where: { code: "LUBRICATION" }, update: {}, create: { code: "LUBRICATION", nameTh: "การหล่อลื่น", nameEn: "Lubrication", color: "#0D9062" } }),
    prisma.checklistCategory.upsert({ where: { code: "CLEANING" }, update: {}, create: { code: "CLEANING", nameTh: "การทำความสะอาด", nameEn: "Cleaning", color: "#6340C8" } }),
    prisma.checklistCategory.upsert({ where: { code: "CALIBRATION" }, update: {}, create: { code: "CALIBRATION", nameTh: "การสอบเทียบ", nameEn: "Calibration", color: "#C05800" } }),
  ]);
  const [safeCat, mechCat, elecCat, hydCat, lubCat, cleanCat, calCat] = checkCats;

  // ─── Checklist Templates ──────────────────────────────────
  const pressTemplate = await prisma.checklistTemplate.upsert({
    where: { code: "CL-PRESS-M" },
    update: {},
    create: {
      code: "CL-PRESS-M",
      nameTh: "รายการตรวจสอบเครื่องอัด (รายเดือน)",
      nameEn: "Press Machine Monthly Checklist",
      assetClassId: pressClass.id,
      items: {
        create: [
          { sortOrder: 1, categoryId: safeCat.id, descriptionTh: "ตรวจสอบสัญญาณแจ้งเตือนฉุกเฉิน", descriptionEn: "Check emergency alarm signals", isCritical: true },
          { sortOrder: 2, categoryId: safeCat.id, descriptionTh: "ตรวจสอบประตูนิรภัย / guard ทุกจุด", descriptionEn: "Check all safety guards and doors", isCritical: true },
          { sortOrder: 3, categoryId: mechCat.id, descriptionTh: "ตรวจสอบการสึกหรอของแม่พิมพ์ส่วนกดบน-ล่าง", descriptionEn: "Inspect upper/lower die for wear" },
          { sortOrder: 4, categoryId: mechCat.id, descriptionTh: "ตรวจสอบโบลต์ยึดแม่พิมพ์ — แรงขันตาม spec", descriptionEn: "Check die clamping bolts torque", standard: "80 N·m" },
          { sortOrder: 5, categoryId: hydCat.id, descriptionTh: "ตรวจสอบระดับน้ำมันไฮดรอลิก", descriptionEn: "Check hydraulic oil level", standard: "MIN–MAX" },
          { sortOrder: 6, categoryId: hydCat.id, descriptionTh: "ตรวจสอบท่อและข้อต่อไฮดรอลิกรั่วซึม", descriptionEn: "Check hydraulic hoses/fittings for leaks" },
          { sortOrder: 7, categoryId: elecCat.id, descriptionTh: "ตรวจสอบสายไฟและขั้วต่อ", descriptionEn: "Inspect electrical cables and connectors" },
          { sortOrder: 8, categoryId: lubCat.id, descriptionTh: "เติมจารบีที่จุดหล่อลื่น (Grease points)", descriptionEn: "Lubricate all grease points", standard: "Shell Alvania EP2" },
          { sortOrder: 9, categoryId: cleanCat.id, descriptionTh: "ทำความสะอาดเครื่องและบริเวณโดยรอบ", descriptionEn: "Clean machine and surrounding area" },
          { sortOrder: 10, categoryId: elecCat.id, descriptionTh: "ทดสอบปุ่ม E-Stop ทุกจุด", descriptionEn: "Test all E-Stop buttons", isCritical: true },
        ],
      },
    },
  });

  // ─── Assets: Machines (20 sample) ────────────────────────
  const machineData = [
    { code: "SK-P-001", nameTh: "เครื่องอัดยาง #1", nameEn: "Rubber Press #1", classId: pressClass.id, areaId: areaA.id, status: "ACTIVE" as const, powerKw: 75, voltage: 380 },
    { code: "SK-P-002", nameTh: "เครื่องอัดยาง #2", nameEn: "Rubber Press #2", classId: pressClass.id, areaId: areaA.id, status: "ACTIVE" as const, powerKw: 75, voltage: 380 },
    { code: "SK-P-003", nameTh: "เครื่องอัดยาง #3", nameEn: "Rubber Press #3", classId: pressClass.id, areaId: areaA.id, status: "UNDER_REPAIR" as const, powerKw: 55, voltage: 380 },
    { code: "SK-P-004", nameTh: "เครื่องอัดยาง #4", nameEn: "Rubber Press #4", classId: pressClass.id, areaId: areaA.id, status: "ACTIVE" as const, powerKw: 75, voltage: 380 },
    { code: "SK-P-005", nameTh: "เครื่องอัดยาง #5", nameEn: "Rubber Press #5", classId: pressClass.id, areaId: areaB.id, status: "ACTIVE" as const, powerKw: 75, voltage: 380 },
    { code: "SK-P-006", nameTh: "เครื่องอัดยาง #6", nameEn: "Rubber Press #6", classId: pressClass.id, areaId: areaB.id, status: "ACTIVE" as const, powerKw: 55, voltage: 380 },
    { code: "SK-P-007", nameTh: "เครื่องอัดยาง #7", nameEn: "Rubber Press #7", classId: pressClass.id, areaId: areaB.id, status: "INACTIVE" as const, powerKw: 55, voltage: 380 },
    { code: "SK-P-008", nameTh: "เครื่องอัดยาง #8", nameEn: "Rubber Press #8", classId: pressClass.id, areaId: areaB.id, status: "ACTIVE" as const, powerKw: 75, voltage: 380 },
    { code: "SK-P-009", nameTh: "เครื่องตัดยาง #1", nameEn: "Rubber Cutter #1", classId: pressClass.id, areaId: trimRoom.id, status: "ACTIVE" as const, powerKw: 22, voltage: 380 },
    { code: "SK-P-010", nameTh: "เครื่องตัดยาง #2", nameEn: "Rubber Cutter #2", classId: pressClass.id, areaId: trimRoom.id, status: "ACTIVE" as const, powerKw: 22, voltage: 380 },
  ];

  for (const m of machineData) {
    await prisma.asset.upsert({
      where: { code: m.code },
      update: {},
      create: {
        code: m.code, nameTh: m.nameTh, nameEn: m.nameEn,
        category: "MACHINE", status: m.status,
        assetClassId: m.classId, areaId: m.areaId,
        departmentId: prodDept.id, sectionId: sections[2].id,
        manufacturer: "FUJIKOSHI", powerKw: m.powerKw, voltage: m.voltage,
        purchaseDate: new Date("2020-01-01"), installDate: new Date("2020-03-01"),
        qrCode: `QR-${m.code}`,
      },
    });
  }

  // ─── Assets: Molds (10 sample) ───────────────────────────
  const moldData = [
    { code: "J-C-001", nameTh: "แม่พิมพ์ยางซีล A1", nameEn: "Rubber Seal Mold A1", classId: compMoldClass.id, shots: 125000, cavities: 8 },
    { code: "J-C-002", nameTh: "แม่พิมพ์ยางซีล A2", nameEn: "Rubber Seal Mold A2", classId: compMoldClass.id, shots: 89000, cavities: 8 },
    { code: "J-C-003", nameTh: "แม่พิมพ์ยาง O-Ring B1", nameEn: "O-Ring Mold B1", classId: injMoldClass.id, shots: 210000, cavities: 16 },
    { code: "J-C-004", nameTh: "แม่พิมพ์ยาง Gasket C1", nameEn: "Gasket Mold C1", classId: compMoldClass.id, shots: 45000, cavities: 4 },
    { code: "J-C-005", nameTh: "แม่พิมพ์ยาง Diaphragm D1", nameEn: "Diaphragm Mold D1", classId: compMoldClass.id, shots: 67000, cavities: 2 },
  ];

  for (const m of moldData) {
    await prisma.asset.upsert({
      where: { code: m.code },
      update: {},
      create: {
        code: m.code, nameTh: m.nameTh, nameEn: m.nameEn,
        category: "MOLD", status: "ACTIVE",
        assetClassId: m.classId, areaId: toolRoom.id,
        departmentId: prodDept.id,
        shotCount: m.shots, cavityCount: m.cavities, moldLifeShots: 500000,
        purchaseDate: new Date("2019-01-01"),
        qrCode: `QR-${m.code}`,
      },
    });
  }

  // ─── Assets: IT (5 sample) ────────────────────────────────
  const itData = [
    { code: "PCD-AC-01", nameTh: "เซิร์ฟเวอร์หลัก", nameEn: "Main Server", classId: serverClass.id, ip: "192.168.1.10", os: "Windows Server 2022" },
    { code: "PCD-AC-02", nameTh: "เซิร์ฟเวอร์สำรอง", nameEn: "Backup Server", classId: serverClass.id, ip: "192.168.1.11", os: "Windows Server 2022" },
    { code: "PCD-WS-01", nameTh: "คอมพิวเตอร์ MES", nameEn: "MES Workstation", classId: wsClass.id, ip: "192.168.1.50", os: "Windows 11 Pro" },
    { code: "PCD-WS-02", nameTh: "คอมพิวเตอร์ QA", nameEn: "QA Workstation", classId: wsClass.id, ip: "192.168.1.51", os: "Windows 11 Pro" },
    { code: "PCD-WS-03", nameTh: "คอมพิวเตอร์ Maintenance", nameEn: "Maintenance Workstation", classId: wsClass.id, ip: "192.168.1.52", os: "Windows 11 Pro" },
  ];

  for (const it of itData) {
    await prisma.asset.upsert({
      where: { code: it.code },
      update: {},
      create: {
        code: it.code, nameTh: it.nameTh, nameEn: it.nameEn,
        category: "IT", status: "ACTIVE",
        assetClassId: it.classId, areaId: serverRoom.id,
        departmentId: itDept.id,
        ipAddress: it.ip, osVersion: it.os,
        purchaseDate: new Date("2022-01-01"),
        qrCode: `QR-${it.code}`,
      },
    });
  }

  // ─── Assets: Instruments (10 sample) ─────────────────────
  const now = new Date();
  const instrData = [
    { code: "PG-A-01", nameTh: "เกจวัดแรงดัน A1", nameEn: "Pressure Gauge A1", typeId: pgType.id, labId: spLab.id, period: 12, lastCal: new Date("2025-01-15"), calStatus: "NORMAL" as const },
    { code: "PG-A-02", nameTh: "เกจวัดแรงดัน A2", nameEn: "Pressure Gauge A2", typeId: pgType.id, labId: spLab.id, period: 12, lastCal: new Date("2024-06-01"), calStatus: "OVERDUE" as const },
    { code: "PG-A-03", nameTh: "เกจวัดแรงดัน B1", nameEn: "Pressure Gauge B1", typeId: pgType.id, labId: pcalLab.id, period: 12, lastCal: new Date("2025-05-01"), calStatus: "DUE_SOON" as const },
    { code: "LC-A-01", nameTh: "โหลดเซลล์ #1", nameEn: "Load Cell #1", typeId: lcType.id, labId: spLab.id, period: 12, lastCal: new Date("2025-03-01"), calStatus: "NORMAL" as const },
    { code: "TC-A-01", nameTh: "เทอร์โมคัปเปิล #1", nameEn: "Thermocouple #1", typeId: tcType.id, labId: pcalLab.id, period: 12, lastCal: new Date("2025-02-01"), calStatus: "NORMAL" as const },
    { code: "VC-A-01", nameTh: "เวอร์เนียร์ #1", nameEn: "Caliper #1", typeId: calType.id, labId: spLab.id, period: 12, lastCal: new Date("2025-01-01"), calStatus: "NORMAL" as const },
    { code: "VC-A-02", nameTh: "เวอร์เนียร์ #2", nameEn: "Caliper #2", typeId: calType.id, labId: spLab.id, period: 12, lastCal: new Date("2024-08-01"), calStatus: "OVERDUE" as const },
    { code: "MC-A-01", nameTh: "ไมโครมิเตอร์ #1", nameEn: "Micrometer #1", typeId: micType.id, labId: pcalLab.id, period: 12, lastCal: new Date("2025-04-01"), calStatus: "DUE_SOON" as const },
    { code: "PG-B-01", nameTh: "เกจวัดแรงดัน C1", nameEn: "Pressure Gauge C1", typeId: pgType.id, labId: spLab.id, period: 6, lastCal: new Date("2025-04-15"), calStatus: "DUE_SOON" as const },
    { code: "TC-B-01", nameTh: "เทอร์โมคัปเปิล #2", nameEn: "Thermocouple #2", typeId: tcType.id, labId: pcalLab.id, period: 12, lastCal: new Date("2025-05-10"), calStatus: "NORMAL" as const },
  ];

  for (const instr of instrData) {
    const nextCal = new Date(instr.lastCal);
    nextCal.setMonth(nextCal.getMonth() + instr.period);
    await prisma.asset.upsert({
      where: { code: instr.code },
      update: {},
      create: {
        code: instr.code, nameTh: instr.nameTh, nameEn: instr.nameEn,
        category: "INSTRUMENT", status: "ACTIVE",
        instrumentTypeId: instr.typeId, calLabId: instr.labId,
        calPeriodMonths: instr.period, lastCalDate: instr.lastCal,
        nextCalDate: nextCal, calStatus: instr.calStatus,
        areaId: toolRoom.id, departmentId: qaDept.id,
        qrCode: `QR-${instr.code}`,
      },
    });
  }

  // ─── Sample Work Orders ───────────────────────────────────
  const press1 = await prisma.asset.findFirst({ where: { code: "SK-P-001" } });
  const press3 = await prisma.asset.findFirst({ where: { code: "SK-P-003" } });

  if (press1 && press3) {
    await prisma.workOrder.upsert({
      where: { woNumber: "WO-2604-0001" },
      update: {},
      create: {
        woNumber: "WO-2604-0001",
        title: "เครื่อง SK-P-003 ปั๊มไฮดรอลิกรั่ว",
        description: "พบน้ำมันไฮดรอลิกรั่วออกจากท่อด้านซ้าย",
        status: "IN_PROGRESS",
        priorityId: urgentPri.id,
        typeId: cmType.id,
        assetId: press3.id,
        departmentId: prodDept.id,
        workflowId: workflow.id,
        creatorId: techUser1.id,
        assigneeId: techUser1.id,
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        failureCodeId: failureCodes[2].id,
      },
    });

    await prisma.workOrder.upsert({
      where: { woNumber: "WO-2604-0002" },
      update: {},
      create: {
        woNumber: "WO-2604-0002",
        title: "PM รายเดือน SK-P-001",
        description: "บำรุงรักษาตามแผน ประจำเดือน",
        status: "OPEN",
        priorityId: medPri.id,
        typeId: pmType.id,
        assetId: press1.id,
        departmentId: maintDept.id,
        workflowId: workflow.id,
        creatorId: techUser2.id,
      },
    });

    await prisma.workOrder.upsert({
      where: { woNumber: "WO-2603-0015" },
      update: {},
      create: {
        woNumber: "WO-2603-0015",
        title: "ซ่อมมอเตอร์ conveyor SK-P-001",
        description: "มอเตอร์สายพานเกิดเสียงผิดปกติ",
        status: "DONE",
        priorityId: highPri.id,
        typeId: cmType.id,
        assetId: press1.id,
        departmentId: prodDept.id,
        workflowId: workflow.id,
        creatorId: techUser2.id,
        assigneeId: techUser2.id,
        startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000),
        laborHours: 3.5,
        failureCodeId: failureCodes[1].id,
        causeCodeId: causeCodes[0].id,
        actionCodeId: actionCodes[1].id,
      },
    });
  }

  // ─── Spare Parts ──────────────────────────────────────────
  const ea = await prisma.unitOfMeasure.upsert({ where: { code: "EA" }, update: {}, create: { code: "EA", nameTh: "ชิ้น", nameEn: "Each" } });
  const lt = await prisma.unitOfMeasure.upsert({ where: { code: "L" }, update: {}, create: { code: "L", nameTh: "ลิตร", nameEn: "Liter" } });
  const kg = await prisma.unitOfMeasure.upsert({ where: { code: "KG" }, update: {}, create: { code: "KG", nameTh: "กิโลกรัม", nameEn: "Kilogram" } });

  const parts = [
    { code: "SP-HY-001", nameTh: "ซีลไฮดรอลิก ขนาด 50mm", nameEn: "Hydraulic Seal 50mm", stock: 24, rop: 10, cost: 250, unitId: ea.id },
    { code: "SP-HY-002", nameTh: "น้ำมันไฮดรอลิก VG46", nameEn: "Hydraulic Oil VG46", stock: 200, rop: 50, cost: 95, unitId: lt.id },
    { code: "SP-BE-001", nameTh: "ลูกปืน SKF 6205", nameEn: "Bearing SKF 6205", stock: 12, rop: 5, cost: 450, unitId: ea.id },
    { code: "SP-BE-002", nameTh: "ลูกปืน SKF 6308", nameEn: "Bearing SKF 6308", stock: 8, rop: 4, cost: 680, unitId: ea.id },
    { code: "SP-GR-001", nameTh: "จารบี Shell Alvania EP2", nameEn: "Shell Alvania EP2 Grease", stock: 15, rop: 5, cost: 320, unitId: kg.id },
    { code: "SP-SE-001", nameTh: "เซ็นเซอร์ความดัน 0-250 bar", nameEn: "Pressure Sensor 0-250 bar", stock: 3, rop: 2, cost: 3500, unitId: ea.id },
    { code: "SP-VB-001", nameTh: "สายพาน V-Belt A50", nameEn: "V-Belt A50", stock: 6, rop: 4, cost: 180, unitId: ea.id },
    { code: "SP-FT-001", nameTh: "ไส้กรองน้ำมัน Donaldson P502049", nameEn: "Oil Filter P502049", stock: 10, rop: 3, cost: 850, unitId: ea.id },
  ];

  for (const p of parts) {
    await prisma.sparePart.upsert({
      where: { code: p.code },
      update: {},
      create: {
        code: p.code, nameTh: p.nameTh, nameEn: p.nameEn,
        unitId: p.unitId, stockOnHand: p.stock, reorderPoint: p.rop,
        unitCost: p.cost, shelfLocation: "A-01",
      },
    });
  }

  // ─── Notification Rules ───────────────────────────────────
  const notifRules = [
    { event: "urgent_WO_created", audience: "MAINTENANCE_SUPERVISOR", channel: "in_app" },
    { event: "urgent_WO_created", audience: "MAINTENANCE_MANAGER", channel: "in_app" },
    { event: "PM_due_soon", audience: "MAINTENANCE_SUPERVISOR", channel: "in_app" },
    { event: "calibration_overdue", audience: "MAINTENANCE_MANAGER", channel: "in_app" },
    { event: "parts_low_stock", audience: "MAINTENANCE_SUPERVISOR", channel: "in_app" },
    { event: "WO_pending_approval", audience: "DEPT_SUPERVISOR", channel: "in_app" },
  ];

  for (const rule of notifRules) {
    await prisma.notificationRule.upsert({
      where: { id: rule.event + "-" + rule.audience + "-" + rule.channel },
      update: {},
      create: {
        id: rule.event + "-" + rule.audience + "-" + rule.channel,
        event: rule.event, audience: rule.audience, channel: rule.channel,
      },
    });
  }

  console.log("✅ Seed complete!");
  console.log("   Login: admin@skmc.co.th / skmc1234");
  console.log("   Or: manager@skmc.co.th / skmc1234");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
