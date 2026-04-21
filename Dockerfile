# Stage 1: Build the SPA
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Copy built files to a shared volume
FROM alpine:3.21
COPY --from=build /app/dist /usr/share/frontend