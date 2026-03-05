# ScalpelDiary Project Structure

```
scalpel-diary/
├── README.md                          # Project overview and quick start
├── INSTALLATION.md                    # Detailed installation guide
├── FEATURES.md                        # Complete feature documentation
├── PROJECT_STRUCTURE.md               # This file
├── package.json                       # Root package configuration
├── .env.example                       # Environment variables template
├── .gitignore                         # Git ignore rules
├── setup.sh                           # Automated setup script
│
├── shared/                            # Shared types and utilities
│   └── types.ts                       # TypeScript type definitions
│
├── server/                            # Backend application
│   ├── package.json                   # Server dependencies
│   ├── tsconfig.json                  # TypeScript configuration
│   │
│   └── src/
│       ├── index.ts                   # Server entry point
│       │
│       ├── database/
│       │   ├── db.ts                  # Database connection
│       │   ├── migrate.ts             # Database migrations
│       │   └── seed.ts                # Database seeding
│       │
│       ├── middleware/
│       │   ├── auth.ts                # Authentication middleware
│       │   └── errorHandler.ts        # Error handling middleware
│       │
│       ├── routes/
│       │   ├── auth.ts                # Authentication routes
│       │   ├── users.ts               # User management routes
│       │   ├── logs.ts                # Surgical log routes
│       │   ├── analytics.ts           # Analytics routes
│       │   └── notifications.ts       # Notification routes
│       │
│       └── utils/
│           └── notifications.ts       # Notification utilities
│
└── client/                            # Frontend application
    ├── package.json                   # Client dependencies
    ├── tsconfig.json                  # TypeScript configuration
    ├── tsconfig.node.json             # Node TypeScript config
    ├── vite.config.ts                 # Vite configuration
    ├── tailwind.config.js             # Tailwind CSS configuration
    ├── postcss.config.js              # PostCSS configuration
    ├── index.html                     # HTML entry point
    │
    └── src/
        ├── main.tsx                   # React entry point
        ├── App.tsx                    # Main App component
        ├── index.css                  # Global styles
        │
        ├── api/
        │   └── axios.ts               # API client configuration
        │
        ├── store/
        │   └── authStore.ts           # Authentication state
        │
        ├── components/
        │   └── Layout.tsx             # Main layout component
        │
        └── pages/
            ├── Login.tsx              # Login page
            │
            ├── resident/              # Resident pages
            │   ├── Dashboard.tsx      # Resident dashboard
            │   ├── AddLog.tsx         # Add surgical log
            │   ├── LogsToRate.tsx     # Logs to rate (Year 2+)
            │   ├── RatedLogs.tsx      # View rated logs
            │   ├── Analytics.tsx      # Analytics page
            │   └── Settings.tsx       # Settings page
            │
            ├── supervisor/            # Supervisor pages
            │   ├── Dashboard.tsx      # Supervisor dashboard
            │   ├── UnrespondedLogs.tsx # Logs to evaluate
            │   └── RatingsDone.tsx    # Completed ratings
            │
            └── master/                # Master pages
                ├── Dashboard.tsx      # Master dashboard
                └── AccountManagement.tsx # User management
```

## Directory Descriptions

### Root Level
- Configuration files for the entire project
- Documentation files
- Setup scripts

### `/shared`
Contains TypeScript types and interfaces shared between frontend and backend:
- User roles and enums
- Data models
- API request/response types

### `/server`
Backend Node.js/Express application:

**`/database`**
- Database connection setup
- Migration scripts to create tables
- Seed scripts for initial data

**`/middleware`**
- JWT authentication
- Role-based authorization
- Error handling

**`/routes`**
- RESTful API endpoints
- Request validation
- Business logic

**`/utils`**
- Helper functions
- Notification system
- Email utilities (future)

### `/client`
Frontend React application:

**`/api`**
- Axios configuration
- API interceptors
- Request/response handling

**`/store`**
- Zustand state management
- Authentication state
- User session persistence

**`/components`**
- Reusable UI components
- Layout components
- Shared widgets

**`/pages`**
- Route-specific page components
- Organized by user role
- Feature-specific views

## Key Files

### Configuration Files

**`.env`**
- Database connection string
- JWT secret key
- Server port
- Email configuration

**`package.json` (root)**
- Workspace scripts
- Project metadata

**`package.json` (server)**
- Backend dependencies
- Server scripts

**`package.json` (client)**
- Frontend dependencies
- Build scripts

### Database Files

**`migrate.ts`**
Creates database schema:
- users table
- resident_years table
- surgical_logs table
- notifications table

**`seed.ts`**
Populates initial data:
- Default master account
- Sample supervisor accounts
- Sample resident account with years

### API Routes

**`/api/auth`**
- POST /login - User authentication
- POST /change-password - Password update

**`/api/users`**
- GET / - List all users (Master)
- POST / - Create user (Master)
- GET /resident-years/me - Get current user's years
- GET /resident-years/:id - Get specific resident years
- POST /resident-years - Create year account (Master)
- POST /reset-password/:id - Reset password (Master)
- GET /supervisors - Get eligible supervisors

**`/api/logs`**
- GET /my-logs - Get resident's logs
- POST / - Create new log
- GET /to-rate - Get logs to rate (Supervisor)
- POST /:id/rate - Rate a log
- GET /rated - Get rated logs
- GET /suggestions - Get auto-suggestions

**`/api/analytics`**
- GET /dashboard - Dashboard metrics
- GET /resident - Resident analytics
- GET /supervisor - Supervisor analytics

**`/api/notifications`**
- GET / - Get user notifications
- PUT /:id/read - Mark as read
- PUT /read-all - Mark all as read

## Data Flow

### Authentication Flow
1. User submits credentials to `/api/auth/login`
2. Server validates and returns JWT token
3. Token stored in Zustand store (persisted to localStorage)
4. Token included in all subsequent API requests
5. Server validates token on protected routes

### Log Creation Flow
1. Resident fills out log form
2. Auto-suggestions loaded from previous entries
3. Form submitted to `/api/logs`
4. Server creates log in database
5. Notification sent to assigned supervisor
6. Success message displayed to resident

### Rating Flow
1. Supervisor views unresponded logs
2. Selects log to rate
3. Submits rating and comment
4. Server updates log status
5. Notification sent to resident
6. Log appears in rated logs view

## Database Schema

### users
- id (UUID, primary key)
- email (unique)
- password (hashed)
- name
- role (RESIDENT, SUPERVISOR, MASTER)
- created_at, updated_at

### resident_years
- id (UUID, primary key)
- resident_id (foreign key → users)
- year (1-5)
- created_at

### surgical_logs
- id (UUID, primary key)
- resident_id (foreign key → users)
- year_id (foreign key → resident_years)
- date, mrn, age, sex
- diagnosis, procedure
- procedure_type, place_of_practice
- surgery_role
- supervisor_id (foreign key → users)
- status, rating, comment
- rated_at, created_at, updated_at

### notifications
- id (UUID, primary key)
- user_id (foreign key → users)
- message
- read (boolean)
- log_id (foreign key → surgical_logs)
- created_at

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Zustand** - State management
- **Recharts** - Data visualization
- **jsPDF** - PDF generation
- **Axios** - HTTP client
- **date-fns** - Date utilities
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **pg** - PostgreSQL client
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **Zod** - Validation
- **Nodemailer** - Email (future)

### Development Tools
- **tsx** - TypeScript execution
- **Vite** - Development server
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

## Development Workflow

1. **Setup**: Run `./setup.sh` or follow INSTALLATION.md
2. **Database**: Create and migrate database
3. **Development**: Run backend and frontend servers
4. **Testing**: Test features in browser
5. **Build**: Create production builds
6. **Deploy**: Deploy to hosting platform

## Deployment Considerations

### Environment Variables
- Set production DATABASE_URL
- Generate secure JWT_SECRET
- Configure email settings
- Set CLIENT_URL to production domain

### Database
- Use managed PostgreSQL service
- Set up automated backups
- Configure connection pooling
- Enable SSL connections

### Frontend
- Build optimized production bundle
- Serve static files via CDN
- Enable gzip compression
- Configure caching headers

### Backend
- Use process manager (PM2)
- Enable HTTPS
- Set up logging
- Configure CORS properly
- Implement rate limiting

## Security Best Practices

1. **Authentication**
   - Strong JWT secrets
   - Token expiration
   - Secure password hashing

2. **Authorization**
   - Role-based access control
   - Route protection
   - Data isolation

3. **Database**
   - Parameterized queries
   - Input validation
   - SQL injection prevention

4. **API**
   - CORS configuration
   - Rate limiting
   - Request validation

5. **Passwords**
   - Minimum length requirements
   - Complexity requirements
   - Secure reset mechanism
