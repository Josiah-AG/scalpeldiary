# ScalpelDiary

A comprehensive surgical training management system for residents and supervisors.

## 🌟 Features

- **Procedure Logging**: Track surgical procedures with detailed ratings and feedback
- **Presentation Management**: Assign and track resident presentations
- **Progress Tracking**: Monitor resident progress against specialty requirements
- **Rotation Management**: Manage yearly rotation schedules
- **Activity Scheduling**: Coordinate monthly activities and duties
- **Multi-Role Support**: Resident, Supervisor, Chief Resident, Master, and Management roles
- **Analytics Dashboard**: Comprehensive analytics and reporting
- **Profile Management**: User profiles with picture uploads

## 🏗️ Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- React Router for navigation
- Zustand for state management
- Axios for API calls
- date-fns for date handling
- Lucide React for icons

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL database
- JWT authentication
- bcrypt for password hashing
- AWS S3 for file storage

## 📋 Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher
- npm or yarn
- AWS account (for S3 storage)

## 🚀 Quick Start (Development)

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/scalpeldiary.git
cd scalpeldiary
```

### 2. Install dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 3. Set up environment variables

```bash
# Backend (.env in project root)
cp server/.env.example .env
# Edit .env with your database and AWS credentials

# Frontend
cp client/.env.example client/.env
# Edit if needed (defaults to localhost:3000)
```

### 4. Set up the database

```bash
# Create PostgreSQL database
createdb scalpeldiary

# Run migrations
cd server
npm run migrate

# Seed initial data (creates master account)
npm run seed
```

### 5. Start development servers

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

Visit `http://localhost:5173` and login with:
- Email: `master@scalpeldiary.com`
- Password: `password123`

## 📦 Production Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions for:
- Cloudflare Pages (Frontend)
- Railway (Backend + Database)
- AWS S3 (File Storage)

## 🔑 Default Accounts

After running seed:
- **Master**: `master@scalpeldiary.com` / `password123`

Create additional accounts through the Master dashboard.

## 📁 Project Structure

```
scalpeldiary/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand state management
│   │   └── api/           # API client
│   └── public/            # Static assets
├── server/                # Backend Express application
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Express middleware
│   │   ├── database/      # Database utilities
│   │   └── index.ts       # Server entry point
│   └── dist/              # Compiled JavaScript
├── shared/                # Shared types and utilities
└── DEPLOYMENT_GUIDE.md    # Deployment instructions
```

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- CORS protection
- Environment variable configuration
- Secure file uploads to S3

## 🛠️ Available Scripts

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed initial data

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 📊 Database Schema

The application uses PostgreSQL with the following main tables:
- `users` - User accounts and profiles
- `resident_years` - Resident year tracking
- `surgical_logs` - Procedure logs
- `presentations` - Presentation records
- `presentation_assignments` - Assigned presentations
- `yearly_rotations` - Rotation schedules
- `daily_activities` - Activity assignments
- `rotation_categories` - Rotation types
- `activity_categories` - Activity types
- `academic_years` - Academic year configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For issues and questions:
1. Check the [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
2. Review server logs
3. Check browser console for frontend errors

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Email notifications
- [ ] Advanced analytics
- [ ] Export reports to PDF
- [ ] Multi-institution support
- [ ] Integration with hospital systems

---

**Built with ❤️ for surgical education**
