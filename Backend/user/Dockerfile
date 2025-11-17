FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --include=dev

COPY . .

RUN npm run build

EXPOSE 5000

CMD ["node", "dist/index.js"]