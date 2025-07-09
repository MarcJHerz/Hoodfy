#!/bin/bash

echo "🔒 Configuración HTTPS para Hoodfy Backend"
echo "=========================================="

read -p "¿Tienes un dominio? (y/n): " has_domain

if [ "$has_domain" = "y" ] || [ "$has_domain" = "Y" ]; then
    echo "📋 Configuración con Let's Encrypt"
    read -p "Ingresa tu dominio (ej: midominio.com): " domain
    
    echo "1️⃣ Instalando Nginx y Certbot..."
    sudo apt update
    sudo apt install nginx certbot python3-certbot-nginx -y
    
    echo "2️⃣ Configurando Nginx..."
    sudo tee /etc/nginx/sites-available/hoodfy > /dev/null <<EOF
server {
    listen 80;
    server_name $domain www.$domain;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
    
    echo "3️⃣ Activando configuración..."
    sudo ln -s /etc/nginx/sites-available/hoodfy /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl reload nginx
    
    echo "4️⃣ Obteniendo certificado SSL..."
    sudo certbot --nginx -d $domain -d www.$domain
    
    echo "5️⃣ Configurando renovación automática..."
    (sudo crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | sudo crontab -
    
    echo "✅ ¡HTTPS configurado exitosamente!"
    echo "🌐 Tu API está disponible en: https://$domain"
    echo "📝 Actualiza NEXT_PUBLIC_API_URL en AWS Amplify a: https://$domain"

else
    echo "🔧 Configuración con certificado autofirmado"
    
    echo "1️⃣ Creando directorio SSL..."
    mkdir -p ssl
    cd ssl
    
    echo "2️⃣ Generando certificado autofirmado..."
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout private.key \
      -out certificate.crt \
      -subj "/C=US/ST=State/L=City/O=Hoodfy/CN=44.200.188.58"
    
    cd ..
    
    echo "3️⃣ Configurando permisos..."
    sudo chown $USER:$USER ssl/private.key ssl/certificate.crt
    
    echo "4️⃣ Iniciando servidor HTTPS..."
    echo "⚠️  IMPORTANTE: Abre el puerto 443 en tu Security Group de AWS"
    echo "⚠️  El navegador mostrará advertencia de seguridad (es normal con certificados autofirmados)"
    
    # Backup del servidor actual
    cp index.js index-http-backup.js
    
    # Usar servidor HTTPS
    cp https-server.js index.js
    
    echo "✅ Configuración completada!"
    echo "🔒 Tu API estará disponible en: https://44.200.188.58"
    echo "📝 Actualiza NEXT_PUBLIC_API_URL en AWS Amplify a: https://44.200.188.58"
    echo "🚀 Reinicia tu aplicación: pm2 restart all"
fi

echo ""
echo "🔥 Próximos pasos:"
echo "1. Actualizar NEXT_PUBLIC_API_URL en AWS Amplify Console"
echo "2. Hacer nuevo deploy del frontend"
echo "3. Probar login en la aplicación" 