# Node.js の公式イメージ
FROM node:20

# 作業ディレクトリを作成
WORKDIR /app

# package.json と lock をコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install

# Prisma用ファイル（あれば）
COPY prisma ./prisma
RUN npx prisma generate

# アプリのソースを全部コピー
COPY . .

# TypeScript をビルド（outDir = dist）
RUN npm run build

# アプリが使うポート
EXPOSE 3000

# アプリを起動
CMD ["npm", "start"]
