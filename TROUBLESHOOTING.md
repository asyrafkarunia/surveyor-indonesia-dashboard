# Troubleshooting "Failed to fetch" Error

## Common Causes and Solutions

### 1. Missing Frontend .env File ⚠️ MOST COMMON

**Problem:** Frontend doesn't know where the backend API is.

**Solution:** Create `.env` file in the **root directory** (same level as `package.json`):

```env
VITE_API_URL=http://localhost:8000/api
```

**Steps:**
1. Create a file named `.env` in the project root
2. Add the line: `VITE_API_URL=http://localhost:8000/api`
3. **Restart the frontend server** (stop with Ctrl+C and run `npm run dev` again)

---

### 2. Backend Server Not Running

**Problem:** Backend API server is not running on port 8000.

**Solution:** 
1. Open a terminal
2. Navigate to backend: `cd backend`
3. Start server: `php artisan serve`
4. Verify it's running: Open http://localhost:8000 in browser

**Check:** You should see a JSON response or Laravel welcome page at http://localhost:8000

---

### 3. Wrong Port or URL

**Problem:** Backend is running on a different port.

**Solution:**
- Check what port backend is using (should show in terminal: "Server started on http://127.0.0.1:8000")
- Update `.env` file: `VITE_API_URL=http://localhost:8000/api` (change 8000 if different)

---

### 4. CORS Issues

**Problem:** Browser blocking cross-origin requests.

**Solution:** 
- CORS is already configured in `backend/config/cors.php`
- Make sure frontend is on `localhost:3000` and backend on `localhost:8000`
- Clear browser cache and try again

---

### 5. Network/Firewall Issues

**Problem:** Firewall or antivirus blocking connection.

**Solution:**
- Temporarily disable firewall/antivirus
- Check Windows Firewall settings
- Try accessing http://localhost:8000/api directly in browser

---

## Quick Fix Checklist

✅ **Step 1:** Create `.env` file in root directory:
```
VITE_API_URL=http://localhost:8000/api
```

✅ **Step 2:** Verify backend is running:
```bash
cd backend
php artisan serve
```
Should see: "Laravel development server started: http://127.0.0.1:8000"

✅ **Step 3:** Restart frontend server:
```bash
# Stop current server (Ctrl+C)
npm run dev
```

✅ **Step 4:** Test API connection:
- Open browser: http://localhost:8000/api
- Should see JSON response or error (not "connection refused")

✅ **Step 5:** Check browser console:
- Open Developer Tools (F12)
- Go to Console tab
- Look for specific error messages
- Go to Network tab and check failed requests

---

## Testing the Connection

### Test Backend API:
```bash
# In browser or terminal
curl http://localhost:8000/api
```

### Test Login Endpoint:
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mars.com","password":"password"}'
```

---

## Still Not Working?

1. **Check browser console** (F12 → Console tab) for specific errors
2. **Check Network tab** (F12 → Network tab) to see failed requests
3. **Verify both servers are running:**
   - Backend: http://localhost:8000
   - Frontend: http://localhost:3000
4. **Try accessing API directly:** http://localhost:8000/api/login (should show method not allowed, not connection refused)

---

## Common Error Messages

- **"Failed to fetch"** → Backend not running or wrong URL
- **"CORS error"** → Check cors.php configuration
- **"Connection refused"** → Backend server not started
- **"404 Not Found"** → Wrong API URL in .env
- **"Network Error"** → Firewall or network issue
