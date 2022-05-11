# Dockerfile for React client

# Build react client
FROM node:14-alpine

# Working directory be app
RUN touch SUCCESS
WORKDIR /usr/src/app

COPY package*.json ./

###  Installing dependencies

RUN npm install --silent > /dev/null
COPY . .
# copy local files to app folder
EXPOSE 3000
CMD ["npm","run","dev"]

