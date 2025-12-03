# PWA Offline Functionality - Quick Testing Guide

## Quick Start

### 1. Generate Icons (One-Time Setup)
```bash
# Open the icon generator in your browser
open public/create-icons.html
```
- Click "Download icon-192.png"
- Click "Download icon-512.png"
- Save both files to the `public/` directory

### 2. Start Development Server
```bash
# Clear cache (important!)
rm -rf .next

# Start server on port 3002
PORT=3002 npm run dev
```

### 3. Test Service Worker Registration

#### Open Browser DevTools (Chrome/Edge)
1. Navigate to `http://localhost:3002/m/tech/dashboard`
2. Open DevTools (F12 or Cmd+Option+I)
3. Go to **Application** tab → **Service Workers**
4. You should see:
   - ✅ Service Worker registered at `/sw.js`
   - Status: **Activated and Running**
   - Scope: `http://localhost:3002/`

#### Check Console Logs
You should see:
```
Service Worker registered successfully: http://localhost:3002/
```

### 4. Test Offline Caching

#### Method 1: DevTools Offline Mode
1. Navigate to mobile dashboard
2. Open DevTools → **Network** tab
3. Check **"Offline"** checkbox (top of Network panel)
4. Refresh the page (Cmd+R or Ctrl+R)
5. ✅ Page should load from cache
6. Check Network tab - requests should show "ServiceWorker" as source

#### Method 2: Airplane Mode (Real Device)
1. Deploy to production or use ngrok for HTTPS tunnel
2. Visit app on mobile device
3. Ensure page loads and caches
4. Enable Airplane Mode
5. Reload app - should still work

### 5. Inspect Cache Storage

#### View Cached Resources
1. DevTools → **Application** tab
2. Expand **Cache Storage** in sidebar
3. Click on `crm-ai-pro-mobile-v1`
4. You should see cached URLs:
   - `/m/tech/dashboard`
   - `/m/sales/dashboard`
   - `/m/owner/dashboard`
   - `/m/office/dashboard`
   - `/manifest.json`
   - `/login`

### 6. Test PWA Installation

#### Desktop (Chrome/Edge)
1. Visit `http://localhost:3002/m/tech/dashboard`
2. Look for install icon in address bar
3. Click to install
4. App opens in standalone window (no browser UI)

#### iOS Safari
1. Deploy to HTTPS domain (required for iOS)
2. Open Safari on iPhone/iPad
3. Visit mobile dashboard
4. Tap **Share** button (box with arrow)
5. Tap **"Add to Home Screen"**
6. Tap **"Add"**
7. App icon appears on home screen
8. Open app - runs fullscreen without Safari UI

#### Android Chrome
1. Deploy to HTTPS domain or use localhost
2. Open Chrome on Android
3. Visit mobile dashboard
4. Look for **"Install app"** banner or menu option
5. Tap **"Install"**
6. App icon appears on home screen
7. Open app - runs in standalone mode

---

## Verification Checklist

### Service Worker
- [ ] Service worker registered in DevTools
- [ ] Status shows "Activated and running"
- [ ] Console shows success message
- [ ] No registration errors in console

### Caching
- [ ] Cache storage contains "crm-ai-pro-mobile-v1"
- [ ] All dashboard URLs are cached
- [ ] Page loads when offline
- [ ] Network tab shows "ServiceWorker" as source

### Manifest
- [ ] Manifest.json loads at `/manifest.json`
- [ ] DevTools → Application → Manifest shows no errors
- [ ] Theme colors display correctly
- [ ] Icons referenced (even if placeholder)

### Install Prompt
- [ ] Install icon appears in browser
- [ ] Can install app to home screen/desktop
- [ ] Installed app opens in standalone mode
- [ ] App icon visible (placeholder or custom)

### Offline Functionality
- [ ] Dashboard loads offline
- [ ] UI renders correctly
- [ ] Theme persists
- [ ] Navigation works (cached routes)
- [ ] API calls fail gracefully (expected)

---

## Common Issues & Solutions

### Issue: Service Worker Not Registering
**Symptoms:** No service worker in DevTools, console errors

**Solutions:**
1. Check that `/sw.js` is accessible:
   ```
   curl http://localhost:3002/sw.js
   ```
2. Clear browser cache and hard reload (Cmd+Shift+R)
3. Unregister old service worker:
   - DevTools → Application → Service Workers
   - Click "Unregister"
   - Reload page
4. Check for JavaScript errors in console

### Issue: Cache Not Working
**Symptoms:** Page doesn't load offline, cache storage empty

**Solutions:**
1. Visit dashboard while online to populate cache
2. Check Cache Storage in DevTools
3. Verify fetch event in service worker:
   - DevTools → Application → Service Workers
   - Check "Update on reload"
   - Reload page
4. Ensure URLs match exactly (trailing slashes matter)

### Issue: Install Prompt Not Showing
**Symptoms:** No install icon, can't add to home screen

**Solutions:**
1. Verify manifest.json is valid:
   - DevTools → Application → Manifest
   - Check for errors in manifest
2. Generate and place icons:
   - Open `public/create-icons.html`
   - Download both icons
   - Place in `public/` directory
3. Check installability criteria:
   - DevTools → Application → Manifest
   - Look for "Installability" section
   - Address any warnings
4. On iOS: Must use Safari, must be HTTPS

### Issue: Webpack Runtime Error
**Symptoms:** "Cannot read properties of undefined" error

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next

# Restart server
PORT=3002 npm run dev
```

### Issue: Old Service Worker Cached
**Symptoms:** Changes not reflecting, old version running

**Solutions:**
1. Update cache version in `sw.js`:
   ```javascript
   const CACHE_NAME = 'crm-ai-pro-mobile-v2'; // Increment
   ```
2. Force update:
   - DevTools → Application → Service Workers
   - Check "Update on reload"
   - Reload several times
3. Unregister and re-register:
   - Click "Unregister"
   - Hard reload (Cmd+Shift+R)
4. Clear browser data:
   - Settings → Privacy → Clear browsing data
   - Check "Cached images and files"

---

## Testing on Real Devices

### iOS Device Testing (iPhone/iPad)

#### Requirements:
- HTTPS connection (use Vercel, ngrok, or production)
- iOS 11.3+ (PWA support)

#### Steps:
1. Deploy to production or create HTTPS tunnel:
   ```bash
   # Option 1: Deploy to Vercel
   git push origin main

   # Option 2: Use ngrok (install first)
   ngrok http 3002
   ```

2. Open Safari on iOS device
3. Navigate to HTTPS URL
4. Browse mobile dashboard
5. Tap Share → Add to Home Screen
6. Name the app and tap "Add"
7. Open app from home screen
8. Test offline:
   - Settings → Airplane Mode → On
   - Open app - should work

#### iOS-Specific Notes:
- Must use Safari (Chrome on iOS doesn't support PWA install)
- Service worker scope limited by manifest
- Push notifications require additional setup
- Icon must be 180x180 for iOS home screen (separate from PWA icons)

### Android Device Testing

#### Requirements:
- Chrome browser
- Android 5.0+ (Lollipop)
- Can use localhost or HTTPS

#### Steps:
1. Connect device to same network as dev machine
2. Find your local IP:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
3. On Android Chrome, visit `http://YOUR_IP:3002/m/tech/dashboard`
4. Wait for "Add to Home screen" banner
5. Or: Menu (⋮) → "Install app"
6. Tap "Install"
7. App appears on home screen
8. Test offline:
   - Settings → Network → Airplane mode
   - Open app - should work

#### Android-Specific Notes:
- Install prompt appears after engagement criteria met
- Can use Chrome DevTools remote debugging
- Push notifications work after user grants permission
- WebAPK generates on install (better integration)

---

## Performance Testing

### Lighthouse Audit
1. Open DevTools
2. Go to **Lighthouse** tab
3. Select categories:
   - ✅ Performance
   - ✅ Progressive Web App
4. Click "Analyze page load"
5. Review scores (aim for 90+ on PWA)

### PWA Checklist
Run Lighthouse PWA audit to verify:
- [x] Registers a service worker
- [x] Responds with a 200 when offline
- [x] Has a web app manifest
- [x] Configured for a custom splash screen
- [x] Sets a theme color
- [x] Content sized correctly for viewport
- [x] Fast load time

### Network Performance
1. DevTools → Network tab
2. Enable "Disable cache"
3. Reload page - note load time
4. Enable cache
5. Reload - should be faster (cached)
6. Go offline - should still load

---

## Debugging Tips

### Console Logging
Add logging to service worker for debugging:
```javascript
// In public/sw.js
self.addEventListener('fetch', (event) => {
  console.log('Fetching:', event.request.url);
  // ... rest of fetch handler
});
```

### Service Worker Update Cycle
```javascript
// In app/m/mobile-layout-client.tsx
navigator.serviceWorker.register('/sw.js').then(reg => {
  console.log('Scope:', reg.scope);
  console.log('Active:', reg.active);
  console.log('Installing:', reg.installing);
  console.log('Waiting:', reg.waiting);
});
```

### Cache Inspection
```javascript
// Run in browser console
caches.keys().then(console.log); // List all caches
caches.open('crm-ai-pro-mobile-v1').then(cache => {
  cache.keys().then(console.log); // List cached URLs
});
```

### Force Service Worker Update
```javascript
// Run in browser console
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.update());
});
```

---

## Next Steps After Testing

### 1. Generate Production Icons
- Open `public/create-icons.html`
- Download both PNG files
- Optionally: Design custom icons with logo

### 2. Test in Production
- Deploy to Vercel
- Test install on real devices
- Verify HTTPS certificate
- Check service worker registration

### 3. Monitor Service Worker
- Add analytics tracking
- Log service worker events
- Monitor cache hit rates
- Track offline usage

### 4. Optimize Caching Strategy
- Identify frequently accessed routes
- Add more URLs to precache
- Implement runtime caching
- Set cache expiration policies

### 5. Add Advanced Features
- Background sync for offline actions
- Push notifications
- Offline form submissions
- IndexedDB for offline data
- Network status indicator

---

## Useful Commands

```bash
# Clear Next.js cache
rm -rf .next

# Start dev server
PORT=3002 npm run dev

# Check if sw.js is accessible
curl http://localhost:3002/sw.js

# Build for production
npm run build

# Start production server
npm start

# Deploy to Vercel
vercel --prod
```

---

## Resources

- **Chrome DevTools**: Press F12 or Cmd+Option+I
- **Service Worker Docs**: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- **PWA Checklist**: https://web.dev/pwa-checklist/
- **Manifest Generator**: https://www.simicart.com/manifest-generator.html/
- **Icon Generator**: Built-in at `public/create-icons.html`

---

**Quick Test Commands:**
```bash
# Full test cycle
rm -rf .next && PORT=3002 npm run dev
# Then open: http://localhost:3002/m/tech/dashboard
# DevTools → Application → Service Workers (verify registered)
# DevTools → Network → Offline checkbox (test offline)
```

---

**Status:** Ready for testing
**Last Updated:** 2025-11-28
