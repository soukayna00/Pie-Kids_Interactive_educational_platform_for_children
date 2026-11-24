FROM node:22-bookworm-slim
WORKDIR /app/Back-end
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .
RUN mkdir -p uploads
EXPOSE 4000
CMD ["node", "index.js"]
