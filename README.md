# MARS - Marketing Analyst Report System

A comprehensive full-stack application for monitoring and controlling marketing team activities, built with React (frontend) and Laravel (backend).

## Features

### Core Functionality
- **Data Centralization**: Combines all client data, marketing activities, and bid documents (SPH) and audience letters (Surat Audiensi) in one integrated platform
- **Administrative Process Efficiency**: Automates the creation, approval, and archiving of SPH based on clear business logic
- **Cross-Divisional Collaboration**: Provides formal mechanism for operational, finance, and other divisions to provide input
- **Enhanced Analytical Capabilities**: Real-time data and dashboards for fact-based managerial decisions

### Role-Based Access Control
- **Marketing (Administrator)**: Full access to all features including SPH Management, Surat Audiensi, Marketing Plan, and administrative functions
- **Common User** (Operation Team, Finance Team, HR Team): Access to Dashboard, Monitoring Proyek, Kalendar Aktivitas, and Activity Feed
- **Approver** (Senior Manager, General Manager): Can approve projects and view clients in addition to common user features

## Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS

### Backend
- Laravel 10
- PHP 8.1+
- MySQL
- Laravel Sanctum (Authentication)

## Installation

### Prerequisites
- Node.js 18+ and npm
- PHP 8.1+
- Composer
- MySQL 8.0+

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install PHP dependencies:
```bash
composer install
```

3. Copy environment file:
```bash
cp .env.example .env
```

4. Generate application key:
```bash
php artisan key:generate
```

5. Configure database in `.env`:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=mars_db
DB_USERNAME=root
DB_PASSWORD=your_password
```

6. Run migrations:
```bash
php artisan migrate
```

7. Create storage link:
```bash
php artisan storage:link
```

8. Start the Laravel server:
```bash
php artisan serve
```

The backend API will be available at `http://localhost:8000`

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file in the root directory:
```env
VITE_API_URL=http://localhost:8000/api
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Project Structure

```
├── backend/                 # Laravel backend
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/    # API controllers
│   │   │   └── Middleware/     # Custom middleware
│   │   └── Models/             # Eloquent models
│   ├── database/
│   │   └── migrations/         # Database migrations
│   ├── routes/
│   │   └── api.php             # API routes
│   └── resources/
│       └── views/              # PDF templates
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── contexts/           # React contexts (Auth)
│   └── services/           # API service layer
└── components/             # Legacy components (to be migrated)
```

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/revenue` - Get revenue data
- `GET /api/dashboard/top-projects` - Get top 5 projects
- `GET /api/dashboard/recent-activities` - Get recent activities

### Projects
- `GET /api/projects` - List projects (with filters)
- `POST /api/projects` - Create project
- `GET /api/projects/{id}` - Get project details
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project
- `POST /api/projects/{id}/approve` - Approve project (Approver only)
- `POST /api/projects/{id}/reject` - Reject project (Approver only)

### Clients
- `GET /api/clients` - List clients
- `POST /api/clients` - Create client
- `GET /api/clients/{id}` - Get client details
- `PUT /api/clients/{id}` - Update client
- `GET /api/clients/{id}/history` - Get client history

### SPH Management
- `GET /api/sph` - List SPH documents
- `POST /api/sph` - Create SPH
- `GET /api/sph/{id}` - Get SPH details
- `POST /api/sph/{id}/generate` - Generate SPH PDF
- `POST /api/sph/{id}/approve` - Approve SPH

### Surat Audiensi
- `GET /api/audiensi` - List audiensi letters
- `POST /api/audiensi` - Create audiensi letter
- `POST /api/audiensi/{id}/generate` - Generate audiensi PDF
- `GET /api/audiensi-templates` - List templates

### Activities
- `GET /api/activities` - List activities
- `POST /api/activities` - Create activity
- `POST /api/activities/{id}/like` - Like activity
- `POST /api/activities/{id}/comment` - Comment on activity

### Calendar
- `GET /api/calendar/events` - Get calendar events
- `POST /api/calendar/events` - Create event
- `PUT /api/calendar/events/{id}` - Update event
- `DELETE /api/calendar/events/{id}` - Delete event

### Marketing Plan
- `GET /api/marketing-plan/columns` - Get kanban columns
- `POST /api/marketing-plan/tasks` - Create task
- `PUT /api/marketing-plan/tasks/{id}` - Update task
- `PUT /api/marketing-plan/tasks/{id}/move` - Move task to different column

## Default Users

After running migrations, you can create users via the registration endpoint or directly in the database. Example roles:
- `marketing` - Marketing team (Administrator)
- `common` - Common users (Operation, Finance, HR)
- `approver` - Approvers (Senior Manager, General Manager)

## Development

### Running Tests
```bash
# Backend
cd backend
php artisan test

# Frontend
npm test
```

### Building for Production
```bash
# Frontend
npm run build

# Backend
cd backend
composer install --optimize-autoloader --no-dev
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## License

MIT License

## Support

For issues and questions, please contact the development team.
