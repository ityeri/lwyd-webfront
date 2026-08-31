FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# envsubst template: ${API_HOST}/${API_PORT} are substituted at container start
# (nginx image renders /etc/nginx/templates/*.template -> /etc/nginx/conf.d/)
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
