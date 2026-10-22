FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY iris-voice-server.mjs ./
EXPOSE 8787
ENV PORT=8787
CMD ["node", "iris-voice-server.mjs"]
