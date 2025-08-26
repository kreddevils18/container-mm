# Docker Development Setup Guide

Docker setup for Next.js 15 + Drizzle ORM + PostgreSQL development environment.

## Quick Start

1. **Copy environment template:**
   ```bash
   cp .env.docker.example .env.docker
   ```

2. **Configure environment variables:**
   Edit `.env.docker` and set required values (NEXTAUTH_SECRET is mandatory)

3. **Start development environment:**
   ```bash
   pnpm run docker:up
   ```

4. **Run database migrations:**
   ```bash
   pnpm run docker:db:migrate
   ```

5. **Access the application:**
   - Web App: http://localhost:3000
   - pgAdmin: http://localhost:5050 (start with `pnpm run docker:pgadmin`)
   - Health Check: http://localhost:3000/api/health

## Available Commands

### Basic Docker Operations
```bash
pnpm run docker:up               # Start development containers
pnpm run docker:build            # Build containers
pnpm run docker:up:build         # Rebuild and start containers
pnpm run docker:down             # Stop all containers
pnpm run docker:logs             # View container logs
pnpm run docker:clean            # Clean up containers and volumes
```

### Database Operations
```bash
pnpm run docker:db:migrate       # Run database migrations
pnpm run docker:db:seed          # Seed database with sample data
pnpm run docker:db:studio        # Open Drizzle Studio
pnpm run docker:db:status        # Check database status
pnpm run docker:db:generate      # Generate new migrations
```

### Development Tools
```bash
pnpm run docker:shell            # Access web container shell
pnpm run docker:postgres         # Access PostgreSQL CLI
pnpm run docker:pgadmin          # Start pgAdmin service
pnpm run docker:pgadmin:down     # Stop pgAdmin service
```

## Database Migrations

Migrations are run directly in the web container instead of a dedicated migration service:

```bash
# Run migrations
pnpm run docker:db:migrate

# Check migration status  
pnpm run docker:db:status

# Generate new migrations (after schema changes)
pnpm run docker:db:generate
```

**Migration Strategy:**
- Migrations run inside the main web container
- Database connectivity handled through Docker networking
- No separate migration container needed

## Environment Configuration

### Required Environment Variables
- `POSTGRES_DB`: Database name (default: container_mm_dev)
- `POSTGRES_USER`: Database username (default: postgres)
- `POSTGRES_PASSWORD`: Database password
- `NEXTAUTH_SECRET`: NextAuth secret (32+ characters)

### Optional Variables
- `PGADMIN_EMAIL`: pgAdmin login email
- `PGADMIN_PASSWORD`: pgAdmin login password
- `WEB_PORT`: Web application port (default: 3000)
- `POSTGRES_PORT`: PostgreSQL port (default: 5432)
- `NEXT_TELEMETRY_DISABLED`: Disable Next.js telemetry (default: 1)

## Architecture

### Services
- **web**: Next.js 15 application (development mode with hot reload)
- **postgres**: PostgreSQL 16 database with persistent storage  
- **pgadmin**: Database administration (optional, dev-tools profile)

### Development Features
- Live code reloading with volume mounts
- Hot module replacement for fast development
- PostgreSQL database with persistent data
- pgAdmin for database management
- Automatic dependency caching

### Volumes
- `postgres_dev_data`: Persistent database storage for development
- `node_modules`: Optimized dependency caching
- `nextjs_cache`: Next.js build cache
- Source code: Live-mounted for development hot reload

### Networks
- Custom bridge network for service communication
- Isolated container networking with DNS resolution

## Troubleshooting

### Common Issues

**Port conflicts:**
```bash
# Check what's using the port
lsof -i :3000
lsof -i :5432
```

**Database connection issues:**
```bash
# Check container health
docker-compose ps
docker-compose logs postgres
```

**Permission issues:**
```bash
# Reset file permissions
sudo chown -R $USER:$USER .
```

### Health Checks
- Web app: http://localhost:3000/api/health
- Database: Automatic health checks with retry logic
- Container status: `docker-compose ps`

### Logs and Debugging
```bash
# View all logs
pnpm run docker:logs

# View specific service logs
docker-compose logs -f web
docker-compose logs -f postgres

# Access container shell
pnpm run docker:shell

# Check container status
docker-compose ps
```