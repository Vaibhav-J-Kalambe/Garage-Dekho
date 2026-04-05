# GarageDekho

A hyperlocal automotive service marketplace - find, book, and manage mechanic services near you. Built as a fully responsive Next.js web app following Apple Human Interface Guidelines.

---

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Framework   | Next.js 16 (App Router)             |
| UI          | React 19                            |
| Styling     | Tailwind CSS 3                      |
| Icons       | lucide-react (Feather-style)        |
| Language    | JavaScript (JSX)                    |

---

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Pages

| Route              | Description                                              |
|--------------------|----------------------------------------------------------|
| `/`                | Home - search, services, top garages, promo, SOS banner |
| `/garage/[id]`     | Garage Detail - services, reviews, booking CTA          |
| `/bookings`        | My Bookings - upcoming & past appointments              |
| `/offers`          | Offers & Deals - promo codes with copy functionality    |
| `/profile`         | Profile - user info, vehicles, account settings         |
| `/near-me`         | Near Me - map view with garage pins & filters           |
| `/sos`             | SOS Assistance - emergency roadside help                |

---

## Project Structure

```
Garage/
├── app/
│   ├── page.js               # Home page
│   ├── data.json             # Garage data (name, services, reviews…)
│   ├── globals.css           # Tailwind base + shadow token system
│   ├── layout.js             # Root layout
│   ├── garage/
│   │   └── [id]/page.js      # Dynamic garage detail page
│   ├── bookings/
│   │   ├── page.js           # Bookings list page
│   │   └── data.json         # Mock bookings data
│   ├── offers/
│   │   ├── page.js           # Offers & deals page
│   │   └── data.json         # Mock offers data
│   ├── profile/
│   │   └── page.js           # User profile page
│   ├── near-me/
│   │   └── page.js           # Map + nearby garages page
│   └── sos/
│       └── page.js           # Emergency SOS page
├── components/
│   └── Header.js             # Shared sticky header with desktop nav
├── tailwind.config.mjs       # Theme - primary (#0056D2), accent (#FF6B00)
└── package.json
```

---

## Design System

### Colors
| Token     | Hex       | Usage                        |
|-----------|-----------|------------------------------|
| `primary` | `#0056D2` | Buttons, links, active states|
| `accent`  | `#FF6B00` | SOS button, EV tags, alerts  |
| Background| `#F8FAFC` | Page background              |

### Shadow Elevation System
Defined in `app/globals.css`:

| Class              | Usage                              |
|--------------------|------------------------------------|
| `shadow-card`      | Resting white cards (L1)           |
| `shadow-card-hover`| Hovered / focused cards (L2)       |
| `shadow-sos`       | Red-tinted SOS banner (L3)         |
| `shadow-promo`     | Amber-tinted promo banner (L3)     |
| `shadow-nav`       | Bottom navigation upward shadow    |

### Responsive Breakpoints
- **Mobile** (`< 768px`) - single column, bottom navigation bar
- **Desktop** (`≥ 768px`) - multi-column grids, inline header nav, no bottom bar

---

## Key Features

- **Book Again strip** - quick re-booking from last visited garage
- **SOS Emergency page** - one-tap roadside assistance with countdown timer
- **Garage Detail** - services with individual pricing, tabbed reviews & about
- **Offers** - filterable promo cards with one-click code copy
- **Near Me** - CSS-simulated map with garage pins, distance & type filters
- **My Vehicles** - add/remove vehicles on profile page
- **Pickup & Drop** - flagged on booking cards where applicable
- **Open/Closed badges** - live status with wait time on all garage cards
- **Fully responsive** - works on mobile, tablet, and desktop

---

## Data

All data is stored as local JSON files (no backend required):

- `app/data.json` - 3 garages with services, reviews, address, hours
- `app/bookings/data.json` - 5 mock bookings (confirmed, completed, cancelled)
- `app/offers/data.json` - 6 promotional offers with promo codes

---

## License

Private project. All rights reserved.
