# GGClicks AI Development Guide

This guide provides essential context for AI agents working with the GGClicks codebase.

## Architecture Overview

- **Frontend** (`/frontend`): React SPA using Vite + Material UI
  - Routes managed through React Router
  - Global auth state via Context API (`/frontend/src/context/AuthContext.jsx`)
  - API integration through service modules (`/frontend/src/services/`)

- **Backend** (`/backend`): Node.js/Express REST API
  - MongoDB for data persistence
  - JWT-based authentication
  - Cloudinary for image storage
  - Email notifications via Nodemailer

## Key Development Workflows

1. **Running the Application**
   ```bash
   # Backend (Port 5000)
   cd backend
   npm run dev   # Development with hot reload
   npm run seed  # Initialize database with sample data
   
   # Frontend (Port 5173)
   cd frontend
   npm run dev   # Start Vite dev server
   ```

2. **Environment Setup**
   - Backend requires `.env` with MongoDB connection, JWT secret, and Cloudinary/SMTP credentials
   - Frontend needs `.env` with `VITE_API_URL` pointing to backend

## Project Conventions

### API Patterns
- RESTful endpoints under `/api` prefix
- Standard response format: `{ data, error }`
- Mouse product slugs used as identifiers in URLs
- Protected routes require `Authorization: Bearer <token>` header

### Component Structure
- Page components in `/frontend/src/pages/`
- Reusable UI components in `/frontend/src/components/`
- Consistent use of Material UI theming
- Form validation handled client-side with inline error states

### Data Flow
- API calls centralized in service modules
- Authentication state managed globally via context
- Form data handling with controlled components
- Image upload workflow: Frontend → Backend → Cloudinary

## Integration Points

1. **Authentication Flow**
   - User registration with email verification
   - Admin/User separate login flows
   - Password reset via email tokens

2. **Product Management**
   - Mouse catalog with filtering/sorting
   - Admin CRUD operations for products
   - Image upload with Cloudinary integration

## Key Files for Common Tasks

- Frontend routing: `/frontend/src/App.jsx`
- API service configuration: `/frontend/src/services/api.js`
- Backend entry point: `/backend/src/index.js`
- Database models: `/backend/src/models/`
- Authentication middleware: `/backend/src/middleware/auth.js`

## Debugging Tips

- Check `.env` files when API connections fail
- Monitor network tab for API response errors
- Image upload issues often relate to Cloudinary credentials
- Authentication errors typically involve JWT expiration or malformed tokens