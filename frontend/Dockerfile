# Frontend
FROM node:20-alpine as frontend

WORKDIR /app/frontend

COPY frontend/package.json frontend/package.json
RUN npm install

COPY frontend/ .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
