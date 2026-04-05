# GarageDekho - Failure Prevention Guide

How to prevent, detect, and recover from every type of failure - website and app.

---

## The Core Reality

Since the mobile app is a PWA wrapper around the website, **both share the same failure points**. Fix the website = fix the app. This guide covers every category of failure and exactly what to do about each one.

---

## Category 1 - Deployment Failures
*You pushed bad code and the site broke.*

### How it happens
- Merged untested code directly to `main`
- Forgot to set an environment variable
- A dependency update broke something

### Prevention

**Use a staging branch - never push directly to main**
```
your-laptop
    ↓ push
  staging branch  →  vercel preview URL  →  test it
    ↓ merge (only after testing)
  main branch  →  production  →  live site
```

**Always run build locally before pushing**
```bash
npm run build      # must complete with 0 errors
npm run lint       # must pass
```

**Check the Vercel deployment log immediately after every push**
- Vercel → Project → Deployments → click the latest one
- If it says "Failed" - rollback immediately (see below)

### Recovery - How to rollback in 30 seconds
1. Vercel → Project → **Deployments**
2. Find the last green (working) deployment
3. Click **...** → **Promote to Production**
4. Site is restored instantly - no code change needed

---

## Category 2 - Environment Variable Failures
*App loads but features are broken - payments fail, login fails, etc.*

### How it happens
- Forgot to add a new env variable to Vercel
- Accidentally deleted a variable
- Rotated a key but forgot to update Vercel

### Prevention

**Keep a secure copy of all env variables**
Store your `.env.local` in a password manager (Bitwarden, 1Password) or a private encrypted note.
Never in WhatsApp, email, or Google Docs.

**After adding any new env variable locally, immediately add it to Vercel too**

**Checklist of all required variables** - verify these exist in Vercel → Settings → Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_RAZORPAY_KEY_ID
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
ADMIN_PASSWORD
COMMISSION_PCT
NEXT_PUBLIC_APP_URL
```

### Recovery
1. Vercel → Project → Settings → Environment Variables
2. Add the missing variable
3. Vercel → Deployments → **Redeploy** the latest deployment (no code push needed)

---

## Category 3 - Database Failures (Supabase)
*Data not loading, bookings not saving, login not working.*

### How it happens
- Supabase free plan pauses after 1 week of inactivity
- RLS policy too restrictive - blocks valid queries
- Table column missing (new feature deployed but SQL not run)
- Supabase has an outage

### Prevention

**Upgrade Supabase to Pro plan before launch ($25/month)**
Free plan pauses your database after 7 days of no activity. One user visit unpauses it but takes ~30 seconds - terrible UX in production.

**Keep your SQL schema in version control**
Every time you run SQL in Supabase editor, also save it in `portal-schema.sql` or `sos-schema.sql`. This way if you ever need to rebuild the database, you have the full schema.

**Never delete or rename columns without updating the code first**
Supabase doesn't warn you - a renamed column will silently break every query that used the old name.

**Monitor Supabase status**
- [status.supabase.com](https://status.supabase.com) - subscribe to email alerts

### Recovery
- **Paused database:** Supabase → Project → click "Restore project" (takes ~2 min)
- **Missing column:** Run the `ALTER TABLE ... ADD COLUMN` SQL in Supabase SQL Editor
- **Supabase outage:** Wait - nothing you can do. Average outage duration is under 15 min.

---

## Category 4 - Payment Failures (Razorpay)
*Customers can't pay, or payments go through but aren't recorded.*

### How it happens
- Razorpay keys expired or rotated
- Order created but user closed browser before verification
- `RAZORPAY_KEY_SECRET` missing from Vercel
- Razorpay account KYC not completed (live payments blocked)

### Prevention

**Set up Razorpay webhook - catches payments even if user closes browser**
Razorpay Dashboard → Settings → Webhooks → Add:
- URL: `https://garagedekho.com/api/payment/verify`
- Events: `payment.captured`, `payment.failed`

**Complete KYC on your Razorpay account**
Without KYC, live payments will be blocked after a certain volume.
Razorpay Dashboard → Account & Settings → KYC Details

**Monitor for failed payments**
Razorpay Dashboard → Transactions → filter by "Failed"
Set up email alerts: Razorpay → Settings → Notifications

**Test payments before every major release**
Use Razorpay test card:
- Card: `4111 1111 1111 1111`
- Expiry: any future date
- CVV: any 3 digits

### Recovery
- **Payment went through but not recorded:** Check Razorpay Dashboard → manually note the amount → mark in `/admin/payouts`
- **Key issue:** Rotate keys in Razorpay → update in Vercel → redeploy

---

## Category 5 - Authentication Failures
*Users can't log in, sessions expire, Google OAuth broken.*

### How it happens
- Supabase auth URL not updated after domain change
- Google OAuth redirect URI not added in Google Cloud Console
- JWT secret rotated in Supabase (logs out all users)

### Prevention

**After any domain change, update Supabase immediately**
Supabase → Authentication → URL Configuration:
- Site URL → your new domain
- Redirect URLs → `https://newdomain.com/**`

**After any domain change, update Google Cloud Console**
Google Cloud → APIs & Services → Credentials → OAuth 2.0 → Authorized redirect URIs → add new domain

**Never rotate the JWT secret unless absolutely necessary**
It logs out every single user instantly.

### Recovery
- **Google OAuth broken:** Add the correct redirect URI to Google Cloud Console - takes effect in ~5 min
- **All users logged out:** Unfortunately there's no recovery - users just log in again

---

## Category 6 - GoDaddy VPS / Hosting Outage
*The entire website is down.*

### How it happens
- Your VPS ran out of RAM (app crashes silently)
- Server needs a reboot but PM2 didn't auto-restart
- GoDaddy VPS infrastructure issue (rare)
- DNS propagation issue after domain change
- SSL certificate expired (auto-renews with Certbot but can fail)

### Prevention

**Set up UptimeRobot (free) to alert you the moment your site goes down**
1. Go to [uptimerobot.com](https://uptimerobot.com) - free account
2. Add Monitor → type **HTTP(s)**
3. URL: `https://www.garagedekho.com`
4. Monitoring interval: every **5 minutes**
5. Alert contacts: your email + phone number (SMS)
6. You'll get an alert within 5 minutes of downtime - before your users notice

**Make sure PM2 is set to auto-restart on reboot**
```bash
pm2 startup
pm2 save
```

**Monitor server RAM - app crashes if RAM runs out**
```bash
free -h   # run on server to check RAM usage
pm2 monit # live dashboard of CPU and RAM per process
```

**Check SSL certificate expiry monthly**
```bash
sudo certbot renew --dry-run
```

**Set up a status page for your users**
[instatus.com](https://instatus.com) - free plan. Users check it themselves instead of spamming support.

### Recovery
```bash
# SSH into server
ssh garagedekho@YOUR_VPS_IP

# Check if app is running
pm2 status

# If app is stopped - restart it
pm2 restart garagedekho

# If Nginx is down
sudo systemctl restart nginx

# If SSL is expired
sudo certbot renew
sudo systemctl reload nginx
```

- GoDaddy VPS outage: contact GoDaddy support - they have SLA for VPS plans
- DNS issue: verify A records in GoDaddy DNS still point to your VPS IP

---

## Category 7 - App-Specific Failures (PWA)

### How it happens
- `assetlinks.json` file missing or wrong → Android TWA crashes on open
- App icon deleted from `/public/icons/` → app icon breaks after redeploy
- `manifest.json` returns error → app install broken
- Service worker cached old version → users see outdated content

### Prevention

**Never delete or rename these files:**
```
public/icons/icon-192.png
public/icons/icon-512.png
public/.well-known/assetlinks.json   (after app launch)
```

**Verify manifest is always accessible**
After every deploy, visit: `https://garagedekho.com/manifest.json`
Should return valid JSON with `name`, `icons`, `start_url`, `display: "standalone"`

**Never change the Bundle ID / Package Name after app is published**
`com.garagedekho.app` must stay the same forever. Changing it = publishing a completely new app and losing all existing installs/reviews.

**Keep the signing keystore file safe (Android)**
The `.keystore` file generated by PWABuilder is required for every future app update.
If you lose it → you can never update the app → must publish a new app from scratch, losing all reviews and installs.

Store it in: a password manager + email it to yourself + keep a USB backup.

### Recovery
- **assetlinks.json wrong:** Fix the file → deploy → wait 24 hours for Google to re-verify
- **App crashes on open:** Check if the website itself is working. App crash = website issue 90% of the time.
- **Users seeing old version:** Hard refresh (pull down to refresh in app) - PWA cache clears automatically on next deploy

---

## Category 8 - Security Failures
*Unauthorized access, data breach, admin panel compromised.*

### How it happens
- Weak or reused admin password
- `NEXT_PUBLIC_ADMIN_PASSWORD` exposed in code (we fixed this - it's now `ADMIN_PASSWORD`)
- Supabase RLS not enabled - anyone can read all data
- Service role key exposed in client code

### Prevention

**Use a strong admin password - 16+ characters, mix of everything**
Example format: `GD-Admin#2026-Secure!` (do not use this exact one)

**Rotate admin password every 3 months**
Update in Vercel → Environment Variables → Redeploy

**Verify RLS is enabled on every Supabase table**
Supabase → Table Editor → click each table → confirm RLS is ON

**Never use `NEXT_PUBLIC_` prefix for secrets**
- ✅ `ADMIN_PASSWORD` - server only
- ❌ `NEXT_PUBLIC_ADMIN_PASSWORD` - exposed to everyone

**Regularly run npm audit**
```bash
npm audit        # shows known vulnerabilities
npm audit fix    # auto-fixes safe ones
```

### Recovery
- **Admin password compromised:** Change it in Vercel immediately → Redeploy
- **Supabase keys compromised:** Supabase → Settings → API → Regenerate keys → Update Vercel → Redeploy
- **Razorpay keys compromised:** Razorpay → Settings → API Keys → Regenerate → Update Vercel → Redeploy

---

## Master Monitoring Setup

Set these up once and they run automatically:

| Tool | What it monitors | Cost | Setup |
|------|-----------------|------|-------|
| UptimeRobot | Site up/down - alerts in 5 min | Free | uptimerobot.com |
| Vercel Analytics | Page views, errors, performance | Free (basic) | Vercel dashboard |
| Supabase Alerts | Database health | Free | status.supabase.com |
| Razorpay Notifications | Failed payments | Free | Razorpay → Settings |
| Instatus | Public status page for users | Free | instatus.com |

---

## Emergency Response Playbook

When something breaks, follow this order:

```
1. Check UptimeRobot alert - what URL is down?

2. Check Vercel status (vercel-status.com)
   → If Vercel is down: wait, post on status page

3. Check your latest deployment
   → If recent bad deploy: rollback immediately in Vercel

4. Check Supabase status (status.supabase.com)
   → If Supabase down: wait

5. Check environment variables in Vercel
   → Any missing? Add and redeploy

6. Check Vercel function logs
   → Vercel → Project → Functions → Logs
   → Look for the error message

7. Post status update at status.garagedekho.com
   → "We're aware of an issue and working on a fix"

8. Fix → test on staging branch → merge to main
```

---

## For the App (After Website is Hosted)

When you come back after hosting the website, these things will be prepared before app submission:

- [ ] Offline page (`public/offline.html`) - shows when user has no internet
- [ ] Service worker registration - caches the app shell for faster loads
- [ ] `assetlinks.json` - required for Android TWA to verify ownership
- [ ] Correct icon sizes verified (192px and 512px)
- [ ] Manifest.json verified and complete
- [ ] Lighthouse PWA audit passed (score 100)
- [ ] PWABuilder package generated with correct Bundle ID
- [ ] Signing keystore safely backed up

**Come back after your domain is live on Vercel and say "make app ready" - everything above will be done.**

---

## Summary - Most Important Things

| Priority | Action |
|----------|--------|
| 1 | Set up UptimeRobot monitoring (5 min, free) |
| 2 | Upgrade Supabase to Pro before launch |
| 3 | Never push directly to main - always use staging |
| 4 | Back up the Razorpay signing keystore safely (after app launch) |
| 5 | Complete Razorpay KYC before going live |
| 6 | Keep all env variables backed up in a password manager |
| 7 | Set up Vercel status alerts |
