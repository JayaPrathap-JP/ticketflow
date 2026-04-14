FROM nginx:1.25-alpine
COPY index.html  /usr/share/nginx/html/index.html
COPY nginx.conf  /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget -qO- http://localhost/health || exit 1