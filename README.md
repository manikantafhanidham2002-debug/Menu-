# L'Atelier Gourmet — Luxury Editorial Restaurant Menu

A luxury editorial digital restaurant menu web application replicating the reference menu board with interactive ordering, dish quick-view modal, live cart, table reservation, search filtering, and print support.

---

## Key Features

1. **Editorial Restaurant Menu Board (Exact Reference Layout)**:
   - 3-column newspaper/editorial layout featuring **Food Starter**, **Main Course**, **Pasta**, **Special Menu**, **Burger**, **Fresh Drinks**, **House Coffee**, and **Dessert Menu**.
   - Badges: *"EST 2023"*, *"OPEN HOURS 3PM - 10PM DAILY"*.
   - Centerpiece feature: *"All Day Breakfast with Coffee"*.
   - Dot leaders, price columns ($10 / $5), and curated food photography.

2. **Interactive Live Order & Cart System**:
   - Slide-out order drawer with quantity adjustments, 8% tax calculation, subtotal, and checkout.
   - Order data persisted in `localStorage`.

3. **Dish Quick-View Modal**:
   - High-resolution photography, caloric info, preparation time, allergen warnings, and custom add-to-cart.

4. **Table Reservation Modal**:
   - Booking dialog with date picker, time slot selector, guest count, and special requests.

5. **Instant Search & Category Filters**:
   - Real-time search across all 35+ dishes, drinks, and ingredients.

6. **Web Audio Sound Effects**:
   - Synthesized tactile clicks and melodic order chimes with zero external audio assets.

7. **Theme Switcher & Print-Ready**:
   - Dark Luxury Bistro Mode vs. Warm Editorial Parchment Mode.
   - Dedicated print stylesheet (`@media print`) for printing physical menu boards.

---

## File Structure

```
├── index.html                  # Main Restaurant Menu Web Application
├── style.css                   # Luxury Editorial Styling, Tokens & Print Rules
├── app.js                      # Menu Controller, Audio, Cart & Dialog Logic
├── menu-data.js                # Full 35+ Dish Catalog & Categories
├── CompleteShelfLandingPage.jsx# React Component Wrapper
└── README.md                   # Documentation & Setup Guide
```

---

## Quick Start

Run any static local server from the project directory:

```bash
# Python 3
python -m http.server 8080

# Node.js npx
npx serve .
```

Open `http://localhost:8080` in your web browser.
