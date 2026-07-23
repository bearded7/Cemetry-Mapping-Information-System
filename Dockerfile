# Cemetery Mapping & Information System
# Multi-stage build kept intentionally simple: the app has zero native
# dependencies (uses Node's built-in sqlite module), so there's nothing
# to compile.

FROM node:22-slim AS base
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p /app/data /app/uploads/graves /app/uploads/messages && \
    addgroup --system app && adduser --system --ingroup app app && \
    chown -R app:app /app

USER app

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
