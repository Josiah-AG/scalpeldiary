# ScalpelDiary Installation Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** or **yarn** package manager

## Step 1: Database Setup

1. Install and start PostgreSQL

2. Create a new database:
```bash
psql -U postgres
CREATE DATABASE scalpeldiary;
\q
```

3. Note your database credentials (username, password, host, port)

## Step 2: Clone and Install

1. Navigate to the project directory:
```bash
cd scalpel-diary
```

2. Install all dependencies:
```bash
npm run install:all
```

This will install dependencies for the root, client, and server.

## Step 3: Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` with your configuration:
```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/scalpeldiary
JWT_SECRET=your-secret-key-here
PORT=3000
CLIENT_URL=http://localhost:5173
```

## Step 4: Database Migration

Run the database migration to create tables:
```bash
npm run db:migrate
```

## Step 5: Seed Database (Optional)

Seed the database with default accounts:
```bash
npm run db:seed
```

This creates:
- Master: master@scalpeldiary.com / password123
- Supervisor: supervisor1@scalpeldiary.com / password123
- Resident: resident@scalpeldiary.com / password123

## Step 6: Start the Application

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
npm run dev:server
```

**Terminal 2 - Frontend:**
```bash
npm run dev:client
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## Step 7: Login

Open your browser and navigate to http://localhost:5173

Use one of the seeded accounts to login:
- Email: master@scalpeldiary.com
- Password: password123

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in .env file
- Ensure database exists: `psql -U postgres -l`

### Port Already in Use
- Change PORT in .env file
- Kill process using the port: `lsof -ti:3000 | xargs kill`

### Module Not Found Errors
- Delete node_modules and reinstall: `rm -rf node_modules && npm run install:all`

## Production Build

To build for production:

```bash
# Build frontend
npm run build:client

# Build backend
npm run build:server
```

## Next Steps

1. Change default passwords for all accounts
2. Configure email settings for notifications (optional)
3. Customize the application as needed
4. Set up proper backup procedures for the database

## Support

For issues or questions, please refer to the README.md file or create an issue in the repository.
