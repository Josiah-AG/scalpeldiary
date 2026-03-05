# Fix White Screen Issue

## Quick Fix Steps

### Step 1: Stop the Frontend Server
In the terminal running the frontend (showing Vite output), press:
```
Ctrl + C
```

### Step 2: Clear Browser Cache and Storage
Open your browser console (F12) and run:
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

Or manually:
1. Open DevTools (F12)
2. Go to Application tab
3. Clear Storage → Clear site data

### Step 3: Restart Frontend Server
```bash
cd client
npm run dev
```

### Step 4: Open Fresh Browser Tab
Go to: http://localhost:5173

---

## If Still White Screen

### Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for any red errors
4. Share the error message

### Common Issues

**Issue: "Cannot read property of undefined"**
- Solution: Clear localStorage and reload

**Issue: Module not found**
- Solution: Reinstall dependencies
```bash
cd client
rm -rf node_modules
npm install
npm run dev
```

**Issue: Zustand persist error**
- The auth store was updated to use explicit storage
- Clear localStorage and reload

---

## Manual Test

If the issue persists, test with a simple component:

1. Temporarily rename `src/App.tsx` to `src/App.backup.tsx`
2. Create a simple test:

```bash
cat > client/src/App.tsx << 'EOF'
function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>✅ React is Working!</h1>
      <p>If you see this, the frontend is running correctly.</p>
    </div>
  );
}

export default App;
EOF
```

3. If this works, the issue is in the original App.tsx
4. Restore the original: `mv client/src/App.backup.tsx client/src/App.tsx`

---

## Debug Checklist

- [ ] Frontend server is running (check terminal)
- [ ] No errors in browser console (F12)
- [ ] LocalStorage cleared
- [ ] Browser cache cleared
- [ ] Tried different browser
- [ ] Dependencies installed (`npm install` in client folder)
- [ ] Backend server is running (port 3000)

---

## Most Likely Solution

The white screen is usually caused by:
1. **Cached auth state** - Clear localStorage
2. **Frontend not restarted** - Restart the dev server
3. **Browser cache** - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

Try these in order and the issue should resolve!
