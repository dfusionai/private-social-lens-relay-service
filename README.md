# private-social-lens-relay-service

# Vana Relay Service

---

A **NestJS**-based relay service for Vana blockchain operations, user authentication, and social features.

---

## Prerequisites

Before you begin, ensure you have the following installed:

* **Node.js**: `>=16.0.0`
* **NPM**: `>=8.0.0`
* **Docker**: `>=20.0.0`
* **Docker Compose**: `>=2.0.0`
* **PostgreSQL**: `17.4+` (only if running without Docker)

---

## Quick Start

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd vana-relay-service
    ```

2.  **Environment Configuration:**

    ```bash
    # Copy environment template
    cp env-example-relational .env
    ```

    Now, open the newly created `.env` file and **edit it with your specific configurations**.

    **Important:** Make sure to update the following variables:

    * `API_KEY_SECRET` (required for API key signing)
    * `BLOCKCHAIN_PROVIDER` (your Infura/Alchemy endpoint)
    * `WALLET_PRIVATE_KEY` (your wallet private key)
    * `WALLET_ENCRYPTION_KEY` (for wallet encryption)
    * `CONTRACT_*` addresses (smart contract addresses)

---

## Development Setup

You have two main options for setting up your development environment:

### Option 1: Local Development

1.  **Install dependencies:**

    ```bash
    npm ci
    ```

2.  **Setup PostgreSQL Database:**

    * **Option A: Using Docker for database only**

        ```bash
        docker run --name postgres-vana \
          -e POSTGRES_USER=root \
          -e POSTGRES_PASSWORD=secret \
          -e POSTGRES_DB=api \
          -p 5432:5432 \
          -d postgres:17.4-alpine
        ```

    * **Option B: Install PostgreSQL locally**
        Follow the PostgreSQL installation guide for your operating system.

3.  **Run database migrations:**

    ```bash
    npm run migration:run
    ```

4.  **Seed the database:**

    ```bash
    npm run seed:run:relational
    ```

5.  **Start development server:**

    * **Regular development mode:**
        ```bash
        npm run start:dev
        ```
    * **Development with SWC (faster compilation):**
        ```bash
        npm run start:swc
        ```
    * **Debug mode:**
        ```bash
        npm run start:debug
        ```

    The service will be available at:

    * **API**: `http://localhost:3000`
    * **Swagger Documentation**: `http://localhost:3000/docs`

---

### Option 2: Docker Development

1.  **Start all services:**

    ```bash
    # Make sure .env file exists
    cp env-example-relational .env

    # Start services in detached mode
    docker-compose up -d

    # Or start with logs
    docker-compose up
    ```

2.  **View logs:**

    * **All services:**
        ```bash
        docker-compose logs -f
        ```
    * **Specific service:**
        ```bash
        docker-compose logs -f api
        docker-compose logs -f postgres
        ```

3.  **Stop services:**

    ```bash
    docker-compose down

    # Remove volumes (this will delete database data)
    docker-compose down -v
    ```

---

## Production Deployment

### Using Docker Compose

1.  **Prepare environment:**

    ```bash
    # Copy and configure production environment
    cp env-example-relational .env.production
    ```

    Edit `.env.production` with your production values.

    **Important production configurations:**

    * `NODE_ENV=production`
    * Strong passwords and secrets for all sensitive variables.
    * Proper database configuration.
    * SSL/TLS settings.
    * Real blockchain provider URLs.

2.  **Deploy:**

    ```bash
    # Build and start production services
    docker-compose --env-file .env.production up -d --build
    ```

---

### Using Individual Docker Commands

1.  **Build the image:**

    ```bash
    docker build -t vana-relay-service .
    ```

2.  **Run with external database:**

    ```bash
    docker run -d \
      --name vana-relay-api \
      --env-file .env.production \
      -p 3000:3000 \
      vana-relay-service
    ```

---

## Health Checks

You can check the health of your services using the following commands:

* **API health:**

    ```bash
    curl http://localhost:3000/api
    ```

* **Database connection:**

    ```bash
    docker-compose exec api npm run migration:run --dry-run
    ```

---

## Available Services

When using Docker Compose, the following services will be available:

* **API Service**: `http://localhost:3000`
* **Swagger Documentation**: `http://localhost:3000/docs`
* **PostgreSQL Database**: `localhost:5432`
* **Adminer (Database GUI)**: `http://localhost:8080`
* **MailDev (Email testing)**: `http://localhost:1080`

---

## Testing

### Unit Tests

* **Run tests:**

    ```bash
    npm run test
    ```

* **Watch mode:**

    ```bash
    npm run test:watch
    ```

* **Coverage:**

    ```bash
    npm run test:cov
    ```

---

### End-to-End Tests

* **Local E2E tests:**

    ```bash
    npm run test:e2e
    ```

* **Docker E2E tests:**

    ```bash
    npm run test:e2e:relational:docker
    ```

---

## Database Management

### Migrations

* **Generate migration:**

    ```bash
    npm run migration:generate -- src/database/migrations/MigrationName
    ```

* **Run migrations:**

    ```bash
    npm run migration:run
    ```

* **Revert last migration:**

    ```bash
    npm run migration:revert
    ```

---

### Seeds

* **Run seeds:**

    ```bash
    npm run seed:run:relational
    ```

* **Create new seed:**

    ```bash
    npm run seed:create:relational
    ```

---

## Troubleshooting

### Common Issues

* **Port already in use:**

    ```bash
    # Find process using port 3000
    lsof -i :3000

    # Kill process (replace <PID> with the process ID)
    kill -9 <PID>
    ```

* **Database connection issues:**

    ```bash
    # Check if PostgreSQL is running
    docker-compose ps postgres

    # Restart database
    docker-compose restart postgres

    # Check database logs
    docker-compose logs postgres
    ```

* **Permission issues:**

    ```bash
    # Fix file permissions
    chmod +x wait-for-it.sh
    chmod +x startup.relational.dev.sh
    ```

* **Environment variables not loaded:**

    ```bash
    # Verify .env file exists
    ls -la .env*

    # Check environment variables in container
    docker-compose exec api env | grep DATABASE
    ```

---

## Security Considerations

### For Production:

* **Strong Secrets**: Use strong, unique values for all `*_SECRET` variables.
* **Database Security**: Use strong database passwords and restrict access.
* **Environment Variables**: **Never commit `.env` files to version control.**
* **SSL/TLS**: Configure HTTPS in production.
* **Network Security**: Use proper firewall rules.
* **Wallet Security**: Implement secure private key management.

---

## Contributing

We welcome contributions! To contribute:

1.  Fork the repository.
2.  Create your feature branch.
3.  Commit your changes.
4.  Push to the branch.
5.  Create a Pull Request.
