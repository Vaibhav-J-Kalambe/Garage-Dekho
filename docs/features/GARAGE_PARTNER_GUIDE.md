# GarageDekho - Garage Partner Guide

How to register, set up, and operate your garage on GarageDekho.

---

## What is the Garage Partner Portal?

The GarageDekho Partner Portal is a separate dashboard built specifically for garage owners and managers. Through the portal you can:

- Receive SOS emergency alerts from nearby customers in real time
- Dispatch your mechanics to jobs
- Track your mechanics on a live map
- Verify job completion with OTP
- Manage your team of mechanics
- Keep your garage profile up to date (working hours, services, location)

The portal runs at: `yourdomain.com/portal`

It is separate from the customer app but connected to the same system - when a customer triggers SOS, your portal gets the alert instantly.

---

## Section 1: Getting Started

### 1.1 Register Your Garage

1. Go to `/portal/register`
2. **Step 1 - Create your account:**
   - Enter your email address (this will be your login)
   - Create a password (minimum 6 characters)
   - Tap **Next**
3. **Step 2 - Enter your garage details:**
   - Garage name (exactly as you want customers to see it)
   - Phone number
   - Address (street / area)
   - City
   - Tap **Register Garage**
4. You'll be logged in and taken to your dashboard automatically

> Your account is confirmed immediately - no email verification needed for portal accounts.

### 1.2 Log In

1. Go to `/portal/login`
2. Enter your email and password
3. Tap **Sign In**
4. You'll go straight to your dashboard

### 1.3 Sign Out

- From the **Dashboard** or **Profile** page, tap the Sign Out button in the top-right corner

---

## Section 2: Setting Up Your Profile (Do This First)

Before you start receiving SOS alerts, complete your profile. An incomplete profile means customers may not find you or distance calculations won't work.

Go to **Profile** (bottom navigation, rightmost icon).

### 2.1 Set Your Garage Location

This is the most important step.

1. Tap **Edit Profile**
2. Scroll to **Garage Location**
3. Tap **Use My Location**
4. Allow location access when your browser asks
5. Your GPS coordinates will be captured and saved
6. Tap **Save**

Without your location set, the system cannot calculate how far you are from an SOS request - you may miss nearby alerts.

> Do this on a phone or laptop physically at your garage so the coordinates are accurate.

### 2.2 Update Basic Information

In Edit mode, update:
- **Garage Name** - what customers see
- **Phone Number** - customers can call this directly from the app
- **Address** - your full street address
- **City**

Tap **Save** when done.

### 2.3 Set Working Hours

1. Tap **Edit Profile**
2. Under **Working Hours**, set:
   - **Opens at** - your opening time (e.g. 09:00)
   - **Closes at** - your closing time (e.g. 21:00)
   - **Closed on** - tap the days you are closed (they'll turn red)
3. Tap **Save**

### 2.4 Add Your Services

1. Tap **Edit Profile**
2. Under **Services Offered**, tap each service you provide:
   - Tyre Service, Battery Replacement, Engine Repair, Oil Change
   - Brake Service, AC Repair, Body Work, Wheel Alignment
   - Suspension, Electricals, General Repair, Accident Repair
3. Selected services show in blue with a tick
4. Tap **Save**

Customers can filter garages by service - the more accurately you fill this, the more relevant customers you attract.

---

## Section 3: Managing Your Team

Go to **Team** (bottom navigation, third icon).

Your mechanics are the people you dispatch when an SOS comes in. Add all of them here so you can assign them quickly during emergencies.

### 3.1 Add a Mechanic

1. Tap **Add** (top right)
2. Enter:
   - **Full Name** - how they'll appear in the system
   - **Phone Number** - used for WhatsApp dispatch messages
   - **Specialization** - their primary skill area
3. Tap **Add Mechanic**

### 3.2 Edit a Mechanic

1. Find the mechanic in the list
2. Tap **Edit** under their name
3. Update their details
4. Tap **Save Changes**

### 3.3 Remove a Mechanic

1. Find the mechanic in the list
2. Tap **Remove**
3. A confirmation appears - tap **Yes, Remove** to confirm

> Deletion is permanent. If a mechanic leaves temporarily, set their status to **Offline** instead of removing them.

### 3.4 Mechanic Status

Each mechanic has a status that shows whether they're available for jobs:

| Status      | Meaning                                      |
|-------------|----------------------------------------------|
| Available   | Ready to be dispatched                       |
| Busy        | Currently on a job (set automatically)       |
| Offline     | Not working today / not reachable            |

Tap the status badge on any mechanic card to cycle through: Available → Busy → Offline → Available.

Only **Available** mechanics can be selected when dispatching.

---

## Section 4: Handling SOS Alerts

This is the core of the portal. When a customer nearby triggers an SOS, you'll be alerted immediately.

### 4.1 How You Get Alerted

When a new SOS request comes in near your garage:
- A **beeping sound** plays (3 beeps)
- Your device **vibrates** (on mobile)
- A **red alert banner** appears on the Dashboard
- The SOS tab in the bottom nav shows a **red badge** with the count

> Keep the portal tab open on a dedicated screen or tablet at your garage so you don't miss alerts.

### 4.2 Viewing SOS Alerts

Tap **SOS** in the bottom navigation.

The page has three sections:

**Incoming** - New requests from nearby customers waiting for a garage to accept
- Shows: issue type (Flat Tyre, Battery Dead, etc.), how long ago it came in, distance from your garage
- Tap **Accept & Dispatch** to take the job

**Active Jobs** - Requests your garage has accepted, currently in progress

**Completed Today** - Jobs finished today (OTP verified)

### 4.3 Accepting and Dispatching a Mechanic

1. Under **Incoming**, tap **Accept & Dispatch** on an alert
2. A mechanic selection screen appears
3. Tap the mechanic you want to send (only Available mechanics are selectable)
4. Tap **Dispatch [Name]**

What happens next:
- The job is assigned to your garage
- The mechanic's status is automatically set to **Busy**
- A WhatsApp message is sent to the mechanic's phone with a link to their tracking page
- The customer's screen updates automatically - they see your garage name and mechanic's name

> If all mechanics are busy or offline, add more in the Team tab before accepting.

### 4.4 What the Mechanic Does

After you dispatch, the mechanic receives a WhatsApp message like this:

```
SOS Job Assigned!

Issue: Flat Tyre
Location: Kurla West, Mumbai

Open your tracking link:
https://yourdomain.com/sos/mechanic/abc-123
```

The mechanic opens this link on their phone and:
1. Their GPS starts sharing to the customer automatically
2. The customer can see the mechanic's moving location on their map
3. When the mechanic arrives, they tap **I've Arrived**
4. They enter the OTP the customer tells them
5. Job confirmed

### 4.5 Live Tracking from the Portal

After dispatching, you can also track the job from the portal:

1. Go to **SOS** → **Active Jobs**
2. Tap **Live Track** on the job
3. A map opens showing:
   - The customer's location (red)
   - The mechanic's live position (blue, updates every 5 seconds)
   - A route line between them

### 4.6 Verifying OTP from the Portal

If the mechanic is unable to enter the OTP themselves (e.g. bad network), you can verify it from the portal:

1. Go to **SOS** → **Active Jobs**
2. Tap **Verify OTP** on a job where the mechanic has arrived
3. The tracking screen opens with an OTP entry field
4. Call the mechanic, get the OTP they received, enter it here
5. Tap **Verify** - job is confirmed

### 4.7 After the Job

Once OTP is verified:
- The mechanic's status resets to **Available** automatically
- The job moves to **Completed Today**
- The customer's screen shows "Service Started!" confirmation

---

## Section 5: Dashboard Overview

The Dashboard is your command centre. It shows at a glance:

| Card              | What it shows                                             |
|-------------------|-----------------------------------------------------------|
| Bookings Today    | Number of bookings (coming soon)                          |
| Revenue Today     | Revenue tracked (coming soon)                             |
| SOS Handled       | SOS jobs completed today by your garage                   |
| Avg Rating        | Customer rating (coming soon)                             |

**Active SOS Banner** - If there are any pending SOS requests near you, a red banner appears at the top. Tap it to go straight to the SOS page.

**Active SOS List** - Shows up to 3 active or nearby requests. Tap any to go to the SOS page.

**Quick Actions** - Shortcut buttons to SOS Alerts and My Team.

---

## Section 6: Tips for Smooth Operations

**Keep the portal open on a dedicated screen.**
The sound alert and live updates only work when the portal tab is open. Consider keeping it on a tablet or monitor at the garage reception.

**Set your location accurately.**
Go to Profile → Edit Profile → Use My Location. Do this while physically at the garage. Without it, the system doesn't know how far you are from SOS requests.

**Keep mechanics' status updated.**
When a mechanic goes on a break or leaves for the day, set their status to Offline. When they return, set it back to Available. This prevents dispatching someone who isn't available.

**Add mechanic phone numbers correctly.**
The WhatsApp dispatch message goes to the mechanic's number. Make sure it's correct and the mechanic has WhatsApp installed. Indian numbers should be entered as 10 digits (e.g. 9876543210) - the system adds the country code automatically.

**Response time matters.**
Customers can see all garages being notified. If multiple garages are listed, the one that accepts first gets the job. Accept quickly.

**Multiple mechanics available = better coverage.**
If you only have one mechanic in the system and they're on a job, you can't accept new SOS requests. Add all your available staff.

---

## Section 7: Frequently Asked Questions

**Can two garages accept the same SOS?**
No. The system only allows one garage to accept each request. The first to accept gets it. If you try to accept one that was already taken, you'll see a message saying it's no longer available.

**What if I accidentally accept a request?**
Currently there is no "cancel" option from the portal side. Call the customer directly (their number is shown after acceptance) and coordinate with them. A cancel feature is being added.

**What if the mechanic loses network on the way?**
Their last known location stays on the map. The tracking resumes when they get signal again. The customer can call the mechanic directly from their screen.

**Can the customer contact me directly?**
Not through the app yet - only the mechanic's number is shared with the customer after dispatch. However, customers can WhatsApp any garage on the searching screen before acceptance.

**What if the customer gives the wrong OTP?**
The system will show "Invalid OTP" and the mechanic can try again. Ask the customer to look at their screen carefully - the digits are displayed large and clearly.

**Can I add more than one location / branch?**
Currently, each account supports one garage location. Multiple branch support is planned for a future update.

**My mechanic's WhatsApp message isn't going through.**
Check:
1. The mechanic's phone number in the Team tab is correct (10 digits, no country code)
2. The mechanic has WhatsApp installed on that number
3. You have internet connection when dispatching

**I'm not hearing the SOS alert sound.**
The sound only plays after you've interacted with the page (browser security requirement). Click anywhere on the portal before waiting for alerts. Also check that your device volume is on and the browser tab is not muted.

---

## Section 8: Account and Security

- Your portal login is separate from a customer account on the same email
- Do not share your login credentials with anyone
- If you suspect unauthorized access, sign out immediately and change your password via the Supabase login portal
- All data between the app and the server is encrypted over HTTPS

---

*GarageDekho Partner Portal - Powering faster, smarter roadside service.*
