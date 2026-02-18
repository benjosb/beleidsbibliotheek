# Simpele Docker setup voor Beleidsbibliotheek Wassenaar
# Gebruik: docker build -t beleidsbibliotheek . && docker run -p 8080:80 beleidsbibliotheek

FROM nginx:alpine

# Kopieer alle bestanden naar de nginx html directory
COPY . /usr/share/nginx/html/

# Expose poort 80
EXPOSE 80

# Nginx start automatisch
