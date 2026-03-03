# Quick Start Guide - MARS Application

## Prerequisites

Before running the application, make sure you have:
- **PHP 8.1+** installed
- **Composer** installed
- **Node.js 18+** and **npm** installed
- **MySQL 8.0+** installed and running
- **Git** (optional)

## Step-by-Step Setup

### 1. Backend Setup (Laravel)

Open a terminal/command prompt and navigate to the backend directory:

```bash
cd backend
```

#### Install PHP Dependencies

```bash
composer install
```

#### Configure Environment

```bash
# Copy the example environment file
copy .env.example .env

# On Linux/Mac:
# cp .env.example .env
```

#### Generate Application Key

```bash
php artisan key:generate
```

#### Configure Database

Open the `.env` file in the `backend` directory and update these lines:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=mars_db
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
```

**Important:** Create the database `mars_db` in MySQL first:
```sql
CREATE DATABASE mars_db;
```

#### Run Migrations

```bash
php artisan migrate
```

#### Seed Database (Create Default Users)

```bash
php artisan db:seed
```

This creates three default users:
- **Marketing Admin**: `admin@mars.com` / `password`
- **Approver**: `approver@mars.com` / `password`
- **Common User**: `user@mars.com` / `password`

#### Create Storage Link

```bash
php artisan storage:link
```

#### Start Backend Server

```bash
php artisan serve
```

The backend API will be running at: **http://localhost:8000**

---

### 2. Frontend Setup (React)

Open a **NEW** terminal/command prompt and navigate to the project root:

```bash
cd "e:\Surveyor Indonesia\surveyor-indonesia-dashboard"
```

#### Install Node Dependencies

```bash
npm install
```

#### Configure Environment

Create a `.env` file in the root directory (same level as `package.json`):

```env
VITE_API_URL=http://localhost:8000/api
```

#### Start Frontend Development Server

```bash
npm run dev
```

The frontend will be running at: **http://localhost:3000**

---

## Accessing the Application

1. Open your browser and go to: **http://localhost:3000**

2. You'll see the login screen. Use one of these credentials:

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

## Running Both Servers

You need to keep **both terminals open**:

1. **Terminal 1** - Backend (Laravel):
   ```bash
   cd backend
   php artisan serve
   ```

2. **Terminal 2** - Frontend (React):
   ```bash
   npm run dev
   ```

---

## Troubleshooting

### Backend Issues

**Problem: Composer not found**
- Install Composer from: https://getcomposer.org/

**Problem: PHP extension missing**
- Make sure PHP extensions are enabled: `openssl`, `pdo`, `mbstring`, `tokenizer`, `xml`, `ctype`, `json`

**Problem: Database connection error**
- Check MySQL is running
- Verify database credentials in `.env`
- Make sure database `mars_db` exists

**Problem: Migration errors**
- Drop and recreate database: `DROP DATABASE mars_db; CREATE DATABASE mars_db;`
- Run migrations again: `php artisan migrate:fresh --seed`

**Problem: Storage link error**
- Run: `php artisan storage:link`
- On Windows, you might need admin privileges

### Frontend Issues

**Problem: npm install fails**
- Clear cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`, then run `npm install` again

**Problem: API connection errors**
- Make sure backend is running on port 8000
- Check `.env` file has `VITE_API_URL=http://localhost:8000/api`
- Restart frontend server after changing `.env`

**Problem: CORS errors**
- Backend CORS is configured for `localhost:3000`
- Make sure you're accessing frontend on the correct port

**Problem: Login doesn't work**
- Check browser console for errors
- Verify backend is running
- Check API URL in `.env` file

---

## Default Ports

- **Backend API**: http://localhost:8000
- **Frontend App**: http://localhost:3000

If these ports are in use, you can change them:
- Backend: Edit `php artisan serve --port=8001` (or change in `.env`)
- Frontend: Edit `vite.config.ts` port setting

---

## Next Steps

After successful setup:

1. ✅ Login with one of the default users
2. ✅ Explore the dashboard
3. ✅ Create a new project
4. ✅ Test the approval workflow (as Approver)
5. ✅ Create SPH documents (as Marketing)
6. ✅ Upload project attachments
7. ✅ Use the Activity Feed

---

## Need Help?

- Check the main `README.md` for detailed documentation
- Check `SETUP.md` for more setup options
- Review `backend/README.md` for API documentation
