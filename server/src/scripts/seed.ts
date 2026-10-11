import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { User } from '../models/User.js';
import { Voucher } from '../models/Voucher.js';
import { Counter } from '../models/Counter.js';
import { AuditLog } from '../models/AuditLog.js';
import { UserRole, VoucherStatus, AuditAction } from '../types/index.js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { toMinorUnits } from '../utils/currency.js';

// Minimal 1x1 transparent PNG file with valid magic bytes: 89 50 4E 47 0D 0A 1A 0A
const VALID_SAMPLE_PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG Signature
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk length & type
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // width=1, height=1
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, // bit depth, color type, compression, filter, interlace
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, // IDAT chunk length & type
  0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
  0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, // IEND chunk
  0x42, 0x60, 0x82,
]);

export async function seedDatabase(customUri?: string) {
  logger.info('Starting database seeding...');
  let memoryServer: MongoMemoryServer | null = null;

  try {
    const isMemoryMode = process.argv.includes('--memory') || customUri === 'memory';
    let uriToConnect = customUri;

    if (isMemoryMode) {
      logger.info('Starting in-memory MongoDB instance for seed verification...');
      memoryServer = await MongoMemoryServer.create();
      uriToConnect = memoryServer.getUri();
    }

    await connectDatabase(uriToConnect);

    // Ensure uploads directory exists
    if (!fs.existsSync(config.uploadDir)) {
      fs.mkdirSync(config.uploadDir, { recursive: true });
    }

    // Write sample signatures to disk
    const empSigFilename = 'sig_demo_employee_2026.png';
    const dirSigFilename = 'sig_demo_director_2026.png';
    fs.writeFileSync(path.join(config.uploadDir, empSigFilename), VALID_SAMPLE_PNG_BUFFER);
    fs.writeFileSync(path.join(config.uploadDir, dirSigFilename), VALID_SAMPLE_PNG_BUFFER);

    // Clear existing collections
    await Promise.all([
      User.deleteMany({}),
      Voucher.deleteMany({}),
      Counter.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    logger.info('Cleared existing collections.');

    // Default password hash
    const defaultPassword = 'Password123!';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // Create 3 demo users
    const employee = await User.create({
      name: 'Mohsin Hasan',
      email: 'employee@pspl.com',
      passwordHash,
      employeeId: 'EMP-0142',
      department: 'Information Technology',
      role: UserRole.EMPLOYEE,
      isActive: true,
    });

    const director = await User.create({
      name: 'Rajesh Sharma',
      email: 'director@pspl.com',
      passwordHash,
      employeeId: 'DIR-0001',
      department: 'Executive Management',
      role: UserRole.DIRECTOR,
      isActive: true,
    });

    const accounts = await User.create({
      name: 'Pooja Verma',
      email: 'accounts@pspl.com',
      passwordHash,
      employeeId: 'ACC-0023',
      department: 'Finance & Accounts',
      role: UserRole.ACCOUNTS,
      isActive: true,
    });

    logger.info('Created demo users: Employee, Director, Accounts.');

    // Initialize atomic sequence counter
    const currentYear = new Date().getFullYear();
    await Counter.create({
      name: 'voucherNumber',
      year: currentYear,
      sequenceValue: 6,
    });

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    // Seed Sample Vouchers
    // 1. DRAFT voucher
    const v1 = await Voucher.create({
      voucherNumber: `EV-${currentYear}-0001`,
      voucherDate: now,
      expenseDate: yesterday,
      department: 'Information Technology',
      expenseTitle: 'Local Transport to Client Office in Mumbai',
      expenseCategory: 'Travel',
      expenseDescription: 'Cab fare from head office to client data center for server migration.',
      amount: toMinorUnits(4500),
      employeeId: employee._id,
      status: VoucherStatus.DRAFT,
    });
    await AuditLog.create({
      actorId: employee._id,
      voucherId: v1._id,
      voucherNumber: v1.voucherNumber,
      action: AuditAction.CREATE,
      newStatus: VoucherStatus.DRAFT,
      details: { note: 'Draft voucher created' },
    });

    // 2. PENDING_APPROVAL voucher 1
    const v2 = await Voucher.create({
      voucherNumber: `EV-${currentYear}-0002`,
      voucherDate: yesterday,
      expenseDate: threeDaysAgo,
      department: 'Information Technology',
      expenseTitle: 'AWS Summit Tech Pass & Hotel Stay',
      expenseCategory: 'Accommodation',
      expenseDescription: 'Hotel accommodation and conference registration for 2-day cloud summit.',
      amount: toMinorUnits(18750),
      employeeId: employee._id,
      employeeSignaturePath: empSigFilename,
      status: VoucherStatus.PENDING_APPROVAL,
      submittedAt: yesterday,
    });
    await AuditLog.create({
      actorId: employee._id,
      voucherId: v2._id,
      voucherNumber: v2.voucherNumber,
      action: AuditAction.SUBMIT,
      previousStatus: VoucherStatus.DRAFT,
      newStatus: VoucherStatus.PENDING_APPROVAL,
      details: { note: 'Submitted for director approval' },
    });

    // 3. PENDING_APPROVAL voucher 2
    const v3 = await Voucher.create({
      voucherNumber: `EV-${currentYear}-0003`,
      voucherDate: now,
      expenseDate: yesterday,
      department: 'Information Technology',
      expenseTitle: 'Quarterly Office Stationery & Printer Cartridges',
      expenseCategory: 'Office Supplies',
      expenseDescription: 'Stationery and high-yield ink cartridges for engineering department printers.',
      amount: toMinorUnits(6200),
      employeeId: employee._id,
      employeeSignaturePath: empSigFilename,
      status: VoucherStatus.PENDING_APPROVAL,
      submittedAt: now,
    });
    await AuditLog.create({
      actorId: employee._id,
      voucherId: v3._id,
      voucherNumber: v3.voucherNumber,
      action: AuditAction.SUBMIT,
      previousStatus: VoucherStatus.DRAFT,
      newStatus: VoucherStatus.PENDING_APPROVAL,
    });

    // 4. APPROVED voucher 1
    const v4 = await Voucher.create({
      voucherNumber: `EV-${currentYear}-0004`,
      voucherDate: fiveDaysAgo,
      expenseDate: fiveDaysAgo,
      department: 'Information Technology',
      expenseTitle: 'High-Speed Fiber Internet Setup for Remote Support',
      expenseCategory: 'Communication',
      expenseDescription: 'Installation charges and 3-month advance fiber internet for on-call support team.',
      amount: toMinorUnits(8500),
      employeeId: employee._id,
      employeeSignaturePath: empSigFilename,
      directorSignaturePath: dirSigFilename,
      status: VoucherStatus.APPROVED,
      submittedAt: fiveDaysAgo,
      approvalDate: yesterday,
      reviewedById: director._id,
    });
    await AuditLog.create({
      actorId: director._id,
      voucherId: v4._id,
      voucherNumber: v4.voucherNumber,
      action: AuditAction.APPROVE,
      previousStatus: VoucherStatus.PENDING_APPROVAL,
      newStatus: VoucherStatus.APPROVED,
      details: { note: 'Approved with director signature' },
    });

    // 5. APPROVED voucher 2
    const v5 = await Voucher.create({
      voucherNumber: `EV-${currentYear}-0005`,
      voucherDate: threeDaysAgo,
      expenseDate: fourDaysAgo,
      department: 'Information Technology',
      expenseTitle: 'Client Relationship Dinner & Strategy Discussion',
      expenseCategory: 'Meals',
      expenseDescription: 'Working dinner with key stakeholders following quarterly business review.',
      amount: toMinorUnits(3800),
      employeeId: employee._id,
      employeeSignaturePath: empSigFilename,
      directorSignaturePath: dirSigFilename,
      status: VoucherStatus.APPROVED,
      submittedAt: threeDaysAgo,
      approvalDate: now,
      reviewedById: director._id,
    });
    await AuditLog.create({
      actorId: director._id,
      voucherId: v5._id,
      voucherNumber: v5.voucherNumber,
      action: AuditAction.APPROVE,
      previousStatus: VoucherStatus.PENDING_APPROVAL,
      newStatus: VoucherStatus.APPROVED,
    });

    // 6. REJECTED voucher
    const v6 = await Voucher.create({
      voucherNumber: `EV-${currentYear}-0006`,
      voucherDate: fourDaysAgo,
      expenseDate: fiveDaysAgo,
      department: 'Information Technology',
      expenseTitle: 'Premium Luxury Sedan Airport Transfer',
      expenseCategory: 'Transportation',
      expenseDescription: 'Airport transfer via luxury executive fleet.',
      amount: toMinorUnits(12000),
      employeeId: employee._id,
      employeeSignaturePath: empSigFilename,
      status: VoucherStatus.REJECTED,
      rejectionReason:
        'Cab expense exceeds standard travel allowance policy without prior executive sanction. Please claim standard business taxi rate.',
      submittedAt: fourDaysAgo,
      reviewedById: director._id,
    });
    await AuditLog.create({
      actorId: director._id,
      voucherId: v6._id,
      voucherNumber: v6.voucherNumber,
      action: AuditAction.REJECT,
      previousStatus: VoucherStatus.PENDING_APPROVAL,
      newStatus: VoucherStatus.REJECTED,
      details: {
        rejectionReason:
          'Cab expense exceeds standard travel allowance policy without prior executive sanction. Please claim standard business taxi rate.',
      },
    });

    logger.info('Database seeded successfully with 6 diverse vouchers and audit logs!');
    logger.info('-----------------------------------------');
    logger.info('Demo Credentials:');
    logger.info('1. Employee: employee@pspl.com / Password123!');
    logger.info('2. Director: director@pspl.com / Password123!');
    logger.info('3. Accounts: accounts@pspl.com / Password123!');
    logger.info('-----------------------------------------');
  } catch (error) {
    logger.error('Seeding error:', error);
    throw error;
  } finally {
    await disconnectDatabase();
    if (memoryServer) {
      await memoryServer.stop();
      logger.info('In-memory MongoDB stopped.');
    }
  }
}

// Run directly if invoked from CLI
if (process.argv[1]?.includes('seed')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
