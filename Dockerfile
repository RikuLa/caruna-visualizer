FROM alpine:edge

RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      nodejs \
      yarn \
      python3 \
      build-base

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app
ADD package.json yarn.lock tsconfig.json /app/
ADD ./src /app/src
RUN yarn install

CMD ["yarn", "start:caruna"]
