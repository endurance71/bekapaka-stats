FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json* ./
COPY scripts/requirements.txt scripts/requirements.txt
RUN apt-get update \
  && apt-get install -y python3 python3-pip postgresql-client \
  && pip3 install --no-cache-dir -r scripts/requirements.txt \
  && rm -rf /var/lib/apt/lists/*
RUN npm install
COPY . .
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
RUN npx prisma generate
ENV PORT=4000
EXPOSE 4000
COPY scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
CMD ["/entrypoint.sh"]
