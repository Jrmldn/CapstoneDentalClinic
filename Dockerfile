# ============================================
# Stage 1: Dependencies Installation Stage
# ============================================
FROM node:20-alpine AS deps
# Install libc6-compat since Next.js might require it on Alpine to run native dependencies properly
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package-related files first to leverage Docker's caching mechanism
COPY package.json package-lock.json* ./

# Install project dependencies
RUN npm ci --no-audit --no-fund

# ============================================
# Stage 2: Build Next.js application in standalone mode
# ============================================
FROM node:20-alpine AS builder
WORKDIR /app

# Copy project dependencies from dependencies stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time environment variables.
# Next.js bakes NEXT_PUBLIC_* variables into the client bundle at build-time.
# To pass these, use --build-arg NEXT_PUBLIC_SUPABASE_URL=... during docker build.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Disable Next.js telemetry for privacy and build speed
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ============================================
# Stage 3: Run Next.js application
# ============================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Disable Next.js telemetry during runtime
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root group and user for security compliance
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static public assets
COPY --from=builder /app/public ./public

# Set the correct permission for Next.js prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size (standalone build output)
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose the port the server listens on
EXPOSE 3000

ENV PORT=3000
# Ensure hostname is set to bind to all network interfaces inside the container
ENV HOSTNAME="0.0.0.0"

# Start Next.js standalone server
CMD ["node", "server.js"]
