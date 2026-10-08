# =========================
# Stage 1 : Build Angular
# =========================
FROM node:20-alpine AS build

WORKDIR /app

# Copier les fichiers npm
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le projet Angular
COPY . .

# Build de production
RUN npm run build

# =========================
# Stage 2 : Nginx
# =========================
FROM nginx:alpine

# Supprimer la configuration Nginx par défaut
RUN rm /etc/nginx/conf.d/default.conf

# Copier la configuration Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier l'application Angular
COPY --from=build /app/dist/freightsure-web/browser /usr/share/nginx/html

# Port HTTP
EXPOSE 80

# Lancer Nginx
CMD ["nginx", "-g", "daemon off;"]