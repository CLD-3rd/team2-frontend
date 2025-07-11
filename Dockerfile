# 1. 빌드 단계
FROM node:18 AS builder

WORKDIR /app

# 패키지 설치
COPY package*.json ./
RUN npm install

# 정적 소스로 빌드
RUN npm run build
