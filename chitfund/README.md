# 💰 ChitFund Pro — Full-Stack Chit Fund Management System

A production-ready **MERN Stack** application for managing chit fund groups, members, collections, and draws.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Tailwind CSS, Recharts, React Router v6 |
| Backend | Node.js, Express.js, JWT Auth, MVC Pattern |
| Database | MongoDB, Mongoose ODM |
| Fonts | Sora (display), DM Sans (body) |
| Icons | Heroicons v2 |

---

## 📁 Folder Structure

```
chitfund/
├── backend/
│   ├── config/seed.js           # DB seeder
│   ├── controllers/             # Business logic
│   │   ├── authController.js
│   │   ├── memberController.js
│   │   ├── chitGroupController.js
│   │   ├── paymentController.js
│   │   ├── drawController.js
│   │   ├── dashboardController.js
│   │   └── reportController.js
│   ├── middleware/auth.js        # JWT middleware
│   ├── models/                  # Mongoose schemas
│   │   ├── User.js
│   │   ├── Member.js
│   │   ├── ChitGroup.js
│   │   ├── Payment.js
│   │   └── Winner.js
│   ├── routes/                  # Express routes
│   ├── .env
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── public/index.html
    ├── src/
    │   ├── components/
    │   │   └── common/           # Layout, Modal, StatCard, etc.
    │   ├── context/              # AuthContext, ThemeContext
    │   ├── pages/                # All page components
    │   ├── utils/api.js          # Axios instance
    │   ├── App.js
    │   ├── index.js
    │   └── index.css
    ├── package.json
    └── tailwind.config.js
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Backend Setup

```bash
cd backend
npm install

# Edit .env if needed (MongoDB URI etc.)
# Default: mongodb://localhost:27017/chitfund

# Seed the database with admin user + sample data
npm run seed

# Start backend (development)
npm run dev

# Start backend (production)
npm start
```

Backend runs on: **http://localhost:5000**

### 2. Frontend Setup

```bash
cd frontend
npm install

# Start development server
npm start
```

Frontend runs on: **http://localhost:3000**

### 3. Login Credentials

```
Email:    admin@chitfund.com
Password: admin123
```

---

## 🌟 Features

### ✅ Authentication
- JWT-based login with secure token storage
- Protected routes, role-based access (admin/superadmin)
- Dark mode toggle (persisted in localStorage)

### 📊 Dashboard
- Live stats: members, groups, monthly collection, pending
- Area chart: monthly collection trend (year-view)
- Pie chart: group status distribution
- Recent winners list

### 👥 Member Management
- Add / Edit / Deactivate members
- Fields: name, phone, email, address, Aadhar, join date
- Full-text search, pagination
- Payment history per member

### 🏦 Chit Group Management
- Create groups with all parameters
- Visual member fill progress bar
- Assign/remove members (auto-creates payment records)
- Commission-based prize calculation

### 💳 Payment System
- View payments by group + month
- Toggle paid/unpaid per member
- Bulk mark-as-paid with checkboxes
- Collection progress bar

### 🎰 Draw System
- Conduct lottery draw per group per month
- Randomly selects from eligible (non-winning) members
- One-win-per-member enforcement
- Winner spotlight with podium display

### 📈 Reports
- Winner history report
- Export to Excel: Payments, Winners, Members
- Filter by chit group

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/login | Admin login |
| POST | /api/auth/register | Register admin |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/change-password | Change password |

### Members
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/members | List members (search, paginate) |
| POST | /api/members | Create member |
| GET | /api/members/:id | Get single member |
| PUT | /api/members/:id | Update member |
| DELETE | /api/members/:id | Deactivate member |
| GET | /api/members/:id/payments | Member payment history |

### Chit Groups
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/chitgroups | List groups |
| POST | /api/chitgroups | Create group |
| GET | /api/chitgroups/:id | Get group details |
| PUT | /api/chitgroups/:id | Update group |
| DELETE | /api/chitgroups/:id | Delete group |
| POST | /api/chitgroups/:id/members | Add member to group |
| DELETE | /api/chitgroups/:id/members/:memberId | Remove member |

### Payments
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/payments/group/:groupId | Get payments for group |
| PUT | /api/payments/:id | Update payment status |
| PUT | /api/payments/bulk | Bulk update payments |
| GET | /api/payments/summary/:groupId/:monthIndex | Monthly summary |

### Draws
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/draws | All winners |
| POST | /api/draws/:groupId/conduct | Conduct draw |
| GET | /api/draws/:groupId/eligible | Eligible members |

### Reports & Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/dashboard/stats | Dashboard statistics |
| GET | /api/reports/winners | Winner history |
| GET | /api/reports/export?type= | Excel export |

---

## 🔐 Security Features
- bcrypt password hashing (12 rounds)
- JWT with expiry
- Protected API routes via middleware
- CORS configured for localhost:3000
- Input validation

---

## 🎨 UI Design System

- **Display Font**: Sora (headings, numbers)
- **Body Font**: DM Sans (text, labels)
- **Primary Color**: Brand purple (#c026d3)
- **Accent**: Gold (#f59e0b)
- **Dark Mode**: Class-based, full support
- **Components**: Cards, Badges, Modals, Tables, Charts

---

## 📦 Production Build

```bash
# Build frontend
cd frontend && npm run build

# Serve with backend (add static middleware to server.js)
# Or deploy separately (Vercel + Railway/Render)
```

---

## 🌐 Environment Variables

```env
# backend/.env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chitfund
JWT_SECRET=your_secure_secret_here
JWT_EXPIRE=7d
NODE_ENV=production
```
