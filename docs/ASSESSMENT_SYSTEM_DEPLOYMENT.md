# Assessment System Deployment Guide

## Prerequisites

1. **Environment Setup**
   - Node.js v14 or higher
   - MongoDB v4.4 or higher
   - npm or yarn package manager

2. **Configuration Files**
   - `.env` file with required environment variables
   - `vercel.json` for Vercel deployment
   - `render.yaml` for Render deployment

## Deployment Steps

### 1. Database Migration

```bash
# Run the migration script
node backend/scripts/migrateToAssessments.js
```

Verify migration success by checking:
- All exams converted to assessments
- Results properly linked
- Weightage calculations correct

### 2. Backend Deployment

1. **Environment Variables**
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   NODE_ENV=production
   ```

2. **Build and Deploy**
   ```bash
   # Install dependencies
   cd backend
   npm install

   # Build
   npm run build

   # Start server
   npm start
   ```

### 3. Frontend Deployment

1. **Environment Variables**
   ```env
   REACT_APP_API_URL=your_backend_api_url
   REACT_APP_ENV=production
   ```

2. **Build and Deploy**
   ```bash
   # Install dependencies
   cd frontend/school-frontend-app
   npm install

   # Build
   npm run build

   # Deploy build folder
   ```

## Verification Steps

1. **Database Verification**
   - Check assessment collections
   - Verify indexes
   - Test queries performance

2. **API Verification**
   ```bash
   # Health check
   curl https://your-api.com/health

   # Test authentication
   curl https://your-api.com/api/auth/login
   ```

3. **Frontend Verification**
   - Test login functionality
   - Create test assessment
   - Generate sample report

## Monitoring Setup

1. **Error Logging**
   - Configure error tracking service
   - Set up alert notifications
   - Monitor error rates

2. **Performance Monitoring**
   - API response times
   - Database query performance
   - Frontend load times

## Backup Procedures

1. **Database Backups**
   ```bash
   # Automated daily backup
   mongodump --uri="your_mongodb_uri" --out=/backup/$(date +%Y%m%d)
   ```

2. **Application Backups**
   - Source code versioning
   - Configuration files
   - Environment variables

## Rollback Procedures

1. **Database Rollback**
   ```bash
   # Restore from backup
   mongorestore --uri="your_mongodb_uri" --dir=/backup/20240315
   ```

2. **Application Rollback**
   - Revert to previous version
   - Restore configuration
   - Verify system state

## Security Measures

1. **Access Control**
   - Review user roles
   - Verify permissions
   - Update security policies

2. **Data Protection**
   - Enable encryption
   - Secure connections
   - Protect sensitive data

## Performance Optimization

1. **Database Optimization**
   ```javascript
   // Create indexes
   db.assessments.createIndex({ term: 1, status: 1 })
   db.results.createIndex({ assessmentId: 1, studentId: 1 })
   ```

2. **Application Optimization**
   - Enable caching
   - Optimize queries
   - Implement rate limiting

## Troubleshooting Guide

### Common Issues

1. **Database Connection**
   ```
   Error: MongoNetworkError
   Solution: Check network connectivity and MongoDB URI
   ```

2. **API Errors**
   ```
   Error: 401 Unauthorized
   Solution: Verify JWT token and authentication
   ```

3. **Frontend Issues**
   ```
   Error: API_URL not defined
   Solution: Check environment variables
   ```

### Resolution Steps

1. **Check Logs**
   ```bash
   # Backend logs
   pm2 logs assessment-api

   # Frontend logs
   npm run build -- --verbose
   ```

2. **Verify Configuration**
   - Environment variables
   - Database connection
   - API endpoints

## Support Contacts

- **Technical Support**: support@agapeseminary.edu
- **System Admin**: admin@agapeseminary.edu
- **Emergency Contact**: emergency@agapeseminary.edu

## Maintenance Schedule

1. **Daily Tasks**
   - Monitor error logs
   - Check system health
   - Verify backups

2. **Weekly Tasks**
   - Review performance metrics
   - Clean up temporary files
   - Update documentation

3. **Monthly Tasks**
   - Security audits
   - Performance optimization
   - System updates

## Version Control

Document version: 1.0.0
Last updated: March 2024