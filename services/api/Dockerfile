FROM node:20-alpine

WORKDIR /app

# Copy root manifests
COPY package*.json tsconfig.base.json ./

# Copy monorepo packages and API service
COPY packages ./packages
COPY services/agent-runtime ./services/agent-runtime
COPY services/api ./services/api

# Install dependencies and build TypeScript packages
RUN npm install
RUN npm run build --workspace=@platform/contracts
RUN npm run build --workspace=@platform/design-system
RUN npm run build --workspace=@platform/agent-runtime
RUN npm run build --workspace=@platform/api

EXPOSE 4000
ENV NODE_ENV=production

CMD ["node", "services/api/dist/index.js"]
