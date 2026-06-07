FROM node:22-alpine

WORKDIR /habitiq_be

COPY package*.json ./

RUN npm ci

COPY . .

ENV NODE_ENV=production

EXPOSE 8000

# Run as non-root user for security
USER node

CMD ["npm", "start"]