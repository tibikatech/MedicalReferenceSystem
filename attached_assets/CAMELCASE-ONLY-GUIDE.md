# MediRefs - Clean Implementation with camelCase

This is a fresh implementation of the MediRefs application, designed with consistent camelCase naming conventions throughout the entire stack.

## Project Goals

- Use camelCase consistently across database, API, and frontend
- Eliminate field name transformations between layers
- Provide a clean, maintainable codebase
- Fix routing and deployment issues

## Getting Started

### 1. Create a New Project

```bash
# Clone this repository or extract the provided archive
mkdir medirefs-new
cd medirefs-new
tar -xzf medirefs_export_20250504_103812.tar.gz
```

### 2. Set Up Database

Create a new PostgreSQL database with camelCase field names:

```bash
# Make sure the DATABASE_URL environment variable is set
export DATABASE_URL=postgres://username:password@localhost:5432/medirefs_new

# Run the migration script
node migrate-to-camelcase.js
```

This script:
1. Creates new tables with camelCase field names
2. Imports all 115 tests into the new database structure

### 3. Start the Server

```bash
# Install dependencies
npm install

# Start the server
node camelcase-server.js
```

The server will be available at http://localhost:5000

### 4. Run the Frontend

```bash
# In a separate terminal, set up the frontend
cd client
npm install
npm run dev
```

## Project Structure

```
medirefs-new/
├── server/
│   ├── camelcase-server.js      # Express server with camelCase fields
│   └── migrate-to-camelcase.js  # Database migration script
├── client/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── types/               # TypeScript definitions
│   │   └── utils/               # Utility functions
│   ├── public/                  # Static assets
│   └── package.json             # Frontend dependencies
└── data/
    ├── tests.json               # Test data
    └── categories.json          # Category information
```

## API Endpoints

All endpoints work with camelCase format:

- `GET /api/tests` - Get all tests
- `GET /api/tests/:id` - Get a specific test
- `GET /api/test-count` - Get count of all tests
- `GET /api/test-count-by-category` - Get count of tests by category
- `GET /api/test-count-by-subcategory` - Get count of tests by subcategory
- `GET /api/tests/category/:category` - Get tests by category
- `GET /api/tests/subcategory/:subcategory` - Get tests by subcategory

Authentication endpoints:
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Log in
- `POST /api/auth/logout` - Log out
- `GET /api/auth/status` - Check auth status

## Database Schema

The database schema uses camelCase field names:

```sql
CREATE TABLE tests (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  subCategory VARCHAR(255) NOT NULL,
  cptCode VARCHAR(255),
  loincCode VARCHAR(255),
  snomedCode VARCHAR(255),
  description TEXT,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  firstName VARCHAR(255),
  lastName VARCHAR(255),
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bookmarks (
  id SERIAL PRIMARY KEY,
  userId INTEGER REFERENCES users(id),
  testId VARCHAR(255) REFERENCES tests(id),
  notes TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```