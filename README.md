# Smart Traffic Management Dashboard

A modern, frontend-only React application simulating an AI-driven Smart Traffic Management System. This MVP demonstrates real-time traffic monitoring, signal control, emergency routing, and a full simulated Role-Based Access Control (RBAC) authentication flow.

## 🌟 Key Features

- **RBAC Authentication Simulation:** 
  - Full login system with strict credential validation for `ADMIN`, `TRAFFIC_CONTROLLER`, `EMERGENCY_DRIVER`, and `CITIZEN` roles.
  - Route guarding and dynamic sidebar rendering based on verified roles.
- **Live Traffic Map:** 
  - Interactive Leaflet map centered precisely on **PSG College of Technology, Coimbatore**.
  - Visual tracking nodes indicating localized traffic congestion, vehicle counts, and active signal states.
- **Signal Control & Digital Twin:** 
  - Real-time simulated interfaces for controlling junction infrastructure and monitoring a digital twin environment.
- **Modern UI/UX:** 
  - Built with Tailwind CSS and Framer Motion for a sleek, responsive, and highly animated aesthetic.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (Node Package Manager)

### Installation

1. Navigate to the project directory.

2. Install the required dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

### 🔐 Simulated Credentials
To log in and explore the various role-gated views, use the following simulated credentials. 

**Password for ALL roles:** `test1234`

| Role | Required Email |
|------|-------|
| Administrator | `admin@gmail.com` |
| Traffic Controller | `trafic@gmail.com` |
| Emergency Unit | `driver@gmail.com` |
| Citizen Portal | `person@gmail.com` |

## 🛠️ Tech Stack
- **Core:** React 19 + Vite
- **Styling:** Tailwind CSS, `clsx`, `tailwind-merge`
- **Routing:** React Router DOM
- **Maps:** React Leaflet (`leaflet`)
- **Visuals:** Recharts (Analytics), Lucide React (Icons), Framer Motion (Animations)
