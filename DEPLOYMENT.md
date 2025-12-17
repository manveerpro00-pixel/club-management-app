# 🚀 Deployment Guide

## Quick Deploy Options

### Option 1: Local Development (Recommended for Testing)

```bash
# Clone and run
git clone https://github.com/manveerpro00-pixel/club-management-app.git
cd club-management-app
npm install
npm run dev
```

Visit: `http://localhost:3000`

### Option 2: Deploy to Render.com (Free)

1. Fork this repository
2. Go to [Render.com](https://render.com)
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: club-management-app
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Click "Create Web Service"

Your app will be live at: `https://club-management-app.onrender.com`

### Option 3: Deploy to Railway.app (Free)

1. Go to [Railway.app](https://railway.app)
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Choose this repository
5. Railway auto-detects Node.js and deploys

Your app will be live at: `https://your-app.railway.app`

### Option 4: Deploy to Heroku

```bash
# Install Heroku CLI
heroku login
heroku create club-management-app

# Deploy
git push heroku main

# Open app
heroku open
```

### Option 5: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## Environment Variables

No environment variables required! The app works out of the box.

Optional:
- `PORT` - Server port (default: 3000)
- `JWT_SECRET` - Custom JWT secret (default: 'club-secret-key-2024')

## Production Checklist

- [ ] Change JWT_SECRET in production
- [ ] Use a real database (MongoDB, PostgreSQL) instead of JSON file
- [ ] Add HTTPS/SSL certificate
- [ ] Set up proper logging
- [ ] Add rate limiting
- [ ] Configure CORS properly
- [ ] Add input validation
- [ ] Set up monitoring

## Database Migration (Production)

For production, replace JSON file storage with a real database:

**MongoDB Example**:
```javascript
// Replace readDB/writeDB with MongoDB operations
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);
```

**PostgreSQL Example**:
```javascript
// Replace readDB/writeDB with PostgreSQL queries
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

## Security Enhancements for Production

1. **Change default credentials** in server.js
2. **Use environment variables** for secrets
3. **Add rate limiting**:
```javascript
const rateLimit = require('express-rate-limit');
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
```

4. **Add helmet for security headers**:
```javascript
const helmet = require('helmet');
app.use(helmet());
```

5. **Enable CORS properly**:
```javascript
const cors = require('cors');
app.use(cors({ origin: 'https://yourdomain.com' }));
```

## Monitoring

Add logging and monitoring:

```javascript
// Winston for logging
const winston = require('winston');
const logger = winston.createLogger({
  transports: [new winston.transports.File({ filename: 'app.log' })]
});

// Sentry for error tracking
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

## Backup Strategy

For production, implement regular backups:

```bash
# Backup database.json
cp database.json backups/database-$(date +%Y%m%d).json

# Automated daily backups
0 0 * * * /path/to/backup-script.sh
```

## Performance Optimization

1. **Enable compression**:
```javascript
const compression = require('compression');
app.use(compression());
```

2. **Add caching**:
```javascript
const apicache = require('apicache');
app.use(apicache.middleware('5 minutes'));
```

3. **Use PM2 for process management**:
```bash
npm install -g pm2
pm2 start server.js -i max
pm2 save
pm2 startup
```

## Support

For issues or questions, open an issue on GitHub:
https://github.com/manveerpro00-pixel/club-management-app/issues
