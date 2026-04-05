# GarageDekho — Website Hosting Guide (GoDaddy VPS)

Complete guide to deploying GarageDekho on GoDaddy VPS with Nginx + PM2 + SSL.

> **Important:** GoDaddy Shared Hosting does NOT support Next.js.
> You must use a **GoDaddy VPS (Virtual Private Server)** — Linux, Ubuntu 22.04 recommended.
> Recommended plan: GoDaddy VPS 2GB RAM or higher.

---

## Table of Contents

1. [What You Need](#1-what-you-need)
2. [First-Time Server Setup](#2-first-time-server-setup)
3. [Install Node.js & PM2](#3-install-nodejs--pm2)
4. [Deploy the App](#4-deploy-the-app)
5. [Set Environment Variables](#5-set-environment-variables)
6. [Set Up Nginx (Reverse Proxy)](#6-set-up-nginx-reverse-proxy)
7. [Set Up SSL (HTTPS)](#7-set-up-ssl-https)
8. [Connect Your GoDaddy Domain](#8-connect-your-godaddy-domain)
9. [How to Update the App](#9-how-to-update-the-app)
10. [Keep App Running After Reboot](#10-keep-app-running-after-reboot)
11. [Common Errors & Fixes](#11-common-errors--fixes)

---

## 1. What You Need

Before starting, make sure you have:

- [ ] GoDaddy VPS plan (Linux, Ubuntu 22.04) — minimum 2GB RAM
- [ ] Your domain connected to GoDaddy (e.g. `garagedekho.com`)
- [ ] SSH access to the VPS (GoDaddy gives you IP, username, password)
- [ ] Your code pushed to a GitHub repository (private is fine)
- [ ] All environment variables ready (from `.env.local`)
- [ ] An SSH client:
  - Windows: use **PuTTY** or **Windows Terminal**
  - Mac/Linux: use **Terminal** directly

---

## 2. First-Time Server Setup

### Step 1 — SSH into your VPS

```bash
ssh root@YOUR_VPS_IP_ADDRESS
# Enter the password GoDaddy gave you
```

### Step 2 — Update the server

```bash
apt update && apt upgrade -y
```

### Step 3 — Create a non-root user (safer than running everything as root)

```bash
adduser garagedekho
usermod -aG sudo garagedekho

# Switch to new user
su - garagedekho
```

### Step 4 — Install Git

```bash
sudo apt install git -y
git --version   # should show git version 2.x
```

---

## 3. Install Node.js & PM2

### Install Node.js 20.x

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version   # should show v20.x.x
npm --version    # should show 10.x.x
```

### Install PM2 (keeps the app running 24/7)

PM2 is a process manager — it restarts your app if it crashes and keeps it running after server reboots.

```bash
sudo npm install -g pm2
pm2 --version   # should show a version number
```

### Install Nginx (web server / reverse proxy)

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx   # auto-start on reboot
```

---

## 4. Deploy the App

### Step 1 — Clone your GitHub repository

```bash
cd /home/garagedekho
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git app
cd app
```

> If your repo is private, GitHub will ask for your username and a **Personal Access Token** (not your password).
> Generate one at: GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic) → Generate new token → select `repo` scope.

### Step 2 — Install dependencies

```bash
npm install
```

### Step 3 — Set environment variables (see Section 5 first)

### Step 4 — Build the app

```bash
npm run build
```

This will take 1-2 minutes. You should see:
```
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages
```

If you see errors, check Section 11.

### Step 5 — Start the app with PM2

```bash
pm2 start npm --name "garagedekho" -- start
pm2 save   # saves the process list so it survives reboot
```

### Verify it's running

```bash
pm2 status
# Should show: garagedekho | online | ...
```

The app is now running on port 3000 internally. Nginx will expose it to the world on port 80/443.

---

## 5. Set Environment Variables

Create a `.env.local` file on the server:

```bash
cd /home/garagedekho/app
nano .env.local
```

Paste all your variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxx
RAZORPAY_KEY_ID=rzp_live_xxxx
RAZORPAY_KEY_SECRET=xxxx

# App
NEXT_PUBLIC_APP_URL=https://www.garagedekho.com
COMMISSION_PCT=15
ADMIN_PASSWORD=YourStrongPasswordHere

# Optional
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
RESEND_API_KEY=re_xxxx
```

Save: press `Ctrl+X` → `Y` → `Enter`

**After changing .env.local, always rebuild and restart:**
```bash
npm run build
pm2 restart garagedekho
```

---

## 6. Set Up Nginx (Reverse Proxy)

Nginx sits in front of your Next.js app and routes traffic from port 80 (HTTP) to your app on port 3000.

### Create Nginx config for your site

```bash
sudo nano /etc/nginx/sites-available/garagedekho
```

Paste this exactly:

```nginx
server {
    listen 80;
    server_name garagedekho.com www.garagedekho.com;

    # Security headers
    add_header X-Frame-Options "DENY";
    add_header X-Content-Type-Options "nosniff";

    # Increase upload size limit (for profile photos etc.)
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Save: `Ctrl+X` → `Y` → `Enter`

### Enable the site

```bash
sudo ln -s /etc/nginx/sites-available/garagedekho /etc/nginx/sites-enabled/
sudo nginx -t          # test config — must say "syntax is ok"
sudo systemctl reload nginx
```

Your site is now accessible at `http://YOUR_VPS_IP` (no HTTPS yet).

---

## 7. Set Up SSL (HTTPS — Free with Let's Encrypt)

### Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Get SSL certificate

```bash
sudo certbot --nginx -d garagedekho.com -d www.garagedekho.com
```

Follow the prompts:
- Enter your email address
- Agree to terms (A)
- Choose whether to share email with EFF (N is fine)
- Certbot will automatically update your Nginx config for HTTPS

### Verify auto-renewal

SSL certificates expire every 90 days — Certbot renews them automatically.
Test that renewal works:

```bash
sudo certbot renew --dry-run
# Should say: "Congratulations, all simulated renewals succeeded"
```

Your site is now live at `https://garagedekho.com` ✓

---

## 8. Connect Your GoDaddy Domain

### Update DNS records in GoDaddy

1. GoDaddy → **My Products** → **Domains** → click your domain → **DNS**
2. Update or add these records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | YOUR_VPS_IP_ADDRESS | 600 |
| A | `www` | YOUR_VPS_IP_ADDRESS | 600 |

3. Save changes
4. Wait 15 minutes to 2 hours for DNS to propagate

### Verify DNS is working

```bash
# Run this on your local machine (not the server)
nslookup garagedekho.com
# Should return your VPS IP address
```

Or visit [dnschecker.org](https://dnschecker.org) → enter your domain → should show your VPS IP.

---

## 9. How to Update the App

Every time you make changes to the code, follow these steps on the server:

```bash
# SSH into server
ssh garagedekho@YOUR_VPS_IP

# Go to app folder
cd /home/garagedekho/app

# Pull latest code from GitHub
git pull origin main

# Install any new dependencies
npm install

# Rebuild
npm run build

# Restart the app
pm2 restart garagedekho

# Check it's running
pm2 status
```

### Automate with a deploy script

Save this as `/home/garagedekho/deploy.sh`:

```bash
#!/bin/bash
cd /home/garagedekho/app
echo "Pulling latest code..."
git pull origin main
echo "Installing dependencies..."
npm install
echo "Building..."
npm run build
echo "Restarting app..."
pm2 restart garagedekho
echo "Done! App restarted."
pm2 status
```

Make it executable:
```bash
chmod +x /home/garagedekho/deploy.sh
```

Now to deploy any update, just run:
```bash
./deploy.sh
```

---

## 10. Keep App Running After Reboot

If the VPS restarts (power cut, monthly maintenance, etc.), your app needs to auto-start.

```bash
# Save PM2 process list
pm2 save

# Generate startup script
pm2 startup

# PM2 will print a command — copy and run it. It looks like:
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u garagedekho --hp /home/garagedekho
```

Now the app will auto-start on every server reboot.

### Test it works

```bash
sudo reboot
# Wait 1-2 minutes, then SSH back in
ssh garagedekho@YOUR_VPS_IP
pm2 status   # should show garagedekho as "online"
```

---

## 11. Common Errors & Fixes

### Build fails: "JavaScript heap out of memory"
VPS has too little RAM. Fix:
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=1536" npm run build
```

### Port 3000 already in use
```bash
pm2 delete garagedekho   # stop old process
pm2 start npm --name "garagedekho" -- start
```

### Nginx: "502 Bad Gateway"
The Next.js app isn't running. Fix:
```bash
pm2 status           # check if app is running
pm2 logs garagedekho # see what error crashed it
pm2 restart garagedekho
```

### SSL certificate fails: "Connection refused"
Port 80 must be open. Fix:
```bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22    # keep SSH open!
sudo ufw enable
```

### "Permission denied" on git pull
Set up SSH key or use HTTPS with token:
```bash
git remote set-url origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/YOUR_REPO.git
```

### App works but images don't load
GoDaddy VPS IP must be added to Supabase allowlist if using Supabase storage.

### Changes not showing after deploy
Browser is caching old version. Users should hard-refresh (`Ctrl+Shift+R`).
For Next.js, build hash changes on every build so this self-resolves.

---

## Website vs App Independence on GoDaddy VPS

Since you're self-hosting on a VPS (not Vercel), the architecture becomes:

```
GoDaddy VPS
├── Nginx (port 80/443) — your website
├── Next.js app (port 3000) — website code
└── (optional) Separate API server (port 3001) — app-only APIs

Mobile App (Capacitor)
└── Calls APIs directly on your VPS
    → If website is down but VPS is up, app still works ✓
```

With a VPS you have full control. You can run the website and app backend as completely separate processes — meaning the website going down doesn't kill the app. This is covered in `APP_HOSTING_GUIDE.md`.

---

## Quick Reference

| What | Command |
|------|---------|
| Check app status | `pm2 status` |
| Restart app | `pm2 restart garagedekho` |
| View live logs | `pm2 logs garagedekho` |
| Deploy update | `./deploy.sh` |
| Test Nginx config | `sudo nginx -t` |
| Reload Nginx | `sudo systemctl reload nginx` |
| Renew SSL | `sudo certbot renew` |
| Reboot server | `sudo reboot` |

| Service | URL |
|---------|-----|
| Your site | `https://garagedekho.com` |
| Admin Panel | `https://garagedekho.com/admin` |
| PM2 monitor | run `pm2 monit` in SSH |
