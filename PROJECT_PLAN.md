# Project Plan & Requirements Checklist: Expense Voucher Management System (MERN)

**Company:** Prachay Securities Private Limited (PSPL)  
**Project:** Expense Voucher Management System  
**Stack:** MongoDB, Express.js, React (Vite + TypeScript), Node.js, Tailwind CSS  
**Status:** FULLY IMPLEMENTED & VERIFIED  

---

## 1. System Architecture & Design Overview

```
                      ┌────────────────────────────────────────┐
                      │              React Client              │
                      │  (Vite + TypeScript + Tailwind CSS)    │
                      │   TanStack Query + React Hook Form     │
                      └───────────────────┬────────────────────┘
                                          │
                        HTTPS / JSON REST APIs + Cookies / Auth Bearer
                                          │
                      ┌───────────────────▼────────────────────┐
                      │            Express 4 Server            │
                      │        (Node.js + TypeScript)          │
                      │   Helmet, RateLimit, CORS, Multer      │
                      │   Auth JWT + Role Guard Middleware     │
                      └─────────────┬──────────────────────────┘
                                    │
               Mongoose ODM / MongoDB Native Driver
                                    │
                      ┌─────────────▼──────────────────────────┐
                      │           MongoDB Database             │
                      │  (Atlas / Local / In-Memory for Tests) │
                      │  Users, Vouchers, Counters, AuditLogs  │
                      └────────────────────────────────────────┘
```

---

## 2. Requirements & Verification Checklist

### 2.1 User Roles & Permissions
- [x] **Employee**:
  - [x] Login securely (JWT + HTTP-only cookies)
  - [x] Create voucher (Draft or Submit)
  - [x] Edit own Draft vouchers
  - [x] Delete own Draft vouchers
  - [x] Upload employee signature (PNG/JPEG <= 2MB + magic-byte validation)
  - [x] Submit voucher (transitions to `PENDING_APPROVAL`)
  - [x] View only self-created vouchers
  - [x] View full voucher details & rejection reason
  - [x] Strictly forbidden from editing submitted/approved/rejected vouchers
  - [x] Strictly forbidden from viewing other employees' vouchers
  - [x] Strictly forbidden from approving/rejecting vouchers
- [x] **Director**:
  - [x] Login securely
  - [x] View all organization vouchers
  - [x] View pending approval vouchers queue
  - [x] Search, filter, sort, paginate all vouchers
  - [x] View full voucher details & employee signature
  - [x] Approve voucher with mandatory Director signature upload
  - [x] Reject voucher with mandatory rejection reason
  - [x] Strictly forbidden from editing employee-entered voucher details
  - [x] Concurrency/race condition protection on review actions
- [x] **Accounts Team**:
  - [x] Login securely
  - [x] View all organization vouchers
  - [x] Search, filter, sort, paginate
  - [x] View voucher details, signatures, audit history
  - [x] Print/download voucher report (Bonus)
  - [x] Strictly read-only: forbidden from creating, editing, deleting, or approving/rejecting vouchers

### 2.2 Voucher Workflow
- [x] `DRAFT`: Saved initially. Can be modified/deleted by employee. Signatures optional.
- [x] `PENDING_APPROVAL`: Employee submits with mandatory signature & details. Read-only for employee. Visible to Director.
- [x] `APPROVED`: Director signs and approves. Read-only. Visible to Accounts Team.
- [x] `REJECTED`: Director rejects with reason. Read-only. Reason visible to employee.

### 2.3 Voucher Number Generation
- [x] Atomic backend counter: `EV-YYYY-XXXX` (e.g., `EV-2026-0001`).
- [x] Concurrency-safe via MongoDB `findOneAndUpdate` with `$inc` on atomic counter collection.

### 2.4 Financial Accuracy
- [x] Amounts stored as integer minor units (paise) to prevent floating-point rounding errors.
- [x] Safe validation against negative or zero values.
- [x] Consistent formatting in Indian Rupees (₹).

### 2.5 Security & File Handling
- [x] Passwords hashed with bcrypt (salt rounds: 10).
- [x] JWT tokens issued via HTTP-only secure cookies and Bearer header support.
- [x] Signature image uploads stored in private directory outside public static web roots.
- [x] Secure signature access endpoint verifying role and voucher ownership.
- [x] Magic bytes (buffer verification), MIME type, extension, and 2MB file size validation.
- [x] Helmet security headers, CORS origin allowlisting, Express rate limiting on sensitive routes.
- [x] AuditLog collection tracking all lifecycle mutations (`CREATE`, `UPDATE`, `DELETE`, `SUBMIT`, `APPROVE`, `REJECT`).

### 2.6 Dashboards & Metrics
- [x] **Employee Dashboard**: Total vouchers, draft count, pending count, approved count, rejected count, total claimed amount, recent vouchers table.
- [x] **Director Dashboard**: Pending approval count, approved today, rejected today, total pending amount, status distribution breakdown, recent activity.
- [x] **Accounts Dashboard**: Total vouchers, pending approval count, approved count, rejected count, total approved expense amount, recent approved vouchers table.

### 2.7 Bonus Search & Filtering
- [x] Voucher number search (escaped regex)
- [x] Employee name search
- [x] Department filter
- [x] Expense category filter
- [x] Status filter
- [x] Date range filter (from/to)
- [x] Amount range filter (min/max)
- [x] Server-side pagination & sorting with whitelisted fields

### 2.8 Quality Assurance & Testing
- [x] Automated backend test suite with Vitest / Supertest covering 22 critical scenarios (22 passed).
- [x] Seed script with demo accounts for all 3 roles and rich sample data verified.
- [x] Frontend production build verified (`vite build` - 0 errors).
- [x] Comprehensive README and environment documentation.
