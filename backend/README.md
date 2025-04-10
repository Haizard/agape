# St. John Vianney School Management System - Backend API

This is the backend API for the St. John Vianney School Management System.

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

## Technology Stack

- Node.js
- Express.js
- MongoDB
- JWT Authentication

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/st-john-vianey.git
   cd st-john-vianey/backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:

   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/john_vianey
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_jwt_refresh_secret
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

## Deployment on Render

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
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Environment Variables**:
     - `NODE_ENV`: `production`
     - `PORT`: `5000`
     - `MONGODB_URI`: Your MongoDB connection string
     - `JWT_SECRET`: A secure random string
     - `JWT_REFRESH_SECRET`: Another secure random string
     - `USE_MOCK_DATA`: `false`

## API Documentation

### Authentication

- `POST /api/users/login` - Login
- `POST /api/users/register` - Register a new user
- `POST /api/users/refresh-token` - Refresh JWT token

### Students

- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get a student by ID
- `POST /api/students` - Create a new student
- `PUT /api/students/:id` - Update a student
- `DELETE /api/students/:id` - Delete a student

### Classes

- `GET /api/classes` - Get all classes
- `GET /api/classes/:id` - Get a class by ID
- `GET /api/classes/:id/students` - Get students in a class
- `POST /api/classes` - Create a new class
- `PUT /api/classes/:id` - Update a class
- `DELETE /api/classes/:id` - Delete a class

### Subjects

- `GET /api/subjects` - Get all subjects
- `GET /api/subjects/:id` - Get a subject by ID
- `POST /api/subjects` - Create a new subject
- `PUT /api/subjects/:id` - Update a subject
- `DELETE /api/subjects/:id` - Delete a subject

### Academic Years

- `GET /api/academic-years` - Get all academic years
- `GET /api/academic-years/:id` - Get an academic year by ID
- `POST /api/academic-years` - Create a new academic year
- `PUT /api/academic-years/:id` - Update an academic year
- `DELETE /api/academic-years/:id` - Delete an academic year

### Results

- `GET /api/results` - Get all results
- `GET /api/results/report/:studentId` - Get a student's report
- `POST /api/results` - Create a new result
- `PUT /api/results/:id` - Update a result
- `DELETE /api/results/:id` - Delete a result

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.
