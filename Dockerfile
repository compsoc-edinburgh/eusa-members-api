FROM quay.io/ivanvanderbyl/docker-nightmare:latest

ENV NODE_VERSION=14.0.0
RUN curl -SLO "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.xz" && tar -xJf "node-v$NODE_VERSION-linux-x64.tar.xz" -C /usr/local --strip-components=1 && rm "node-v$NODE_VERSION-linux-x64.tar.xz" && ln -sf /usr/local/bin/node /usr/local/bin/nodejs

ADD . /workspace
RUN npm install 

ENTRYPOINT cd /workspace && sh entrypoint.sh /usr/local/bin/node server.js
#ENTRYPOINT sh

#CMD "server.js"
