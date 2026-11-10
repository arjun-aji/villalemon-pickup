# VillaLemon Pickup
> **Pickup & Driver Management System**  
> Professional travel operations platform for trips, driver enrollment, customer collections, expenses, settlements, analytics, and monthly Excel workbooks.

---

## 📸 Reference & System Design
VillaLemon Pickup is built strictly referencing the production management dashboard and driver mobile portal design:
- **Brand Navy & Emerald Accent Palette**: `#10243A` (Primary Navy), `#0B1B2D` (Sidebar Navy), `#07966E` (Primary Green), `#16A36A` (Secondary Green), `#F06445` (Expense Red), `#F5B544` (Warning Amber).
- **Independent Infrastructure**: Independent PostgreSQL database schema, independent auth tokens, independent backend, zero dependency on `villalemon.in`.
- **Dual Portal Separation**: Dedicated Admin Dashboard and dedicated Driver Mobile Portal with isolated routes and role permissions.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ & npm installed

### 1. Install Dependencies
```bash
# Frontend dependencies
cd frontend && npm install

# Backend dependencies
cd ../backend && npm install
```

### 2. Start the Frontend Development Server
```bash
cd frontend
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### 3. Start the Backend API Server
```bash
cd backend
npm run dev
```
The Express backend starts on **[http://localhost:3001](http://localhost:3001)**. Health check: [http://localhost:3001/health](http://localhost:3001/health).

---

## 🔑 Authentication & Live Supabase Setup

VillaLemon Pickup is freshly connected to your independent Supabase project (`cnvknruutfrmwyrbhdjq.supabase.co`) with zero dummy data and strict security:

### 1. Run the Database Migration
In your Supabase project dashboard:
1. Open the **SQL Editor** tab.
2. Open `supabase/migrations/001_initial_schema.sql` from this repository.
3. Paste the contents into the SQL Editor and click **Run**.
This creates all tables (`profiles`, `driver_employees`, `trips`, `trip_enrollments`, `trip_expenses`, `trip_settlements`, `trip_status_history`, `monthly_reports`), security triggers, and Row Level Security policies.

### 2. Setup Master Admin Account
1. Open **[http://localhost:5173/admin/login](http://localhost:5173/admin/login)**.
2. Click the **Setup Master Admin** tab.
3. Enter your chosen Admin Email/Username, Full Name, and a strong password (minimum 8 characters).
4. Click **Create Master Admin**.
5. You are immediately logged in to the live Admin Overview.

### 3. Adding Driver Accounts
No hardcoded drivers exist. The Admin has full control:
1. In the Admin Dashboard, navigate to **Driver Employees** (`/admin/drivers`).
2. Click **+ Add Driver**.
3. Enter the driver's Name, Phone, Vehicle Number, Username, and secure Initial Password.
4. The driver can now log in at **[http://localhost:5173/driver/login](http://localhost:5173/driver/login)** with their assigned credentials.

---

## 🔄 Verified Primary End-to-End Workflow

1. **Portal Selection (`/`)**: Choose between **Admin Login** or **Driver Login**.
2. **Admin Login (`/admin/login`)**:
   - Access **Pickup Overview** (`/admin/dashboard`) showing live KPI cards, charts (Revenue vs Expenses, Expense Breakdown, Status), and Recent Trips table.
3. **Driver Management (`/admin/drivers`)**:
   - Click **+ Add Driver** to create an employee with auto-generated ID, login username, vehicle number, and initial password.
   - Activate, deactivate, or reset credentials.
4. **Create & Publish Trip (`/admin/trips/create`)**:
   - Enter Customer Details (Name, Phone, Date, Time, Route, Flight).
   - Enter Financials (Amount to Collect, Driver Charge, Additional Charges).
   - Placard automatically previews (`VARKALA HOLIDAYS - CUSTOMER NAME`) with 1-click copy.
   - Choose **Assign directly** or **Open for Driver Enrollment**.
5. **Driver Enrollment (`/driver/available-trips`)**:
   - Log in as a driver (e.g. `suresh`).
   - Browse open trips.
   - Click **ENROLL IN TRIP**.
6. **Admin Approves Enrollment (`/admin/enrollment-requests`)**:
   - Review pending driver requests.
   - Click **Approve** (automatically assigns trip to driver and notifies system).
7. **Driver Execution & Expense Entry**:
   - View assigned trip in **My Upcoming Trips** (`/driver/upcoming-trips`).
   - View placard details (`/driver/trips/:tripId`).
   - Click **Start Trip**, then **Complete Trip & Enter Expenses** (`/driver/trips/:tripId/expenses`).
   - Enter Petrol Expense (e.g. ₹900), Other Expense (e.g. ₹200 for parking/toll), and Actual Cash Returned (e.g. ₹1,400).
   - Live reconciliation formula validates:
     $$\text{Net Profit} = \text{Collection} - \text{Petrol} - \text{Driver Charge} - \text{Other Expenses}$$
     $$\text{Expected Return} = \text{Collection} - \text{Petrol} - \text{Driver Charge} - \text{Other Expenses}$$
     $$\text{Settlement Difference} = \text{Expected Return} - \text{Actual Cash Returned}$$
   - Click **Save Expenses**.
8. **Live Admin Dashboard Update**:
   - Admin KPI metrics, recent trips, and settlements immediately update.
9. **Settlement Verification (`/admin/settlements`)**:
   - Admin reviews driver cash returned vs expenses.
   - Click **Verify** to lock the record and maintain audit history.
10. **Monthly Excel Report (`/admin/monthly-reports`)**:
    - Click **Excel** to download a complete 5-sheet workbook formatted with ExcelJS:
      1. `Monthly Summary`
      2. `Trip Details`
      3. `Driver Summary`
      4. `Expense Breakdown`
      5. `Settlement Details`

---

## 🗄️ Supabase PostgreSQL Setup (Production Live Database)

To link to a live Supabase project:
1. Create a free project at [supabase.com](https://supabase.com).
2. Open the Supabase **SQL Editor** and execute the migration file:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
3. Update environment variables in `frontend/.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Update environment variables in `backend/.env`:
   ```env
   PORT=3001
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_ANON_KEY=your-anon-key
   ```

---

## 📦 Project File Structure

```
villalemon-pickup/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/               # KPICard, StatusBadge, Modal, ConfirmDialog, EmptyState, SearchInput, LoadingSpinner
│   │   │   └── layout/           # AdminSidebar, AdminLayout, DriverLayout
│   │   ├── pages/
│   │   │   ├── auth/             # LandingPage, AdminLogin, DriverLogin
│   │   │   ├── admin/            # AdminDashboard, TripsPage, AddTripPage, DriversPage, EnrollmentRequestsPage, SettlementsPage, ProfitAnalyticsPage, MonthlyReportsPage, SettingsPage
│   │   │   └── driver/           # DriverDashboard, DriverAvailableTrips, DriverUpcomingTrips, DriverEnrolledTrips, DriverTripDetail, DriverExpenseEntry, DriverCompletedTrips, DriverSettlements, DriverProfile
│   │   ├── context/              # AuthContext (Role & session management)
│   │   ├── services/             # tripService, driverService, enrollmentService, expenseService, settlementService
│   │   ├── utils/                # formatINR, formatINRCompact, formatDate, calculateFinancials, placard generation
│   │   ├── types/                # Complete TypeScript domain interfaces
│   │   ├── lib/                  # supabase client & mock repository
│   │   ├── routes/               # ProtectedRoute
│   │   ├── App.tsx               # Application routing table
│   │   └── index.css             # Tailwind custom components & design tokens
│   ├── tailwind.config.js        # Brand color palette configuration
│   ├── vite.config.ts
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── middleware/           # auth.ts (Supabase token validation, requireAdmin, requireDriver)
│   │   ├── routes/               # auth, trips, drivers, enrollments, expenses, settlements, reports, analytics
│   │   └── server.ts             # Express application entrypoint
│   ├── dist/                     # Compiled backend JavaScript
│   ├── tsconfig.json
│   └── package.json
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql # Complete PostgreSQL schema, RLS policies, triggers, indexes
│   └── seed.sql
├── package.json                  # Root runner scripts
├── .env.example
├── .gitignore
└── README.md
```

---

## 🚢 Deployment

### Frontend (Vercel)
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### Backend (Railway / Render / DigitalOcean)
- Root Directory: `backend`
- Build Command: `npm run build`
- Start Command: `npm start`
- Environment Variables: `PORT`, `FRONTEND_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
