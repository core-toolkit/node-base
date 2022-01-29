FROM node:16-alpine

ENV NODE_ENV production
EXPOSE 3000
WORKDIR /app

ADD package*.json /app/
RUN npm ci

ADD . /app/

CMD [ "npm", "start" ]
