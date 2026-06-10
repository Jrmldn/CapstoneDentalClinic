# AppointDent — Dental Clinic Management System

## 🐳 Docker Setup

### 1. Prerequisites
Install [Docker Desktop](https://www.docker.com/products/docker-desktop/).

### 2. Configuration
Copy the env template:
* **Windows:** `copy .env.example .env.local`
* **Mac/Linux:** `cp .env.example .env.local`

Update `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 3. Start the App
```bash
docker compose --env-file .env.local up -d --build
```
Access the application at [http://localhost:3000](http://localhost:3000).

### 4. Stop the App
```bash
docker compose down
```
