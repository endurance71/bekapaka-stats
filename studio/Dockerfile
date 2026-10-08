FROM node:22-bookworm-slim AS build
WORKDIR /workspace/studio
COPY studio/package*.json ./
RUN npm ci
COPY studio/ ./
COPY backend/studio/contracts.js backend/studio/post-types.js backend/studio/design-manifest.json backend/studio/material-context.js /workspace/backend/studio/
COPY backend/studio/publications/channels.js backend/studio/publications/playbooks.js backend/studio/publications/templates.js backend/studio/publications/brand-lint.js backend/studio/publications/texts.js backend/studio/publications/prompts.js /workspace/backend/studio/publications/
RUN npm run build
FROM nginx:1.28-alpine
COPY studio/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/studio/dist /usr/share/nginx/html
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
EXPOSE 80
