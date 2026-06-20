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
```bash
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
```
### 4. Start the App
docker compose up -d --build

Access the application at http://localhost:3000.

### 5. Stop the App
docker compose down
-----------------
Dialogflow
```bash
DIALOGFLOW_PROJECT_ID="your-project-id-from-json"
DIALOGFLOW_AGENT_ID="your-agent-id-from-cx-url"
DIALOGFLOW_LOCATION="global"
DIALOGFLOW_CLIENT_EMAIL="your-service-account-email"
DIALOGFLOW_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourKeyHere...\n-----END PRIVATE KEY-----\n"
```
Google SDK something
```bash
npm install @google-cloud/dialogflow-cx
```
