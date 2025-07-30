# Minimal fast Dockerfile for Render
FROM node:18-alpine

# Install Chromium (much faster than full Chrome)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tell Puppeteer to skip downloading Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV HOST=0.0.0.0
ENV PORT=3000

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies fast
RUN npm ci --omit=dev --no-audit --no-fund --verbose

# Copy app
COPY . .

# Create user and set permissions
RUN addgroup -g 1001 -S nodejs
RUN adduser -S appuser -u 1001
RUN chown -R appuser:nodejs /app
USER appuser

EXPOSE 3000

CMD ["npm", "start"]
