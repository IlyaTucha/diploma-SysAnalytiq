# Frontend
FROM node:20-alpine as frontend

WORKDIR /app/frontend

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
