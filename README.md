# ApexStock — Business Inventory Tracker

A browser-based stock management system built with vanilla JavaScript, HTML, and CSS. No frameworks, no backend, no dependencies beyond two CDN libraries.

## Features

- **Live dashboard** — total products, inventory value, low-stock count, and out-of-stock count updated in real time
- **Full CRUD** — add, edit, and delete products with client-side validation and XSS protection
- **Stock status** — automatic In Stock / Low Stock / Out of Stock badges based on per-product thresholds
- **Search & filter** — filter by product name and category simultaneously
- **Export** — one-click CSV download and formatted PDF report via jsPDF

## Tech Stack

| Layer | Choice |
|-------|--------|
| Logic | Vanilla JavaScript (ES6+) |
| Styling | CSS custom properties, CSS Grid, Flexbox |
| Icons | Lucide Icons (CDN) |
| PDF Export | jsPDF (CDN) |
| Storage | Browser localStorage |

## Getting Started

No build step required. Just clone and open.

```bash
git clone https://github.com/YOUR_USERNAME/apexstock.git
cd apexstock
# Open index.html in your browser
open index.html        # macOS
start index.html       # Windows
xdg-open index.html   # Linux
```

All three files must be in the same folder:

```
apexstock/
├── index.html
├── style.css
└── app.js
```

## Usage

1. **Add a product** — fill in the form on the left (name, category, quantity, price, threshold) and click Add Product
2. **Edit** — click the pencil icon on any row; the form pre-fills for editing
3. **Delete** — click the trash icon; confirms before removing
4. **Search** — type in the search box to filter by name; use the dropdown to filter by category
5. **Export** — Export CSV downloads a spreadsheet-ready file; Export PDF generates a formatted inventory report

## Limitations & Planned Improvements

- Data is stored in localStorage — single device/browser only
- No user authentication or role-based access
- No change history or audit log

**Planned:** 
Firebase/Supabase backend for multi-device sync, user login, and change history.

## License

MIT
