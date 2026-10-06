FROM node:22-bookworm-slim
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
COPY backend/scripts/requirements.txt scripts/requirements.txt
RUN apt-get update \
  && apt-get install -y python3 python3-pip postgresql-client libheif-examples \
  && pip3 install --no-cache-dir --break-system-packages -r scripts/requirements.txt \
  && rm -rf /var/lib/apt/lists/*
RUN npm ci
COPY backend/ .
COPY packages/match-presentation /packages/match-presentation
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
RUN npx prisma generate
ENV PORT=4000
EXPOSE 4000
COPY backend/scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
CMD ["/entrypoint.sh"]
