FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine

WORKDIR /app

RUN npm add -g serve

COPY --from=build /app/dist ./dist

EXPOSE 3000

# Run as non-root user for security
USER node

CMD ["serve", "-s", "dist", "-l", "3000"]