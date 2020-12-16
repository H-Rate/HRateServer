FROM node:fermium-alpine AS BUILD
WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci --no-optional --silent --no-audit -q

COPY tsconfig.json .
COPY src/ ./src/
RUN npm run build

FROM node:fermium-alpine
WORKDIR /app


COPY package.json package-lock.json ./
RUN npm i --only=production --silent --no-optional --no-audit -q

COPY --from=BUILD /build/dist ./

ENTRYPOINT ["node", "runserver.js"]
