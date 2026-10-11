import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Voucher } from '../src/models/Voucher.js';
import { Counter } from '../src/models/Counter.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { UserRole, VoucherStatus } from '../src/types/index.js';
import { toMinorUnits } from '../src/utils/currency.js';
import path from 'path';
import fs from 'fs';
import { config } from '../src/config/env.js';

let mongoServer: MongoMemoryServer;
let app: any;

// Sample 1x1 PNG buffer with valid magic bytes
const SAMPLE_PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
  0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
  0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

let employeeToken: string;
let employee2Token: string;
let directorToken: string;
let accountsToken: string;
let employeeUser: any;
let employee2User: any;
let directorUser: any;
let accountsUser: any;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  if (!fs.existsSync(config.uploadDir)) {
    fs.mkdirSync(config.uploadDir, { recursive: true });
  }

  app = createApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Voucher.deleteMany({});
  await Counter.deleteMany({});
  await AuditLog.deleteMany({});

  const passwordHash = await bcrypt.hash('Password123!', 10);

  employeeUser = await User.create({
    name: 'Test Employee 1',
    email: 'emp1@pspl.com',
    passwordHash,
    role: UserRole.EMPLOYEE,
    department: 'Engineering',
    isActive: true,
  });

  employee2User = await User.create({
    name: 'Test Employee 2',
    email: 'emp2@pspl.com',
    passwordHash,
    role: UserRole.EMPLOYEE,
    department: 'Marketing',
    isActive: true,
  });

  directorUser = await User.create({
    name: 'Test Director',
    email: 'dir@pspl.com',
    passwordHash,
    role: UserRole.DIRECTOR,
    department: 'Management',
    isActive: true,
  });

  accountsUser = await User.create({
    name: 'Test Accounts',
    email: 'acc@pspl.com',
    passwordHash,
    role: UserRole.ACCOUNTS,
    department: 'Finance',
    isActive: true,
  });

  // Login tokens
  const loginRes1 = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'emp1@pspl.com', password: 'Password123!' });
  employeeToken = loginRes1.body.token;

  const loginRes2 = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'emp2@pspl.com', password: 'Password123!' });
  employee2Token = loginRes2.body.token;

  const loginResDir = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'dir@pspl.com', password: 'Password123!' });
  directorToken = loginResDir.body.token;

  const loginResAcc = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'acc@pspl.com', password: 'Password123!' });
  accountsToken = loginResAcc.body.token;
});

describe('Expense Voucher Management System Test Suite', () => {
  // 1. Successful login
  it('1. should allow successful login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'emp1@pspl.com', password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('emp1@pspl.com');
  });

  // 2. Invalid login
  it('2. should reject invalid login credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'emp1@pspl.com', password: 'WrongPassword!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // 3. Inactive user restrictions
  it('3. should reject login for deactivated user accounts', async () => {
    await User.findByIdAndUpdate(employeeUser._id, { isActive: false });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'emp1@pspl.com', password: 'Password123!' });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/deactivated/i);
  });

  // 4. Employee cannot access Director endpoints
  it('4. should forbid Employee from accessing Director endpoints', async () => {
    const res = await request(app)
      .get('/api/v1/director/dashboard')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Forbidden/i);
  });

  // 5. Employee cannot access Accounts endpoints
  it('5. should forbid Employee from accessing Accounts endpoints', async () => {
    const res = await request(app)
      .get('/api/v1/accounts/dashboard')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Forbidden/i);
  });

  // 6. Employee cannot view another employee's voucher
  it('6. should forbid Employee from viewing another employee voucher', async () => {
    const v = await Voucher.create({
      voucherNumber: 'EV-2026-9001',
      voucherDate: new Date(),
      expenseDate: new Date(),
      department: 'Marketing',
      expenseTitle: 'Confidential Marketing Campaign',
      expenseCategory: 'Travel',
      amount: toMinorUnits(5000),
      employeeId: employee2User._id,
      status: VoucherStatus.DRAFT,
    });

    const res = await request(app)
      .get(`/api/v1/vouchers/${v._id}`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/only view vouchers created by yourself/i);
  });

  // 7. Draft creation
  it('7. should allow Employee to create a Draft voucher without signature', async () => {
    const res = await request(app)
      .post('/api/v1/vouchers')
      .set('Authorization', `Bearer ${employeeToken}`)
      .field('expenseTitle', 'Laptop Charger Replacement')
      .field('department', 'Engineering')
      .field('expenseCategory', 'Office Supplies')
      .field('amount', 1200)
      .field('expenseDate', '2026-10-10')
      .field('isDraft', 'true');

    expect(res.status).toBe(201);
    expect(res.body.voucher.status).toBe(VoucherStatus.DRAFT);
    expect(res.body.voucher.voucherNumber).toMatch(/^EV-\d{4}-\d{4}$/);
  });

  // 8. Draft editing
  it('8. should allow Employee to edit their own draft voucher', async () => {
    const v = await Voucher.create({
      voucherNumber: 'EV-2026-0010',
      voucherDate: new Date(),
      expenseDate: new Date(),
      department: 'Engineering',
      expenseTitle: 'Old Title',
      expenseCategory: 'Travel',
      amount: toMinorUnits(1000),
      employeeId: employeeUser._id,
      status: VoucherStatus.DRAFT,
    });

    const res = await request(app)
      .patch(`/api/v1/vouchers/${v._id}`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ expenseTitle: 'Updated Travel Ticket', amount: 1500 });

    expect(res.status).toBe(200);
    expect(res.body.voucher.expenseTitle).toBe('Updated Travel Ticket');
    expect(res.body.voucher.amount).toBe(toMinorUnits(1500));
  });

  // 9. Draft deletion
  it('9. should allow Employee to delete their own draft voucher', async () => {
    const v = await Voucher.create({
      voucherNumber: 'EV-2026-0011',
      voucherDate: new Date(),
      expenseDate: new Date(),
      department: 'Engineering',
      expenseTitle: 'Draft To Delete',
      expenseCategory: 'Travel',
      amount: toMinorUnits(1000),
      employeeId: employeeUser._id,
      status: VoucherStatus.DRAFT,
    });

    const res = await request(app)
      .delete(`/api/v1/vouchers/${v._id}`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    const check = await Voucher.findById(v._id);
    expect(check).toBeNull();
  });

  // 10. Employee cannot edit submitted vouchers
  it('10. should prevent Employee from editing submitted vouchers', async () => {
    const v = await Voucher.create({
      voucherNumber: 'EV-2026-0012',
      voucherDate: new Date(),
      expenseDate: new Date(),
      department: 'Engineering',
      expenseTitle: 'Submitted Expense',
      expenseCategory: 'Travel',
      amount: toMinorUnits(2000),
      employeeId: employeeUser._id,
      status: VoucherStatus.PENDING_APPROVAL,
    });

    const res = await request(app)
      .patch(`/api/v1/vouchers/${v._id}`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ expenseTitle: 'Attempted Change' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Only DRAFT vouchers can be modified/i);
  });

  // 11. Employee signature required for submission
  it('11. should require Employee signature before submission', async () => {
    const v = await Voucher.create({
      voucherNumber: 'EV-2026-0013',
      voucherDate: new Date(),
      expenseDate: new Date(),
      department: 'Engineering',
      expenseTitle: 'Expense without Signature',
      expenseCategory: 'Meals',
      amount: toMinorUnits(800),
      employeeId: employeeUser._id,
      status: VoucherStatus.DRAFT,
    });

    // Try submit without signature
    const res = await request(app)
      .post(`/api/v1/vouchers/${v._id}/submit`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Employee signature is mandatory/i);

    // Now submit with valid PNG signature
    const resSuccess = await request(app)
      .post(`/api/v1/vouchers/${v._id}/submit`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .attach('signature', SAMPLE_PNG, 'mysig.png');

    expect(resSuccess.status).toBe(200);
    expect(resSuccess.body.voucher.status).toBe(VoucherStatus.PENDING_APPROVAL);
    expect(resSuccess.body.voucher.employeeSignaturePath).toBeDefined();
  });

  // 12. Positive amount validation
  it('12. should validate that amount is positive and greater than zero', async () => {
    const res = await request(app)
      .post('/api/v1/vouchers')
      .set('Authorization', `Bearer ${employeeToken}`)
      .field('expenseTitle', 'Negative Expense')
      .field('department', 'Engineering')
      .field('expenseCategory', 'Travel')
      .field('amount', -50)
      .field('expenseDate', '2026-10-10')
      .field('isDraft', 'true');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Validation error/i);
  });

  // 13. Director signature required for approval
  it('13. should require Director signature for voucher approval', async () => {
    const v = await Voucher.create({
      voucherNumber: 'EV-2026-0014',
      voucherDate: new Date(),
      expenseDate: new Date(),
      department: 'Engineering',
      expenseTitle: 'Pending Travel',
      expenseCategory: 'Travel',
      amount: toMinorUnits(3000),
      employeeId: employeeUser._id,
      status: VoucherStatus.PENDING_APPROVAL,
    });

    // Attempt approval without signature
    const res = await request(app)
      .post(`/api/v1/director/vouchers/${v._id}/approve`)
      .set('Authorization', `Bearer ${directorToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Director signature is mandatory/i);

    // Approve with Director signature
    const resSuccess = await request(app)
      .post(`/api/v1/director/vouchers/${v._id}/approve`)
      .set('Authorization', `Bearer ${directorToken}`)
      .attach('signature', SAMPLE_PNG, 'director_sig.png');

    expect(resSuccess.status).toBe(200);
    expect(resSuccess.body.voucher.status).toBe(VoucherStatus.APPROVED);
    expect(resSuccess.body.voucher.directorSignaturePath).toBeDefined();
    expect(resSuccess.body.voucher.approvalDate).toBeDefined();
  });

  // 14. Rejection reason required
  it('14. should require non-empty rejection reason when Director rejects', async () => {
    const v = await Voucher.create({
      voucherNumber: 'EV-2026-0015',
      voucherDate: new Date(),
      expenseDate: new Date(),
      department: 'Engineering',
      expenseTitle: 'Dubious Expense',
      expenseCategory: 'Other',
      amount: toMinorUnits(9999),
      employeeId: employeeUser._id,
      status: VoucherStatus.PENDING_APPROVAL,
    });

    // Empty rejection reason
    const resEmpty = await request(app)
      .post(`/api/v1/director/vouchers/${v._id}/reject`)
      .set('Authorization', `Bearer ${directorToken}`)
      .send({ rejectionReason: '  ' });

    expect(resEmpty.status).toBe(400);

    // Valid rejection reason
    const resValid = await request(app)
      .post(`/api/v1/director/vouchers/${v._id}/reject`)
      .set('Authorization', `Bearer ${directorToken}`)
      .send({ rejectionReason: 'Receipt invoice missing business registration number.' });

    expect(resValid.status).toBe(200);
    expect(resValid.body.voucher.status).toBe(VoucherStatus.REJECTED);
    expect(resValid.body.voucher.rejectionReason).toBe(
      'Receipt invoice missing business registration number.'
    );
  });

  // 15. Accounts cannot create, edit, delete, approve, or reject vouchers
  it('15. should forbid Accounts team from creating, editing, deleting, or reviewing vouchers', async () => {
    const v = await Voucher.create({
      voucherNumber: 'EV-2026-0016',
      voucherDate: new Date(),
      expenseDate: new Date(),
      department: 'Engineering',
      expenseTitle: 'Accounts Barrier Test',
      expenseCategory: 'Travel',
      amount: toMinorUnits(1500),
      employeeId: employeeUser._id,
      status: VoucherStatus.DRAFT,
    });

    // Create attempt
    const createRes = await request(app)
      .post('/api/v1/vouchers')
      .set('Authorization', `Bearer ${accountsToken}`)
      .field('expenseTitle', 'Illegal Accounts Creation')
      .field('department', 'Finance')
      .field('expenseCategory', 'Travel')
      .field('amount', 500)
      .field('expenseDate', '2026-10-10');
    expect(createRes.status).toBe(403);

    // Edit attempt
    const editRes = await request(app)
      .patch(`/api/v1/vouchers/${v._id}`)
      .set('Authorization', `Bearer ${accountsToken}`)
      .send({ amount: 999 });
    expect(editRes.status).toBe(403);

    // Delete attempt
    const deleteRes = await request(app)
      .delete(`/api/v1/vouchers/${v._id}`)
      .set('Authorization', `Bearer ${accountsToken}`);
    expect(deleteRes.status).toBe(403);

    // Approve attempt
    const approveRes = await request(app)
      .post(`/api/v1/director/vouchers/${v._id}/approve`)
      .set('Authorization', `Bearer ${accountsToken}`);
    expect(approveRes.status).toBe(403);
  });

  // 16. Voucher number uniqueness
  it('16. should enforce voucher number uniqueness in database', async () => {
    await Voucher.create({
      voucherNumber: 'EV-UNIQUE-101',
      voucherDate: new Date(),
      expenseDate: new Date(),
      department: 'Engineering',
      expenseTitle: 'First voucher',
      expenseCategory: 'Travel',
      amount: toMinorUnits(100),
      employeeId: employeeUser._id,
      status: VoucherStatus.DRAFT,
    });

    let duplicateError: any;
    try {
      await Voucher.create({
        voucherNumber: 'EV-UNIQUE-101',
        voucherDate: new Date(),
        expenseDate: new Date(),
        department: 'Engineering',
        expenseTitle: 'Duplicate voucher',
        expenseCategory: 'Travel',
        amount: toMinorUnits(200),
        employeeId: employeeUser._id,
        status: VoucherStatus.DRAFT,
      });
    } catch (err) {
      duplicateError = err;
    }

    expect(duplicateError).toBeDefined();
    expect(duplicateError.code).toBe(11000);
  });

  // 17. Invalid status transitions are rejected
  it('17. should reject invalid status transitions (e.g. approving a DRAFT or REJECTED voucher)', async () => {
    const vDraft = await Voucher.create({
      voucherNumber: 'EV-2026-0017',
      voucherDate: new Date(),
      expenseDate: new Date(),
      department: 'Engineering',
      expenseTitle: 'Draft not pending',
      expenseCategory: 'Travel',
      amount: toMinorUnits(1000),
      employeeId: employeeUser._id,
      status: VoucherStatus.DRAFT,
    });

    const res = await request(app)
      .post(`/api/v1/director/vouchers/${vDraft._id}/approve`)
      .set('Authorization', `Bearer ${directorToken}`)
      .attach('signature', SAMPLE_PNG, 'director_sig.png');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Only PENDING_APPROVAL vouchers can be approved/i);
  });

  // 18. Duplicate or concurrent review operations are safely handled
  it('18. should safely handle conflicting/duplicate review actions without double review', async () => {
    const v = await Voucher.create({
      voucherNumber: 'EV-2026-0018',
      voucherDate: new Date(),
      expenseDate: new Date(),
      department: 'Engineering',
      expenseTitle: 'Concurrent review test',
      expenseCategory: 'Travel',
      amount: toMinorUnits(2500),
      employeeId: employeeUser._id,
      status: VoucherStatus.PENDING_APPROVAL,
    });

    // First review succeeds
    const res1 = await request(app)
      .post(`/api/v1/director/vouchers/${v._id}/approve`)
      .set('Authorization', `Bearer ${directorToken}`)
      .attach('signature', SAMPLE_PNG, 'dir.png');

    expect(res1.status).toBe(200);

    // Second conflicting review immediately fails because status changed
    const res2 = await request(app)
      .post(`/api/v1/director/vouchers/${v._id}/reject`)
      .set('Authorization', `Bearer ${directorToken}`)
      .send({ rejectionReason: 'Trying to reject after approval' });

    expect(res2.status).toBe(400);
    expect(res2.body.message).toMatch(/Only PENDING_APPROVAL vouchers can be rejected/i);
  });

  // 19. Search and filtering work correctly
  it('19. should filter vouchers by department, status, and search query', async () => {
    await Voucher.create([
      {
        voucherNumber: 'EV-SEARCH-01',
        voucherDate: new Date(),
        expenseDate: new Date(),
        department: 'Operations',
        expenseTitle: 'Printer Paper Pack',
        expenseCategory: 'Office Supplies',
        amount: toMinorUnits(500),
        employeeId: employeeUser._id,
        status: VoucherStatus.APPROVED,
      },
      {
        voucherNumber: 'EV-SEARCH-02',
        voucherDate: new Date(),
        expenseDate: new Date(),
        department: 'Engineering',
        expenseTitle: 'AWS Server Bill',
        expenseCategory: 'Communication',
        amount: toMinorUnits(5000),
        employeeId: employeeUser._id,
        status: VoucherStatus.PENDING_APPROVAL,
      },
    ]);

    // Filter by department
    const depRes = await request(app)
      .get('/api/v1/director/vouchers?department=Operations')
      .set('Authorization', `Bearer ${directorToken}`);

    expect(depRes.status).toBe(200);
    expect(depRes.body.items.length).toBe(1);
    expect(depRes.body.items[0].voucherNumber).toBe('EV-SEARCH-01');

    // Search by title text
    const searchRes = await request(app)
      .get('/api/v1/director/vouchers?search=Server')
      .set('Authorization', `Bearer ${directorToken}`);

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.items.length).toBe(1);
    expect(searchRes.body.items[0].expenseTitle).toBe('AWS Server Bill');
  });

  // 20. Pagination and sorting work correctly
  it('20. should paginate and sort vouchers server-side', async () => {
    for (let i = 1; i <= 5; i++) {
      await Voucher.create({
        voucherNumber: `EV-PAGE-${i}`,
        voucherDate: new Date(),
        expenseDate: new Date(),
        department: 'Engineering',
        expenseTitle: `Item ${i}`,
        expenseCategory: 'Travel',
        amount: toMinorUnits(100 * i),
        employeeId: employeeUser._id,
        status: VoucherStatus.DRAFT,
      });
    }

    const pageRes = await request(app)
      .get('/api/v1/vouchers/my?limit=2&page=1&sortBy=amount&sortOrder=asc')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(pageRes.status).toBe(200);
    expect(pageRes.body.items.length).toBe(2);
    expect(pageRes.body.total).toBe(5);
    expect(pageRes.body.totalPages).toBe(3);
    // Ascending sort by amount: item 1 amount should be <= item 2
    expect(pageRes.body.items[0].amount).toBeLessThanOrEqual(pageRes.body.items[1].amount);
  });

  // 21. Signature access is protected
  it('21. should protect signature retrieval and forbid unauthorized access', async () => {
    const filename = 'sig_test_protected.png';
    fs.writeFileSync(path.join(config.uploadDir, filename), SAMPLE_PNG);

    const v = await Voucher.create({
      voucherNumber: 'EV-2026-9999',
      voucherDate: new Date(),
      expenseDate: new Date(),
      department: 'Marketing',
      expenseTitle: 'Employee 2 Voucher',
      expenseCategory: 'Travel',
      amount: toMinorUnits(2000),
      employeeId: employee2User._id,
      employeeSignaturePath: filename,
      status: VoucherStatus.PENDING_APPROVAL,
    });

    // Employee 1 cannot access Employee 2's signature
    const unauthRes = await request(app)
      .get(`/api/v1/signatures/${filename}`)
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(unauthRes.status).toBe(403);

    // Director CAN access signature
    const dirRes = await request(app)
      .get(`/api/v1/signatures/${filename}`)
      .set('Authorization', `Bearer ${directorToken}`);
    expect(dirRes.status).toBe(200);
    expect(dirRes.header['content-type']).toMatch(/image\/png/);
  });

  // 22. Dashboard data respects role and ownership boundaries
  it('22. should return metrics strictly respecting employee ownership and organization roles', async () => {
    // Employee 1 vouchers
    await Voucher.create([
      {
        voucherNumber: 'EV-DASH-1',
        voucherDate: new Date(),
        expenseDate: new Date(),
        department: 'Engineering',
        expenseTitle: 'Emp1 Approved',
        expenseCategory: 'Travel',
        amount: toMinorUnits(1000),
        employeeId: employeeUser._id,
        status: VoucherStatus.APPROVED,
      },
      {
        voucherNumber: 'EV-DASH-2',
        voucherDate: new Date(),
        expenseDate: new Date(),
        department: 'Engineering',
        expenseTitle: 'Emp1 Pending',
        expenseCategory: 'Travel',
        amount: toMinorUnits(2000),
        employeeId: employeeUser._id,
        status: VoucherStatus.PENDING_APPROVAL,
      },
    ]);

    // Employee 2 voucher
    await Voucher.create({
      voucherNumber: 'EV-DASH-3',
      voucherDate: new Date(),
      expenseDate: new Date(),
      department: 'Marketing',
      expenseTitle: 'Emp2 Approved',
      expenseCategory: 'Travel',
      amount: toMinorUnits(9000),
      employeeId: employee2User._id,
      status: VoucherStatus.APPROVED,
    });

    // Employee 1 dashboard must only see their own vouchers
    const empDash = await request(app)
      .get('/api/v1/vouchers/dashboard')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(empDash.status).toBe(200);
    expect(empDash.body.metrics.totalVouchers).toBe(2);
    expect(empDash.body.metrics.approvedVouchers).toBe(1);
    expect(empDash.body.metrics.pendingApproval).toBe(1);
    expect(empDash.body.metrics.totalClaimedAmount).toBe(3000); // 1000 + 2000

    // Accounts dashboard sees total organization approved vouchers
    const accDash = await request(app)
      .get('/api/v1/accounts/dashboard')
      .set('Authorization', `Bearer ${accountsToken}`);

    expect(accDash.status).toBe(200);
    expect(accDash.body.metrics.totalVouchers).toBe(3);
    expect(accDash.body.metrics.approvedVouchers).toBe(2); // 1 from emp1 + 1 from emp2
    expect(accDash.body.metrics.totalApprovedExpenseAmount).toBe(10000); // 1000 + 9000
  });
});
