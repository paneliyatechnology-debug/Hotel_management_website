# 🌐 Multi-Tenant Hotel Management - Public Web Portal

Modern, responsive, and high-performance public-facing landing and onboarding web application for the **Multi-Tenant Hotel Management Platform**. Built with **Next.js (App Router)**, **React**, and modern CSS styling.

---

## 🌟 Key Features

- 🏨 **Hotel Self-Registration & Onboarding**:
  - Step-by-step interactive wizard for hotel owners to onboard their property.
  - Custom subdomain/slug reservation (e.g. `hotel.com/grand-palace`).
  - Plan selection & trial activation.
- 💎 **Interactive Landing & Showcase**:
  - Premium hero section, feature spotlights, interactive statistics, and social proof.
  - Live animated demonstration previewing front-desk operations.
- 💰 **Subscription & Pricing Matrix**:
  - Dynamic pricing plans (Starter, Professional, Enterprise) loaded directly from the backend API.
  - Monthly / Annual billing toggles with feature breakdown.
- 📱 **Fully Responsive Design**:
  - Mobile-first adaptive layout with desktop header & mobile floating bottom navigation dock.
- 🔗 **Direct Integration with Backend API**:
  - Live health status, API service communication, and dynamic hotel slug validation.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **UI Library**: [React 19](https://react.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Styling**: CSS Modules & Vanilla Modern CSS Design System (Custom Glassmorphism & Micro-animations)
- **HTTP Client**: Native Fetch with centralized API configuration

---

## 📁 Project Structure

```text
web/
├── public/                # Static assets, SVG icons, and graphics
├── src/
│   ├── app/
│   │   ├── contact/       # Contact us & customer inquiry page
│   │   ├── features/      # Comprehensive feature breakdown page
│   │   ├── pricing/       # Subscription plans & pricing tier page
│   │   ├── register-hotel/# Hotel onboarding & self-registration wizard
│   │   ├── globals.css    # Global stylesheet & design tokens
│   │   ├── layout.js      # Root layout with Header & Footer
│   │   ├── page.js        # Main landing / Home page
│   │   └── page.module.css# Page-specific scoped styles
│   ├── components/
│   │   ├── FloatingTabBar.jsx  # Mobile quick-action navigation dock
│   │   ├── Footer.jsx          # Multi-column footer with links
│   │   └── Navbar.jsx          # Responsive sticky navigation bar
│   └── config/
│       ├── api.js         # Backend API base endpoints & environment bindings
│       └── theme.js       # Color palette & branding constants
├── eslint.config.mjs      # Linting configuration
├── jsconfig.json          # Path aliases config
├── next.config.mjs        # Next.js configuration
└── package.json           # Dependencies and scripts
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0 or higher
- **Backend Service**: Running on `http://localhost:5000` (or configured API URL)

### 2. Installation

```bash
git clone https://github.com/paneliyatechnology-debug/Hotel_management_website.git
cd Hotel_management_website
npm install
```

### 3. Environment Configuration

Create a `.env.local` file if you want to override the default API base URL:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

### 4. Running Locally

```bash
# Start the Next.js development server on port 3000
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the web application.

### 5. Production Build

```bash
# Build production bundle
npm run build

# Start production server
npm start
```

---

## 🧭 Page Routes

| Route | Purpose |
| :--- | :--- |
| `/` | Landing page with platform overview and CTA |
| `/features` | Deep dive into hotel administration & front-desk capabilities |
| `/pricing` | Tiered subscription plans, pricing comparison & FAQs |
| `/contact` | Inquiry form, sales contact, and support details |
| `/register-hotel` | Self-service registration wizard for new hotel onboarding |

---

## 📜 License

This project is proprietary and confidential. Developed by Paneliya Technology.
