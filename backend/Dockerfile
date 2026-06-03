FROM node:22-alpine

WORKDIR /habitiq_be

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8000

CMD ["npm", "start"]