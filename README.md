# ScholarisPage

Web client for the Scholaris school management platform.

**Repository:** https://github.com/rezio23/ScholarisClient.git
**Live project:** https://scholaris-educate.vercel.app/

## Related Projects

- **Scholaris API Server** — Backend API that powers both the web client and mobile app. (https://github.com/rezio23/Scholaris.git)
- **ScholarisMobile** — Native Android app for students to scan attendance QR codes. (https://github.com/rezio23/ScholarisMobile.git)

## Overview

ScholarisPage is a role-based React web application that provides the main user interface for administrators, teachers, and students. It connects to the Scholaris API backend and supports daily workflows such as attendance tracking, class schedules, gradebooks, fee management, certificates, and resource sharing.

## Features

- **Authentication** — Login and registration with role-based access.
- **Admin dashboard** — Manage students, teachers, classes, subjects, schedules, academic years, semesters, time slots, enrollments, invoices, payments, reports, and lesson resources.
- **Teacher dashboard** — View classes, take attendance (with QR code generation), manage assignments, enter grades, view student lists, and upload resources.
- **Student dashboard** — View schedules, attendance history, grades, certificates, invoices, class resources, and personal profile.
- **QR attendance** — Teachers generate a QR code for a class schedule; students scan it with the ScholarisMobile app to mark attendance.
- **Reports & analytics** — Visual charts for attendance and performance insights.
- **PDF & certificate generation** — Export certificates and reports as PDFs.

## Tech Stack

- React 18
- Vite
- React Router
- Axios
- Recharts
- html2canvas + jsPDF
- qrcode.react
- CSS3

## Project Structure

```
ScholarisPage/
├── public/                 # Static assets
├── src/
│   ├── api/                # API call functions
│   ├── components/         # Reusable UI components
│   ├── constants/          # App constants
│   ├── context/            # React context providers
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components by role
│   │   ├── admin/
│   │   ├── student/
│   │   └── teacher/
│   ├── routes/             # Route configuration
│   ├── services/           # Service layer
│   ├── utils/              # Utility functions
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env.example            # Example environment variables
├── index.html
├── package.json
├── vite.config.js
└── vercel.json             # Vercel deployment settings
```

## Setup

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/rezio23/ScholarisClient.git
   cd ScholarisPage
   npm install
   ```

2. Create a `.env` file from the example:

   ```bash
   cp .env.example .env
   ```

3. Update `API_URL` in `.env` to point to your Scholaris API backend:

   ```env
   API_URL=http://localhost:3000
   ```

## Development

Start the development server:

```bash
npm run dev
```

The app will open at `http://localhost:5173` by default.

## Build

Create an optimized production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Deployment

The project is configured for deployment on Vercel using `vercel.json`:

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

You can also deploy the contents of the `dist/` folder to any static hosting provider.

## Environment Variables

| Variable        | Description                          | Example                          |
|-----------------|--------------------------------------|----------------------------------|
| `API_URL`       | Base URL of the Scholaris API server | `https://api.scholaris.edu`      |

