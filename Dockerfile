FROM node:22.11.0

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install --ignore-scripts

COPY . .

RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/bin/sh", "./docker-entrypoint.sh"]
