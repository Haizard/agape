# AGAPE LUTHERAN JUNIOR SEMINARY School Management System

> Last updated: April 17, 2025 - Fixed A-Level marks entry for students without subject combinations

This is a comprehensive school management system for AGAPE LUTHERAN JUNIOR SEMINARY, featuring student management, teacher management, academic management, and result reporting for both O-Level and A-Level education systems.

## Project Structure

- **Backend**: Node.js/Express API
- **Frontend**: React application

## Key Features

- **Academic Management**: Manage academic years, terms, classes, and subjects
- **Marks Entry**: Enter and manage student marks, with offline capability
- **Unified Reports System (v2.0)**: Comprehensive reporting for both O-Level and A-Level students
- **Batch Report Download**: Download multiple student reports at once
- **Offline Capability**: Work offline and sync when online
- **SMS Notifications**: Send SMS notifications to parents and students

### Deprecated Features

The following report types have been deprecated and replaced by the Unified Reports System (v2.0):

- A-Level Comprehensive Report
- Academic Report Book
- Tabular Academic Report

## Deployment on Render

This project is configured for deployment on Render using the `render.yaml` Blueprint file.

### Automatic Deployment

1. Fork or clone this repository to your GitHub account
2. Create a new Render account or log in to your existing account
3. Go to the Dashboard and click "New Blueprint"
4. Connect your GitHub account and select this repository
5. Click "Apply Blueprint"
6. Render will automatically deploy the backend API, frontend application, and create a MongoDB database

### Manual Deployment

If you prefer to deploy the services manually:

#### Backend API

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: st-john-vianey-api (or your preferred name)
   - **Runtime**: Node
   - **Root Directory**: backend
   - **Build Command**: npm install
   - **Start Command**: npm start
   - **Health Check Path**: /api/health
4. Add the required environment variables (see .env.example)
5. Click "Create Web Service"

#### Frontend Application

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: st-john-vianey-frontend (or your preferred name)
   - **Runtime**: Node
   - **Root Directory**: frontend/school-frontend-app
   - **Build Command**: npm install && npm run build
   - **Start Command**: npm start
   - **Health Check Path**: /health
4. Add the required environment variables:
   - NODE_ENV: production
   - REACT_APP_API_URL: https://your-backend-api-url.onrender.com/api
   - REACT_APP_USE_MOCK_DATA: false
5. Click "Create Web Service"

#### Database

1. Create a new MongoDB database on Render
2. Configure the database:
   - **Name**: st-john-vianey-db (or your preferred name)
   - **Database Name**: john_vianey
3. Copy the connection string and add it to your backend service's environment variables

## Local Development

### Backend

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example`

4. Start the development server:
   ```
   npm run dev
   ```

### Frontend

1. Navigate to the frontend directory:
   ```
   cd frontend/school-frontend-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

## Features

- User authentication and authorization
- Student management
- Teacher management
- Class management
- Subject management
- Academic year and term management
- Marks entry and result calculation
- Report generation for O-Level and A-Level
- Financial management
- SMS notifications
- Offline data entry with synchronization for teachers

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.
