# Expense Voucher Management System (MERN)

> **Full Stack Developer Internship Assignment**  
> Developed for **Prachay Securities Private Limited (PSPL)**  
> **Author:** Mohsin Hasan  
> **Tech Stack:** MongoDB, Express.js, React (Vite + TypeScript), Node.js, Tailwind CSS  

---

## 1. Project Overview

The **Expense Voucher Management System** digitizes ABC Company / PSPL's internal expense voucher submission, authorization, and reimbursement process. It replaces cumbersome paper-based expense claims with a role-governed digital workflow featuring:

- **Strict Role-Based Access Control (RBAC):** Distinct interfaces and enforced server-side authority for **Employee**, **Director**, and **Accounts** users.
- **Auditable Voucher Lifecycle:** Concurrency-protected transitions (`DRAFT` → `PENDING_APPROVAL` → `APPROVED` / `REJECTED`).
- **Cryptographic File & Signature Security:** Digital signature image verification via magic bytes, private disk storage (outside public web roots), and authenticated streaming.
- **Advanced Filtering & Search (Bonus Requirement):** Multi-parameter server-side queries across voucher numbers, claimant names, departments, categories, date ranges, and amount thresholds.
- **Financial Minor-Unit Precision:** Integer-minor arithmetic (in paise) to eliminate floating-point rounding errors.
- **Printable Accounts Voucher:** Standardized printable voucher view for audit documentation and reimbursement disbursement.

---

## 2. Technology Stack

### Frontend
- **Framework:** React 18 with TypeScript & Vite
- **Styling:** Tailwind CSS with custom corporate navy design tokens
- **Routing:** React Router v6
- **Server State & Caching:** TanStack React Query v5
- **Form Management & Validation:** React Hook Form with Zod schemas
- **HTTP Client:** Axios with credentialed session interceptors
- **Visual Analytics:** Recharts
- **Iconography:** Lucide React

### Backend
- **Runtime:** Node.js (v20+ / v21+) with Express.js & TypeScript
- **Database ODM:** Mongoose 8
- **Authentication:** JWT tokens via HTTP-only cookies and Bearer headers, bcryptjs password hashing (10 rounds)
- **Input Validation:** Zod request parsing & sanitization
- **File Uploads:** Multer with memory buffer inspection and PNG/JPEG magic-byte validation
- **Security Hardening:** Helmet headers, CORS allowlisting, Express rate limiting

### Testing & Quality Assurance
- **Unit & Integration Tests:** Vitest with Supertest
- **In-Memory Testing Database:** `mongodb-memory-server` for 100% isolated, reproducible test runs

---

## 3. Architecture & User Roles

```
┌────────────────────────────────────────────────────────────────────────┐
│                              USER ROLES                                │
├───────────────────┬────────────────────────────┬───────────────────────┤
│     EMPLOYEE      │          DIRECTOR          │       ACCOUNTS        │
├───────────────────┼────────────────────────────┼───────────────────────┤
│ • Create Vouchers │ • View All Org Vouchers    │ • View All Vouchers   │
│ • Save Drafts     │ • Review Pending Approvals │ • Search & Filter     │
│ • Edit Own Drafts │ • Approve with Signature   │ • Audit Trail Access  │
│ • Delete Drafts   │ • Reject with Mandatory    │ • Print Official      │
│ • Attach Signature│   Reason Remarks           │   Vouchers for        │
│ • Track Status    │ • Read-Only Claimant Data  │   Reimbursements      │
│ • View Rejections │ • Race Condition Protected │ • Strictly Read-Only  │
└───────────────────┴────────────────────────────┴───────────────────────┘
```

### Role Permissions Matrix

| Capability | Employee | Director | Accounts |
| :--- | :---: | :---: | :---: |
| Create Draft Voucher | Yes | No | No |
| Edit Own Draft Voucher | Yes | No | No |
| Delete Own Draft Voucher | Yes | No | No |
| Submit Voucher for Approval | Yes (requires signature) | No | No |
| View Own Vouchers | Yes | Yes (all org) | Yes (all org) |
| View Other Employees' Vouchers | **No (403 Forbidden)** | Yes | Yes |
| Approve Voucher | **No (403 Forbidden)** | Yes (requires signature) | **No (403 Forbidden)** |
| Reject Voucher | **No (403 Forbidden)** | Yes (requires reason) | **No (403 Forbidden)** |
| Modify Submitted / Reviewed Data | **No (400 Bad Request)**| **No (Read-Only)** | **No (Read-Only)** |

---

## 4. Voucher Workflow

```
       [Employee Creates]
               │
               ▼
        ┌─────────────┐
        │    DRAFT    │◄────── Employee can edit or delete draft
        └──────┬──────┘
               │  [Employee Submits with Signature]
               ▼
   ┌───────────────────────┐
   │   PENDING_APPROVAL    │◄────── Visible in Director Approval Queue
   └───────────┬───────────┘
               │
      ┌────────┴────────┐
      │                 │
[Director Signs]  [Director Rejects with Reason]
      │                 │
      ▼                 ▼
┌───────────┐     ┌───────────┐
│ APPROVED  │     │ REJECTED  │
└─────┬─────┘     └───────────┘
      │
      ▼
Visible to Accounts for
Reimbursement Processing
```

1. **`DRAFT`:** Newly initiated vouchers start here. The employee can update details or delete the draft. Signatures are optional while drafting.
2. **`PENDING_APPROVAL`:** The employee submits the voucher. All mandatory fields (Department, Expense Title, Expense Date, Positive Amount) and a valid employee signature are strictly required. The voucher becomes immutable to the employee.
3. **`APPROVED`:** The Director reviews and attaches their Director signature image. The voucher is marked as approved, setting `reviewedById` and `approvalDate`.
4. **`REJECTED`:** The Director declines the claim and provides a mandatory written justification (min 3 characters). The reason is visible to the employee.

---

## 5. Prerequisites

- **Node.js**: `v18.0.0` or higher (`v20` / `v21` recommended)
- **npm**: `v9.0.0` or higher
- **MongoDB**: MongoDB Atlas connection string **or** local MongoDB running on `mongodb://localhost:27017`
  *(Note: An in-memory mode is also provided for immediate demo evaluation without needing an active MongoDB server!)*

---

## 6. Installation & Quick Start

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd "Expense Voucher Management System"

# Install all workspace dependencies (root, server, and client)
npm install
```

### 2. Configure Environment Variables

Create `.env` at the root by copying `.env.example`:

```bash
cp .env.example .env
```

Default configuration in `.env`:

```env
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173

# Database (Replace with your Atlas URI if desired)
MONGODB_URI=mongodb://localhost:27017/expense_voucher_db

# Security & Authentication
JWT_SECRET=super_secret_jwt_key_at_least_32_characters_long_for_security
JWT_EXPIRES_IN=1d
COOKIE_SECRET=super_secret_cookie_signing_key_pspl_2026

# Uploads
UPLOAD_DIR=uploads/signatures
MAX_FILE_SIZE_BYTES=2097152

# Frontend Vite API Base URL
VITE_API_URL=http://localhost:5000/api/v1
```

### 3. Seed Development Accounts & Sample Vouchers

To seed demo accounts and realistic sample vouchers into your MongoDB database:

```bash
# Seed to your configured MONGODB_URI (local or Atlas)
npm run seed

# OR: Run in-memory seed verification (does not require external MongoDB installed)
npm run seed:memory
```

#### Demo Login Credentials

| Role | Email | Password | Pre-configured Department |
| :--- | :--- | :--- | :--- |
| **Employee** | `employee@pspl.com` | `Password123!` | Information Technology |
| **Director** | `director@pspl.com` | `Password123!` | Executive Management |
| **Accounts** | `accounts@pspl.com` | `Password123!` | Finance & Accounts |

*(The login page also provides 1-click preset buttons to instantly populate these accounts for convenience during evaluation).*

### 4. Run the Application

```bash
# Run both Backend API and React Frontend concurrently
npm run dev

# Or run services independently:
npm run dev:server   # Starts Express API at http://localhost:5000
npm run dev:client   # Starts Vite React dev server at http://localhost:5173
```

Open your browser at **`http://localhost:5173`**.

---

## 7. Automated Test Suite

The project includes an automated test suite executed with Vitest, Supertest, and `mongodb-memory-server`. All 22 test scenarios run against an isolated in-memory MongoDB replica.

```bash
# Run the test suite
npm test
```

### Verified Scenarios (22/22 Passing):

1. **Successful login** with valid credentials.
2. **Invalid login** credentials rejected.
3. **Inactive user account** restrictions enforced.
4. **Employee forbidden** from accessing Director endpoints.
5. **Employee forbidden** from accessing Accounts endpoints.
6. **Employee forbidden** from viewing another employee's voucher.
7. **Draft creation** without requiring signature.
8. **Draft editing** for own draft vouchers.
9. **Draft deletion** for own draft vouchers.
10. **Employee cannot edit** submitted vouchers.
11. **Employee signature required** before submission.
12. **Positive amount validation** enforced.
13. **Director signature required** for approval.
14. **Non-empty rejection reason required** when declining.
15. **Accounts team forbidden** from creating, modifying, deleting, or reviewing vouchers.
16. **Voucher number uniqueness** enforced at database index level.
17. **Invalid status transitions rejected** (e.g. approving a DRAFT).
18. **Concurrent/duplicate review race conditions safely handled**.
19. **Multi-parameter search and filtering** verified.
20. **Server-side pagination and sorting** verified.
21. **Protected signature access** restricted by role and ownership.
22. **Dashboard aggregation metrics** strictly respect role boundaries.

---

## 8. Building for Production

```bash
# Type check and build both backend and frontend bundles
npm run build
```

- Backend output: `server/dist/`
- Frontend output: `client/dist/`

---

## 9. API Reference (`/api/v1`)

### Authentication
- `POST /api/v1/auth/login` — Authenticate and receive HTTP-only cookie + JWT.
- `POST /api/v1/auth/logout` — Clear session cookie.
- `GET /api/v1/auth/me` — Return currently authenticated user profile.

### Employee Endpoints
- `GET /api/v1/vouchers/dashboard` — Aggregated KPI metrics for authenticated employee.
- `GET /api/v1/vouchers/my` — Paginated list of employee's own vouchers with query filters.
- `POST /api/v1/vouchers` — Create voucher (`isDraft=true` for draft, `isDraft=false` for submission). Supports `multipart/form-data` with `signature` file.
- `GET /api/v1/vouchers/:id` — Retrieve voucher details and audit trail.
- `PATCH /api/v1/vouchers/:id` — Update draft voucher.
- `DELETE /api/v1/vouchers/:id` — Delete draft voucher.
- `POST /api/v1/vouchers/:id/submit` — Submit draft voucher for approval with mandatory signature.

### Director Endpoints
- `GET /api/v1/director/dashboard` — Organization-wide KPI metrics, today's review counts, and status chart breakdown.
- `GET /api/v1/director/vouchers` — Search, filter, and paginate all organization vouchers.
- `GET /api/v1/director/vouchers/pending` — Filter specifically for pending approval vouchers.
- `POST /api/v1/director/vouchers/:id/approve` — Approve voucher with Director signature image (`multipart/form-data`).
- `POST /api/v1/director/vouchers/:id/reject` — Reject voucher with mandatory `rejectionReason` in body.

### Accounts Endpoints
- `GET /api/v1/accounts/dashboard` — Approved reimbursement totals and recent disbursement queue.
- `GET /api/v1/accounts/vouchers` — Read-only organization-wide voucher registry.

### Signature Access
- `GET /api/v1/signatures/:filename` — Protected endpoint streaming private signature images. Requires authentication and checks voucher ownership for employees.

---

## 10. Database Schema & Relationships

### `User` Collection
- `_id`: ObjectId
- `name`: String
- `email`: String (unique index, normalized lowercase)
- `passwordHash`: String (bcrypt hash)
- `employeeId`: String (sparse index)
- `department`: String
- `role`: Enum (`EMPLOYEE`, `DIRECTOR`, `ACCOUNTS`)
- `isActive`: Boolean (default true)
- `timestamps`: `createdAt`, `updatedAt`

### `Voucher` Collection
- `_id`: ObjectId
- `voucherNumber`: String (unique index, format `EV-YYYY-XXXX`)
- `voucherDate`: Date (index)
- `expenseDate`: Date (index)
- `department`: String (index)
- `expenseTitle`: String (index)
- `expenseCategory`: String (index)
- `expenseDescription`: String
- `amount`: Number (stored in integer paise, e.g., ₹1,250.50 = `125050`)
- `employeeId`: ObjectId (ref: `User`, index)
- `employeeSignaturePath`: String (private filename on disk)
- `directorSignaturePath`: String (private filename on disk)
- `status`: Enum (`DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `REJECTED`, index)
- `rejectionReason`: String
- `submittedAt`: Date
- `approvalDate`: Date
- `reviewedById`: ObjectId (ref: `User`, index)
- `timestamps`: `createdAt`, `updatedAt`

### `Counter` Collection
- `name`: String (e.g. `'voucherNumber'`)
- `year`: Number (e.g. `2026`)
- `sequenceValue`: Number (atomic increment counter via `findOneAndUpdate`)
- Unique compound index on `{ name: 1, year: 1 }`

### `AuditLog` Collection
- `_id`: ObjectId
- `actorId`: ObjectId (ref: `User`, index)
- `voucherId`: ObjectId (ref: `Voucher`, index)
- `voucherNumber`: String
- `action`: Enum (`CREATE`, `UPDATE`, `DELETE`, `SUBMIT`, `APPROVE`, `REJECT`)
- `previousStatus`: Enum
- `newStatus`: Enum
- `details`: Mixed object
- `createdAt`: Date

---

## 11. Security Implementation Highlights

1. **Authentication:** Passwords are never stored in plaintext and hashed using bcrypt. JSON Web Tokens are transmitted via secure HTTP-only cookies with sameSite configurations.
2. **File Magic-Byte Inspection:** Rather than trusting client MIME types or file extensions, file buffers are inspected in memory for valid PNG (`89 50 4E 47`) and JPEG (`FF D8 FF`) byte signatures before writing to disk.
3. **Private File Storage:** Signatures are saved in a protected server directory outside public static roots (`uploads/signatures/`). Filenames are randomized with cryptographically secure UUIDs.
4. **Path Traversal Defense:** Filenames passed to the signature retrieval endpoint are sanitized using `path.basename` and verified against database voucher records.
5. **No Client Workflow Manipulation:** The status transition logic is entirely managed on the backend. Generic PATCH requests cannot alter voucher statuses or assign foreign employee IDs.
6. **Concurrency Safety:** Review actions use conditional database queries (`{ _id, status: PENDING_APPROVAL }`) preventing double approval or conflicting decisions.

---

## 12. Deployment Considerations & Next Steps

- **Durable File Storage:** For multi-instance cloud deployments (e.g., AWS ECS or Kubernetes), local disk storage (`uploads/signatures/`) can be substituted with an S3-compatible object store using pre-signed private URLs.
- **Email Notifications:** Can be integrated via SMTP / Amazon SES to notify employees upon voucher decision and notify Directors upon new submissions.
