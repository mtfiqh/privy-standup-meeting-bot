FROM node:10.13-alpine
RUN npm install pm2 -g
WORKDIR /usr/src/app
COPY package.json /usr/src/app
RUN npm install --save
COPY . /usr/src/app
EXPOSE 3000
CMD ["npm","run", "prod"]