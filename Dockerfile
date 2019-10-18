FROM quay.io/ivanvanderbyl/docker-nightmare:latest

ADD . /workspace
RUN npm install 

CMD "server.js"
