# How to Run MARS Application

## Prerequisites Check

Before starting, make sure you have:
- ✅ PHP 8.1+ installed (`php -v`)
- ✅ Composer installed (`composer --version`)
- ✅ Node.js 18+ installed (`node -v`)
- ✅ MySQL running and database `mars_db` created

---

## Step 1: Setup Backend (Laravel)

### 1.1 Navigate to Backend Directory

```bash
cd backend
```

### 1.2 Install PHP Dependencies

```bash
composer install
```

**If you get errors**, try:
```bash
# Remove old vendor folder
Remove-Item -Recurse -Force vendor, composer.lock

# Install fresh
composer install
```

### 1.3 Configure Environment

```bash
# Copy environment file (if not exists)
copy .env.example .env
```

### 1.4 Generate Application Key

```bash
php artisan key:generate
```

### 1.5 Configure Database

Edit `backend/.env` file and set your database credentials:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=mars_db
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
```

**Important:** Create the database in MySQL first:
```sql
CREATE DATABASE mars_db;
```

### 1.6 Run Migrations

```bash
php artisan migrate
```

### 1.7 Seed Database (Create Default Users)

```bash
php artisan db:seed
```

This creates three default users:
- **Marketing Admin**: `admin@mars.com` / `password`
- **Approver**: `approver@mars.com` / `password`
- **Common User**: `user@mars.com` / `password`

### 1.8 Create Storage Link

```bash
php artisan storage:link
```

### 1.9 Start Backend Server

```bash
php artisan serve
```

✅ **Backend is now running at: http://localhost:8000**

**Keep this terminal window open!**

---

## Step 2: Setup Frontend (React)

### 2.1 Open a NEW Terminal Window

Navigate to the project root directory:

```bash
cd "e:\Surveyor Indonesia\surveyor-indonesia-dashboard"
```

### 2.2 Install Node Dependencies

```bash
npm install
```

### 2.3 Create Environment File

Create a `.env` file in the **root directory** (same level as `package.json`):

```env
VITE_API_URL=http://localhost:8000/api
```

### 2.4 Start Frontend Development Server

```bash
npm run dev
```

✅ **Frontend is now running at: http://localhost:3000**

**Keep this terminal window open too!**

---

## Step 3: Access the Application

1. Open your web browser
2. Go to: **http://localhost:3000**
3. You'll see the login screen

### Login Credentials

**Marketing Admin (Full Access):**
- Email: `admin@mars.com`
- Password: `password`

**Approver (Can Approve Projects):**
- Email: `approver@mars.com`
- Password: `password`

**Common User (Limited Access):**
- Email: `user@mars.com`
- Password: `password`

---

## Quick Command Summary

### Terminal 1 (Backend):
```bash
cd backend
composer install
copy .env.example .env
php artisan key:generate
# Edit .env with database credentials
php artisan migrate
php artisan db:seed
php artisan storage:link
php artisan serve
```

### Terminal 2 (Frontend):
```bash
cd "e:\Surveyor Indonesia\surveyor-indonesia-dashboard"
npm install
# Create .env file with: VITE_API_URL=http://localhost:8000/api
npm run dev
```

---

## Troubleshooting

### Backend Issues

**Problem: `composer install` fails**
```bash
# Clear composer cache
composer clear-cache
# Try again
composer install
```

**Problem: Database connection error**
- Check MySQL is running
- Verify database credentials in `.env`
- Make sure database `mars_db` exists

**Problem: Migration errors**
```bash
# Reset database
php artisan migrate:fresh --seed
```

**Problem: Storage link error**
```bash
# Delete existing link and recreate
php artisan storage:link
```

### Frontend Issues

**Problem: `npm install` fails**
```bash
# Clear npm cache
npm cache clean --force
# Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

**Problem: API connection errors**
- Make sure backend is running on port 8000
- Check `.env` file has correct `VITE_API_URL`
- Restart frontend after changing `.env`

**Problem: CORS errors**
- Backend CORS is configured for `localhost:3000`
- Make sure you're accessing frontend on the correct port

---

## Stopping the Application

To stop the servers:
- Press `Ctrl + C` in each terminal window
- Or close the terminal windows

---

## Default Ports

- **Backend API**: http://localhost:8000
- **Frontend App**: http://localhost:3000

If ports are in use, you can change them:
- Backend: `php artisan serve --port=8001`
- Frontend: Edit `vite.config.ts` port setting

---

## Next Steps After Login

1. ✅ Explore the dashboard
2. ✅ Create a new project
3. ✅ Test approval workflow (as Approver)
4. ✅ Create SPH documents (as Marketing)
5. ✅ Upload project attachments
6. ✅ Use Activity Feed
7. ✅ Test Calendar events
8. ✅ Use Marketing Plan Kanban board

---

## Need Help?

- Check `QUICK_START.md` for detailed setup
- Check `README.md` for project overview
- Check `backend/README.md` for API documentation
