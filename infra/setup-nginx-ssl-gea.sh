#!/bin/bash

echo "🔧 Installing Nginx and Certbot..."
sudo apt update && sudo apt install nginx certbot python3-certbot-nginx -y

echo "📝 Creating Nginx config for domain routing at /etc/nginx/sites-available/gea.conf..."

#check the path and replace if required
sudo tee /etc/nginx/sites-available/gea.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name gea.gov.gd;
    location / {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
server {
    listen 80;
    server_name cms.gea.gov.gd;
    location / {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
server {
    listen 80;
    server_name api.gea.gov.gd;
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
server {
    listen 80;
    server_name minio.gea.gov.gd;
    location / {
        proxy_pass http://localhost:9090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
server {
    listen 80;
    server_name search.gea.gov.gd;
    location / {
        proxy_pass http://localhost:9200;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
server {
    listen 80;
    server_name pgadmin.gea.gov.gd;
    location / {
        proxy_pass http://localhost:5050;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
server {
    listen 80;
    server_name login.gea.gov.gd;
    location / {
        proxy_pass http://localhost:8002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

echo "🔗 Enabling site and reloading Nginx..."
sudo ln -sf /etc/nginx/sites-available/gea.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo "🔐 Issuing Let's Encrypt SSL certificates..."
sudo certbot --nginx -d gea.gov.gd -d cms.gea.gov.gd -d api.gea.gov.gd -d minio.gea.gov.gd -d search.gea.gov.gd -d pgadmin.gea.gov.gd -d login.gea.gov.gd

echo "✅ Testing SSL auto-renewal..."
sudo certbot renew --dry-run

echo "🎉 All subdomains are now live with HTTPS!"
