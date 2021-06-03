# syntax=docker/dockerfile:1

FROM node:14.16.1

ENV NODE_ENV=production
ENV MONGODB_URI=mongodb+srv://uthdadmin:fUTc749JLYjCGLzY31L7BR5Eb@cluster0.g5ext.mongodb.net/myFirstDatabase?retryWrites=true&w=majority

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --production

COPY . .

CMD [ "node", "bot.js" ]