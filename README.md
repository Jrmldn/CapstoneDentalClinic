## 🐳 Docker Setup

### 1. Prerequisites
Install [Docker Desktop](https://www.docker.com/products/docker-desktop/).

### 2. Clone & Setup
Clone the repository:
```bash
git clone <your-repo-url>
cd capstone-dental-clinic
```
### 3. Configuration
Create .env.local with required variables:

NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>

### 4. Start the App
docker compose up -d --build

Access the application at http://localhost:3000.

### 5. Stop the App
docker compose down