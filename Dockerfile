FROM node:buster

RUN apt-get update -qqy \
    && apt-get -qqy install \
    dumb-init gnupg wget ca-certificates apt-transport-https \
    ttf-wqy-zenhei \
    && rm -rf /var/lib/apt/lists/* /var/cache/apt/*

RUN npm install -g --force typescript

COPY . /app
WORKDIR /app
RUN npm install

CMD [ "npm", "start" ]