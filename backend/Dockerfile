FROM node:20-bullseye-slim
WORKDIR /app
COPY package.json package-lock.json* ./
COPY scripts/requirements.txt scripts/requirements.txt
RUN apt-get update \
  && apt-get install -y python3 python3-pip postgresql-client \
  && pip3 install --no-cache-dir -r scripts/requirements.txt \
  && rm -rf /var/lib/apt/lists/*
RUN npm install
COPY . .
ENV PORT=4000
EXPOSE 4000
COPY scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
CMD ["/entrypoint.sh"]
