FROM node:10.13-alpine
WORKDIR /usr/src/app
COPY package.json /usr/src/app
RUN npm install --save
COPY . /usr/src/app
EXPOSE 3000
CMD ["npm","start"]