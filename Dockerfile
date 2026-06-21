FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY server-online.mjs ./
COPY integracao-preview.html ./
COPY PUBLICAR_ONLINE.md ./
COPY data ./data
COPY _ecorp_site_zip/client/public ./_ecorp_site_zip/client/public

ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

CMD ["npm", "start"]
