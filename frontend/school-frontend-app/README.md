# AGAPE LUTHERAN JUNIOR SEMINARY School Management System

A comprehensive school management system for AGAPE LUTHERAN JUNIOR SEMINARY, supporting both O-Level and A-Level education systems.

## Features

- **Academic Management**: Manage academic years, terms, classes, and subjects
- **Marks Entry**: Enter and manage student marks, with offline capability for marks, students, classes, and subjects
- **Unified Reports System (v2.0)**: Generate and download comprehensive reports for both O-Level and A-Level students
- **Batch Report Download**: Download multiple student reports at once with filtering options
- **Offline Capability**: Work offline and sync when online
- **SMS Notifications**: Send SMS notifications to parents and students with multiple provider support

## Technology Stack

- React.js
- Material UI
- Express.js (for production server)
- IndexedDB (for offline storage)

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/st-john-vianey-frontend.git
   cd st-john-vianey-frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Available Scripts

- `npm run dev` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm start` - Runs the production server (after building)
- `npm test` - Runs tests
- `npm run lint` - Lints and fixes files

## Deployment on Render

This project is configured for easy deployment on Render.

### Automatic Deployment

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Select the repository
4. Render will automatically detect the configuration from `render.yaml`
5. Click "Create Web Service"

### Manual Deployment

1. Create a new Web Service on Render
2. Configure the following settings:
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `NODE_ENV`: `production`
     - `REACT_APP_API_URL`: `https://st-john-vianey-api.onrender.com/api`
     - `REACT_APP_USE_MOCK_DATA`: `false`

## Environment Variables

- `REACT_APP_API_URL`: URL of the backend API
- `REACT_APP_USE_MOCK_DATA`: Whether to use mock data (for development)
- `NODE_ENV`: Environment (development, production)

## Project Structure

- `src/components`: React components
  - `academic`: Academic management components
  - `marks`: Marks entry components
  - `results`: Report generation components (Unified Reports System v2.0)
  - `admin`: Administrative components including SMS settings
  - `common`: Common components
- `src/services`: Service modules
  - `offlineDataService.js`: Service for offline data storage and sync
  - `unifiedApi.js`: Service for API communication
- `src/routes`: Application routes
- `public`: Static assets

## Notes

### Deprecated Features

The following report types have been deprecated and replaced by the Unified Reports System (v2.0):

- A-Level Comprehensive Report
- Academic Report Book
- Tabular Academic Report

### Offline Support

Offline support is currently available for:

- Marks entry
- Student data
- Class data
- Subject data

Data is automatically synced when the application comes back online.

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.
