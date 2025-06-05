# Vana Relay Service

A NestJS-based relay service for Vana blockchain operations, user authentication, and social features.

## Prerequisites

- **Node.js**: >=16.0.0 
- **NPM**: >=8.0.0
- **Docker**: >=20.0.0
- **Docker Compose**: >=2.0.0
- **PostgreSQL**: 17.4+ (if running without Docker)

## Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd vana-relay-service
```

### 2. Environment Configuration
```bash
# Copy environment template
cp env-example-relational .env

# Edit the .env file with your configuration
# Important: Update the following variables:
# - API_KEY_SECRET (required for API key signing)
# - BLOCKCHAIN_PROVIDER (your Infura/Alchemy endpoint)
# - WALLET_PRIVATE_KEY (your wallet private key)
# - WALLET_ENCRYPTION_KEY (for wallet encryption)
# - CONTRACT_* addresses (smart contract addresses)
```

## Development Setup

### Option 1: Local Development

#### Install dependencies
```bash
npm ci
```

#### Setup PostgreSQL Database
```bash
# Option A: Using Docker for database only
docker run --name postgres-vana \
  -e POSTGRES_USER=root \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=api \
  -p 5432:5432 \
  -d postgres:17.4-alpine

# Option B: Install PostgreSQL locally
# Follow PostgreSQL installation guide for your OS
```

#### Run database migrations
```bash
npm run migration:run
```

#### Seed the database
```bash
npm run seed:run:relational
```

#### Start development server
```bash
# Regular development mode
npm run start:dev

# Development with SWC (faster compilation)
npm run start:swc

# Debug mode
npm run start:debug
```

The service will be available at:
- **API**: http://localhost:3000
- **Swagger Documentation**: http://localhost:3000/docs

### Option 2: Docker Development

#### Start all services
```bash
# Make sure .env file exists
cp env-example-relational .env

# Start services in detached mode
docker-compose up -d

# Or start with logs
docker-compose up
```

#### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f postgres
```

#### Stop services
```bash
docker-compose down

# Remove volumes (delete database data)
docker-compose down -v
```

## Production Deployment

### Using Docker Compose

#### 1. Prepare environment
```bash
# Copy and configure production environment
cp env-example-relational .env.production

# Edit .env.production with production values
# Important production configurations:
# - NODE_ENV=production
# - Strong passwords and secrets
# - Proper database configuration
# - SSL/TLS settings
# - Real blockchain provider URLs
```

#### 2. Deploy
```bash
# Build and start production services
docker-compose --env-file .env.production up -d --build
```

### Using Individual Docker Commands

#### Build the image
```bash
docker build -t vana-relay-service .
```

#### Run with external database
```bash
docker run -d \
  --name vana-relay-api \
  --env-file .env.production \
  -p 3000:3000 \
  vana-relay-service
```

### Health Checks

Check if services are running:
```bash
# API health
curl http://localhost:3000/api

# Database connection
docker-compose exec api npm run migration:run --dry-run
```

## Available Services

When using Docker Compose, the following services will be available:

- **API Service**: http://localhost:3000
- **Swagger Documentation**: http://localhost:3000/docs  
- **PostgreSQL Database**: localhost:5432
- **Adminer (Database GUI)**: http://localhost:8080
- **MailDev (Email testing)**: http://localhost:1080

## Testing

### Unit Tests
```bash
# Run tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov
```

### End-to-End Tests
```bash
# Local E2E tests
npm run test:e2e

# Docker E2E tests
npm run test:e2e:relational:docker
```

## Database Management

### Migrations
```bash
# Generate migration
npm run migration:generate -- src/database/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

### Seeds
```bash
# Run seeds
npm run seed:run:relational

# Create new seed
npm run seed:create:relational
```

## Troubleshooting

### Common Issues

#### Port already in use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

#### Database connection issues
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Restart database
docker-compose restart postgres

# Check database logs
docker-compose logs postgres
```

#### Permission issues
```bash
# Fix file permissions
chmod +x wait-for-it.sh
chmod +x startup.relational.dev.sh
```

#### Environment variables not loaded
```bash
# Verify .env file exists
ls -la .env*

# Check environment variables in container
docker-compose exec api env | grep DATABASE
```

## Security Considerations

### For Production:

1. **Strong Secrets**: Use strong, unique values for all `*_SECRET` variables
2. **Database Security**: Use strong database passwords and restrict access
3. **Environment Variables**: Never commit `.env` files to version control
4. **SSL/TLS**: Configure HTTPS in production
5. **Network Security**: Use proper firewall rules
6. **Wallet Security**: Secure private key management

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch  
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
