# Next.js + Drizzle + Neon Deployment Guide to Vercel

Detailed guide for deploying the Transportation Management System application to Vercel with Neon database.

## 🛠️ Preparation

### 1. Create Neon Database Account

1. Visit [Neon Console](https://console.neon.tech/)
2. Create an account or sign in
3. Create a new project:
   - **Project name**: `container-mm-db`
   - **Database name**: `container_mm`
   - **Region**: Singapore (closest to Vietnam)
4. Copy the **Connection String** from the dashboard

### 2. Prepare Repository

```bash
# Install new dependencies
pnpm install

# Check local build
pnpm run validate
pnpm run build

# Test database connection (optional)
pnpm run db:status
```

## 🚀 Deploy to Vercel

### Step 1: Connect Repository to Vercel

1. Visit [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"New Project"**
3. Import repository from GitHub:
   - Select repository `container-mm`
   - **Root Directory**: `apps/web`
   - **Framework Preset**: Next.js

### Step 2: Configure Environment Variables

In Vercel Project Settings → Environment Variables, add:

```bash
# Database
DATABASE_URL=postgresql://username:password@ep-xxx.region.aws.neon.tech/container_mm?sslmode=require

# NextAuth
NEXTAUTH_URL=https://your-app-domain.vercel.app
NEXTAUTH_SECRET=your-super-secure-secret-minimum-32-characters

# Application URLs
NEXT_PUBLIC_APP_URL=https://your-app-domain.vercel.app
NEXT_PUBLIC_API_URL=https://your-app-domain.vercel.app/api/v1

# Build Settings (optional)
ANALYZE=false
```

**Important**: 
- Set environment variables for **Production**, **Preview**, and **Development**
- NEXTAUTH_SECRET must be at least 32 characters
- DATABASE_URL must end with `?sslmode=require` for Neon

### Step 3: Configure Build Settings

In Project Settings → General:

- **Build Command**: `pnpm run vercel-build`
- **Output Directory**: `.next`
- **Install Command**: `pnpm install`
- **Development Command**: `pnpm run dev`

### Step 4: Deploy

1. Click **"Deploy"** in Vercel
2. Wait for the build process to complete (2-5 minutes)
3. Check logs if there are any errors

## 🔧 Database Migration

### Automatic (Recommended)

Database migrations will run automatically when deploying with the `vercel-build` script.

### Manual (If needed)

```bash
# In local with production database
DATABASE_URL="postgresql://..." pnpm run db:migrate:prod

# Check status
DATABASE_URL="postgresql://..." pnpm run db:status
```

## ✅ Verify Deployment

### 1. Health Check
- Visit `https://your-domain.vercel.app`
- Check the login page
- Test authentication with admin/admin123

### 2. Database Check
```bash
# Run from local with production DATABASE_URL
pnpm run db:status
```

### 3. Performance Check
- Check Core Web Vitals in Vercel Analytics
- Test load time < 3 seconds
- Check mobile responsiveness

## 🔍 Troubleshooting

### Common Errors

**1. Database Connection Failed**
```
Error: connect ETIMEDOUT
```
**Solution**:
- Check if DATABASE_URL has the correct format
- Add `?sslmode=require` to the end of URL
- Check if Neon database is running

**2. Build Failed - Environment Variables**
```
Error: NEXTAUTH_SECRET must be at least 32 characters
```
**Solution**:
- Generate secret: `openssl rand -base64 32`
- Update environment variables in Vercel

**3. Migration Failed**
```
Error: relation "users" does not exist
```
**Solution**:
```bash
# Run migrations manually
DATABASE_URL="postgresql://..." pnpm run db:migrate:prod
```

**4. Build Timeout**
**Solution**:
- Increase timeout in `vercel.json`
- Optimize dependencies
- Use edge functions

### Debug Commands

```bash
# Check database connection
pnpm run db:status

# Check migrations
pnpm run db:check

# Build with analysis
pnpm run analyze

# Test production build locally  
pnpm run build && pnpm run start
```

## 📊 Performance Optimization

### 1. Database Optimization
- Connection pooling automatically configured
- SSL connection for security
- Proper indexes in migrations

### 2. Bundle Optimization
- Automatic code splitting
- Image optimization with next/image
- Webpack chunk optimization

### 3. Monitoring
- Vercel Analytics automatically enabled
- Database connection monitoring
- Error tracking with Vercel

## 🔒 Security Checklist

- [ ] NEXTAUTH_SECRET ≥ 32 characters
- [ ] DATABASE_URL with SSL mode
- [ ] Security headers in next.config.ts
- [ ] HTTPS redirect automatic
- [ ] Environment variables don't expose sensitive data
- [ ] CORS configuration proper

### SSL Certificate
- Vercel automatically provides SSL certificate
- HTTPS redirect automatic
- HTTP/2 enabled by default

## 📈 Post-Deployment

### 1. Monitoring Setup
- Enable Vercel Analytics
- Setup error tracking
- Monitor database performance

### 2. Backup Strategy
- Neon automatic daily backups
- Point-in-time recovery available
- Export data script if needed

### 3. Scaling Preparation
- Database connection pooling ready
- CDN optimization active
- Edge functions support
