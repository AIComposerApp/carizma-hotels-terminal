# Carizma Luxury Hotels — Front Desk Terminal

A mobile-first, PWA-ready front desk terminal for Carizma Luxury Hotels & Suites (Lagos, Nigeria). Provides real-time inventory management, walk-in booking, and reservation tracking — all synced with the WhatsApp AI reservation agent.

## Features

- 📱 **Mobile-first design** — Bottom navigation, touch-optimized controls, card-based layouts
- 🏨 **Live inventory dashboard** — Real-time room/space availability across 3 branches
- 📝 **Walk-in booking** — Create bookings that instantly sync with WhatsApp reservations
- 📋 **Reservation management** — Filter by branch, status, and source
- 🔄 **Auto-refresh** — Inventory updates every 30 seconds
- 🔒 **Safe area support** — Notch-safe padding, PWA meta tags for home-screen install

## Branches

1. **Abule-Egba** — Entertainment & nightlife hub (nightclub, pool, Ladies' Nights)
2. **Ikeja** — Corporate & long-stay serviced apartments (50 units, 4-star)
3. **Oshodi** — Transit-friendly, 5 min from airport (rooftop bar, meeting halls)

## Deploy on Vercel

1. Fork or clone this repo
2. Go to [vercel.com](https://vercel.com) and import the repo
3. No build step needed — it's a static site
4. Deploy — that's it

## Tech Stack

- Single HTML file (no build step)
- Tailwind CSS (via CDN)
- Inter font (Google Fonts)
- Vanilla JavaScript
- Talks to Base44 backend functions via REST API

## Backend

The terminal communicates with deployed backend functions on Base44:
- `get_inventory` — Fetch all room/space statuses
- `check_availability` — Check available rooms by branch
- `front_desk_booking` — Create a walk-in booking
- `list_reservations` — List/filter all reservations

## License

Proprietary — Carizma Luxury Hotels & Suites
