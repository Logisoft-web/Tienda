FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
# Instalar rclone para backup a Google Drive
RUN apk add --no-cache curl unzip && \
    curl -O https://downloads.rclone.org/rclone-current-linux-arm64.zip && \
    unzip rclone-current-linux-arm64.zip && \
    mv rclone-*-linux-arm64/rclone /usr/local/bin/ && \
    rm -rf rclone-* && \
    apk del curl unzip
COPY . .
RUN mkdir -p /app/data
VOLUME ["/app/data"]
EXPOSE 3001
CMD ["node", "index.js"]
