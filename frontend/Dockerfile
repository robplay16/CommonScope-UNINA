FROM nginx:alpine
# Rimuove i file di default di nginx
RUN rm -rf /usr/share/nginx/html/*
# Copia tutti i file della cartella frontend dentro il server web
COPY . /usr/share/nginx/html
EXPOSE 80