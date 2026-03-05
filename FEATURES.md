# ScalpelDiary Features

## Overview
ScalpelDiary is a comprehensive surgical log management system designed for medical residency programs. It provides role-based access for residents, supervisors, and administrators.

## User Roles

### 1. Resident
Residents can manage their surgical logs and track their progress throughout their training years.

**Features:**
- ✅ Dashboard with key metrics and visualizations
- ✅ Add surgical logs with auto-suggestions
- ✅ View and filter logs by date, procedure type, and role
- ✅ Rate logs as supervisor (if Year 2+)
- ✅ View all rated logs with color indicators
- ✅ Comprehensive analytics with charts
- ✅ Export logs to PDF
- ✅ Change password
- ✅ Switch between year accounts

**Dashboard Metrics:**
- Total surgeries count
- Average supervisor rating
- Role distribution (pie chart)
- Recent surgeries list
- Surgery calendar view

**Analytics:**
- Total surgeries for year and current month
- Role distribution chart
- Procedure type distribution
- Top 3 procedures
- Average rating from all supervisors
- Average rating from senior supervisors
- Comments and feedback history

### 2. Supervisor
Supervisors can evaluate resident performance and track their supervision activities.

**Features:**
- ✅ Dashboard with supervision overview
- ✅ View unresponded logs requiring evaluation
- ✅ Rate logs (0-100 scale)
- ✅ Add comments to logs
- ✅ Comment without rating (if procedure not witnessed)
- ✅ View all ratings submitted
- ✅ Receive notifications for new log assignments
- ✅ Analytics by resident year

**Dashboard Metrics:**
- Total surgeries supervised
- Procedure type distribution
- Top procedures supervised
- Residents by year breakdown

### 3. Master (Administrator)
Masters have full system access to manage users and oversee the entire program.

**Features:**
- ✅ Create and manage all user accounts
- ✅ Assign resident year accounts (Year 1-5)
- ✅ Promote residents to new years
- ✅ Reset user passwords
- ✅ View all users in the system
- ✅ System-wide statistics

**Account Management:**
- Create residents with year assignment
- Create supervisors
- Create additional master accounts
- Reset passwords to default
- View user creation dates

## Core Features

### Surgical Log Management
- **Date tracking** with default to today
- **Patient information**: MRN, Age, Sex
- **Clinical details**: Diagnosis, Procedure
- **Procedure classification**: Elective, Semi-Elective, Emergency
- **Location tracking**: Y12HMC, ALERT
- **Role specification**: Primary Surgeon (Supervised), 1st/2nd/3rd Assistant
- **Supervisor assignment** from eligible users

### Auto-Suggestions
- Diagnosis field suggests previously entered diagnoses
- Procedure field suggests previously entered procedures
- Reduces data entry time and ensures consistency

### Rating System
- 0-100 scale for performance evaluation
- Optional comments for detailed feedback
- Comment-only option if procedure not witnessed
- Color-coded status indicators:
  - Gray: Pending evaluation
  - Green: Rated/Evaluated

### Notifications
- Supervisors notified when assigned to new logs
- Residents notified when logs are rated
- Real-time notification system
- Mark as read functionality

### Analytics & Reporting
- Interactive pie charts for data visualization
- Filterable by date range, procedure type, and role
- Export functionality to PDF
- Comprehensive statistics and trends

### Security
- JWT-based authentication
- Role-based access control (RBAC)
- Password change functionality
- Secure password hashing with bcrypt

### Data Filtering
- **Date ranges**: Current month, custom range, total year
- **Procedure types**: Elective, Semi-Elective, Emergency
- **Roles**: Primary, 1st/2nd/3rd Assistant
- **Status**: Pending, Rated, Commented

## Technical Features

### Frontend
- React 18 with TypeScript
- Responsive design with Tailwind CSS
- Interactive charts with Recharts
- Client-side routing with React Router
- State management with Zustand
- PDF generation with jsPDF

### Backend
- Node.js with Express
- TypeScript for type safety
- PostgreSQL database
- RESTful API architecture
- JWT authentication
- Input validation with Zod

### Database
- Relational data model
- Indexed queries for performance
- Foreign key constraints
- Cascading deletes for data integrity

## Workflow Examples

### Resident Workflow
1. Login to account
2. View dashboard with current year metrics
3. Add new surgical log with auto-suggestions
4. Assign supervisor for evaluation
5. View analytics and track progress
6. Export logs for portfolio

### Supervisor Workflow
1. Login to account
2. Receive notification of new log assignment
3. Review unresponded logs
4. Rate performance (0-100) and add comments
5. View history of all ratings submitted

### Master Workflow
1. Login to master account
2. Create new resident account with Year 1
3. Create supervisor accounts
4. Promote resident to Year 2 at end of year
5. Reset passwords as needed
6. Monitor system usage

## Future Enhancements
- CSV export functionality
- Multi-hospital support
- Advanced analytics with trends
- Peer comparison features
- Mobile application
- Email notifications
- Bulk import functionality
- Custom report generation
- Procedure competency tracking
- Milestone achievement system

## System Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- Node.js 18+ (for development)
- PostgreSQL 14+ (for database)

## Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance
- Fast page load times
- Optimized database queries
- Efficient data caching
- Responsive UI interactions
