#!/bin/bash

echo "🔧 Installing Nginx..."
sudo apt update && sudo apt install nginx -y

echo "📝 Creating IP-based Nginx config at /etc/nginx/sites-available/gea-ip.conf..."

# check path here or replace /etc/nginx/sites-available/ with the actual path

sudo tee /etc/nginx/sites-available/gea-ip.conf > /dev/null << 'EOF'
server {
    listen 80 default_server;
    server_name _;

    location / {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    server_name _;
    location /cms/ {
        proxy_pass http://localhost:8001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    location /minio/ {
        proxy_pass http://localhost:9090/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    location /search/ {
        proxy_pass http://localhost:9200/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    location /pgadmin/ {
        proxy_pass http://localhost:5050/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    location /login/ {
        proxy_pass http://localhost:8002/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

echo "🔗 Enabling Nginx config..."
sudo ln -sf /etc/nginx/sites-available/gea-ip.conf /etc/nginx/sites-enabled/

echo "✅ Testing and reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo "🎉 Setup complete! Access your system at: http://YOUR_PUBLIC_IP/"
