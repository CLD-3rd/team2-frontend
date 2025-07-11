# 1️⃣ Node.js 환경에서 React 빌드
FROM node:latest AS build
WORKDIR /app

# package.json과 package-lock.json을 먼저 복사하여 의존성 설치
COPY package.json package-lock.json ./
RUN npm install

<<<<<<< HEAD
# 전체 소스 코드 복사 후 빌드 실행
COPY . .
=======
# 정적 소스로 빌드
>>>>>>> origin/dev
RUN npm run build
