# AcademiaSync Backend

This backend has been rebuilt to run on **Cloudflare Workers**, utilizing the **Hono** web framework and **Cloudflare D1** (SQLite) as its database.

## Architecture
- **Framework**: Hono
- **Runtime**: Cloudflare Workers
- **Database**: Cloudflare D1
- **Authentication**: JWT (JSON Web Tokens) with Web Crypto API/bcryptjs
- **Environment**: TypeScript

## Setup Instructions

### 1. Install Dependencies
`ash
npm install
``n
### 2. Environment Variables
You need to set up local environment variables for JWT signing:
Create a .dev.vars file in the root of the backend folder:
``nJWT_SECRET=your_super_secret_jwt_key
``n
### 3. Initialize D1 Database
Create the local D1 database schema:
`ash
npm run db:init
``n
### 4. Seed Test Users
Populate the database with test user accounts:
`ash
npm run db:seed
``n
The seeded users follow this hierarchy:
- Principal -> HOD -> Staff -> Student
- Default Password: password`n
### 5. Run Local Development Server
`ash
npm run dev
``n
## Deployment
To deploy to Cloudflare Workers:
1. Ensure your wrangler.json matches your Cloudflare account's D1 configurations.
2. Set the JWT_SECRET via 
px wrangler secret put JWT_SECRET.
3. Run 
pm run deploy.
