# 1. 빌드 단계
FROM node:18 AS builder

WORKDIR /app

# 패키지 설치
COPY package*.json ./
RUN npm install

# 소스 복사 및 빌드
COPY . .
RUN npm run build

# 2. 정적 파일을 서빙하는 단계 (serve 사용)
FROM node:18-alpine AS runner

WORKDIR /app

# 전역 serve 설치
RUN npm install -g serve

# 빌드된 정적 파일만 복사
COPY --from=builder /app/dist ./dist

# 3000 포트 사용
EXPOSE 3000

# 정적 파일 실행
CMD ["serve", "-s", "dist", "-l", "3000"]