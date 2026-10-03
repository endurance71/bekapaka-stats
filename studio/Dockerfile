FROM node:22-bookworm-slim AS build
WORKDIR /workspace/studio
COPY studio/package*.json ./
RUN npm ci
COPY studio/ ./
COPY backend/studio/contracts.js /workspace/backend/studio/contracts.js
RUN npm run build
FROM nginx:1.28-alpine
COPY studio/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/studio/dist /usr/share/nginx/html
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
EXPOSE 80
