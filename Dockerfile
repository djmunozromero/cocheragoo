# Usa la imagen oficial de Node.js basada en Alpine para reducir el tamaño de la imagen
FROM node:18-alpine as node

# Establecer el directorio de trabajo en /app
WORKDIR /app

# Instala Chromium y sus dependencias necesarias para Puppeteer
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      nodejs \
      yarn

# Configuración para que Puppeteer use el Chromium instalado y no descargue uno nuevo
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copia todos los archivos del proyecto al contenedor
COPY . .

# Instala Puppeteer y otras dependencias del proyecto
RUN npm install puppeteer@10.0.0

# Crea un usuario no privilegiado para ejecutar Puppeteer sin problemas de permisos
RUN addgroup -S pptruser && adduser -S -G pptruser pptruser \
    && mkdir -p /home/pptruser/Downloads /app \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

# Ejecuta todo después de esto como usuario no privilegiado
USER pptruser

# Instala dependencias del proyecto y construye la aplicación
RUN npm install
RUN npm run build

# Expone el puerto (ajústalo si tu aplicación usa otro)
EXPOSE 3001

# Ejecuta la aplicación
CMD ["npm", "start"]
