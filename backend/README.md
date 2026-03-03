# MARS Backend API

Laravel 10 backend API for MARS (Marketing Analyst Report System).

## Installation

1. Install dependencies:
```bash
composer install
```

2. Configure environment:
```bash
cp .env.example .env
php artisan key:generate
```

3. Set up database in `.env`:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=mars_db
DB_USERNAME=root
DB_PASSWORD=your_password
```

4. Run migrations:
```bash
php artisan migrate
php artisan db:seed
```

5. Create storage link:
```bash
php artisan storage:link
```

6. Start server:
```bash
php artisan serve
```

## API Base URL

Default: `http://localhost:8000/api`

## Authentication

The API uses Laravel Sanctum for authentication. Include the token in the Authorization header:

```
Authorization: Bearer {token}
```

## Key Features

- Role-based access control (Marketing, Common, Approver)
- Project management with approval workflow
- Client management
- SPH and Audiensi letter generation (PDF)
- Activity feed with likes and comments
- Calendar events
- Marketing plan kanban board
- File uploads for project attachments
- Notifications system
- Activity logging

## Database Structure

See `database/migrations/` for complete database schema.

## Controllers

All controllers are in `app/Http/Controllers/`:
- `AuthController` - Authentication
- `DashboardController` - Dashboard statistics
- `ProjectController` - Project CRUD and approval
- `ProjectAttachmentController` - File uploads
- `ClientController` - Client management
- `SphController` - SPH management
- `AudiensiController` - Audiensi letters
- `ActivityController` - Activity feed
- `CalendarController` - Calendar events
- `MarketingPlanController` - Kanban board
- `NotificationController` - Notifications
- `UserController` - User profile
- `PermissionController` - Permission management
- `ActivityLogController` - Activity logs

## Document Generation

SPH and Audiensi letters are generated as PDF using DomPDF. Templates are in `resources/views/sph/` and `resources/views/audiensi/`.

## File Storage

Uploaded files are stored in `storage/app/public/`. Make sure to run `php artisan storage:link` to create a symbolic link.

## CORS Configuration

CORS is configured in `config/cors.php`. Update allowed origins for production.
