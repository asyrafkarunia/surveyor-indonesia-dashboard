# MARS Setup Guide

## Quick Start

### 1. Backend Setup (Laravel)

```bash
cd backend

# Install dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure database in .env file
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=mars_db
# DB_USERNAME=root
# DB_PASSWORD=your_password

# Run migrations
php artisan migrate

# Seed database with default users
php artisan db:seed

# Create storage link
php artisan storage:link

# Start server
php artisan serve
```

### 2. Frontend Setup (React)

```bash
# Install dependencies
npm install

# Create .env file in root directory
echo "VITE_API_URL=http://localhost:8000/api" > .env

# Start development server
npm run dev
```

## Default Users

After running the seeder, you can login with:

1. **Marketing Admin**
   - Email: `admin@mars.com`
   - Password: `password`
   - Role: Marketing (Full access)

2. **Approver**
   - Email: `approver@mars.com`
   - Password: `password`
   - Role: Approver (Can approve projects)

3. **Common User**
   - Email: `user@mars.com`
   - Password: `password`
   - Role: Common (Limited access)

## Features Implemented

### ✅ Authentication & Authorization
- User login/logout
- Role-based access control (Marketing, Common, Approver)
- Token-based authentication with Laravel Sanctum

### ✅ Dashboard
- Revenue statistics
- SPH issued count
- Win rate calculation
- Running projects count
- Revenue chart (projection vs realization)
- Top 5 projects
- Recent activities

### ✅ Project Management
- Create, read, update, delete projects
- Project monitoring with filters
- Project detail view
- File attachments upload/download
- Project comments
- Approval workflow (for Approvers)

### ✅ Client Management
- Client CRUD operations
- Client history
- Client activities tracking
- Client detail view

### ✅ SPH Management
- Create SPH documents
- Generate PDF documents
- SPH approval workflow
- SPH list with filters

### ✅ Surat Audiensi
- Create audiensi letters
- Generate PDF documents
- Template management
- Letter list

### ✅ Activity Feed
- Create activities
- Like activities
- Comment on activities
- File attachments
- Activity filtering

### ✅ Calendar
- Create calendar events
- View events by date range
- Update/delete events

### ✅ Marketing Plan (Kanban)
- Kanban board with 5 columns
- Create marketing tasks
- Move tasks between columns
- Task assignment

### ✅ Notifications
- View notifications
- Mark as read
- Mark all as read

### ✅ Settings
- User profile management
- Permission management (Marketing only)
- Activity logs (Marketing only)

## API Documentation

All API endpoints are documented in the `routes/api.php` file. The API follows RESTful conventions.

### Authentication
All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer {token}
```

### Common Endpoints

**Dashboard:**
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/revenue?year=2024` - Get revenue data
- `GET /api/dashboard/top-projects` - Get top 5 projects
- `GET /api/dashboard/recent-activities` - Get recent activities

**Projects:**
- `GET /api/projects` - List projects (with filters)
- `POST /api/projects` - Create project
- `GET /api/projects/{id}` - Get project details
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project
- `POST /api/projects/{id}/approve` - Approve project (Approver only)
- `POST /api/projects/{id}/reject` - Reject project (Approver only)
- `POST /api/projects/{id}/attachments` - Upload attachment
- `GET /api/projects/{id}/attachments/{attachmentId}/download` - Download attachment

## Troubleshooting

### Backend Issues

1. **Migration errors:**
   - Make sure database exists
   - Check database credentials in .env
   - Run `php artisan migrate:fresh` to reset database

2. **Storage link not working:**
   - Run `php artisan storage:link`
   - Check permissions on storage directory

3. **CORS errors:**
   - Check `config/cors.php` settings
   - Ensure frontend URL is in allowed origins

### Frontend Issues

1. **API connection errors:**
   - Check `VITE_API_URL` in .env file
   - Ensure backend server is running
   - Check browser console for CORS errors

2. **Authentication issues:**
   - Clear localStorage
   - Check token expiration
   - Verify user credentials

## Production Deployment

### Backend
1. Set `APP_ENV=production` in .env
2. Set `APP_DEBUG=false`
3. Run `composer install --optimize-autoloader --no-dev`
4. Run `php artisan config:cache`
5. Run `php artisan route:cache`
6. Run `php artisan view:cache`

### Frontend
1. Run `npm run build`
2. Serve the `dist` folder with a web server (nginx, Apache, etc.)
3. Configure API URL in production environment

## Support

For issues or questions, please refer to the main README.md file or contact the development team.
