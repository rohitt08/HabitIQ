FROM node:22-alpine

WORKDIR /habitiq_be
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node . .

USER node
EXPOSE 8000
CMD ["node", "server.js"]