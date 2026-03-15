# Google Analytics Setup - astruXo

## ✅ Configuration Complete

Google Analytics 4 has been successfully configured for **astruXo.net** with Measurement ID: `G-ER6QWJSEL0`

---

## 📊 What's Being Tracked

### Automatic Tracking

1. **Page Views**
   - Every page navigation is automatically tracked
   - Includes page path and page title
   - Works with React Router navigation

2. **User Sessions**
   - Session duration
   - Pages per session
   - Bounce rate

3. **User Properties**
   - User ID (when authenticated)
   - Email verification status
   - Anonymous IP tracking enabled (GDPR compliant)

### Available Custom Events

You can track custom events anywhere in the app using the `trackEvent` function:

```typescript
import { trackEvent } from '@/lib/usePageTracking';

// Example: Track button click
trackEvent('button_click', {
  button_name: 'go_live',
  page: '/go-live'
});

// Example: Track video play
trackEvent('video_play', {
  video_id: 'stream_123',
  duration: 120
});

// Example: Track post creation
trackEvent('post_created', {
  post_type: 'image',
  user_id: 'user_456'
});
```

---

## 🔧 Implementation Details

### Files Modified/Created

1. **`public/analytics.js`**
   - Loads Google Analytics script
   - Initializes gtag with your Measurement ID
   - Enables anonymous IP tracking

2. **`src/lib/usePageTracking.ts`**
   - Hook for automatic page view tracking
   - `trackEvent()` function for custom events
   - `setUserProperties()` for user identification

3. **`src/App.tsx`**
   - Integrated `AnalyticsWrapper` component
   - Tracks all route changes automatically

4. **`src/lib/auth-context.tsx`**
   - Tracks user authentication
   - Sets user properties in GA when user logs in

---

## 📈 Viewing Your Analytics

1. Go to [Google Analytics](https://analytics.google.com/)
2. Select your **astruXo** property
3. View real-time data in the **Realtime** report
4. View historical data in **Reports**

### Key Reports to Check

- **Realtime Overview**: See current active users
- **Acquisition**: How users find your site
- **Engagement**: Page views, session duration
- **User Attributes**: Demographics and interests
- **Events**: Custom events you're tracking

---

## 🎯 Recommended Custom Events to Add

Here are some suggested events you might want to track:

### Social Features
```typescript
// Post interactions
trackEvent('post_liked', { post_id: '123' });
trackEvent('post_commented', { post_id: '123' });
trackEvent('post_shared', { post_id: '123' });

// Follow actions
trackEvent('user_followed', { target_user_id: '456' });
trackEvent('user_unfollowed', { target_user_id: '456' });
```

### Streaming Features
```typescript
// Stream events
trackEvent('stream_started', { stream_id: '789' });
trackEvent('stream_ended', { stream_id: '789', duration: 3600 });
trackEvent('stream_joined', { stream_id: '789' });

// Gift events
trackEvent('gift_sent', { gift_type: 'rose', value: 10 });
trackEvent('coins_purchased', { amount: 100, price: 9.99 });
```

### Engagement
```typescript
// App installation
trackEvent('pwa_installed');
trackEvent('pwa_prompt_shown');
trackEvent('pwa_prompt_accepted');

// Content creation
trackEvent('post_created', { type: 'image' });
trackEvent('post_created', { type: 'video' });
```

---

## 🔒 Privacy & GDPR Compliance

✅ **Anonymous IP tracking enabled** - User IPs are anonymized
✅ **No PII in events** - Don't send personal information in event parameters
✅ **User consent** - Consider adding a cookie consent banner for EU users

### Optional: Add Cookie Consent

If you need GDPR compliance, you can add a cookie consent banner that only loads Google Analytics after user consent.

---

## 🧪 Testing

### Test in Development
1. Open your site in a browser
2. Open browser DevTools (F12)
3. Go to Network tab
4. Filter by "gtag" or "analytics"
5. Navigate between pages
6. You should see requests to Google Analytics

### Test in Production
1. Deploy your site
2. Visit astruxo.net
3. Go to Google Analytics → Realtime
4. You should see your visit in real-time

---

## 📝 Notes

- Analytics data may take 24-48 hours to appear in full reports
- Realtime data appears immediately
- Development traffic is also tracked (consider filtering it out in GA settings)
- The Measurement ID `G-ER6QWJSEL0` is hardcoded in the app

---

## 🚀 Next Steps

1. **Set up Goals/Conversions** in Google Analytics
   - Track sign-ups
   - Track stream starts
   - Track purchases

2. **Create Custom Dashboards**
   - Monitor key metrics
   - Track user engagement

3. **Set up Alerts**
   - Get notified of traffic spikes
   - Monitor conversion rates

4. **Add More Custom Events**
   - Track specific user actions
   - Measure feature usage

---

**Google Analytics is now live on astruXo.net!** 📊✨

All page views and user sessions are being tracked automatically. You can start viewing your analytics data in your Google Analytics dashboard.
