#!/bin/bash

echo "🔒 Configuración HTTPS para api.qahood.com"
echo "========================================"

# Verificar si se está ejecutando como root
if [ "$EUID" -ne 0 ]; then
    echo "⚠️  Este script necesita permisos sudo"
    echo "💡 Se pedirán permisos cuando sea necesario"
fi

echo "📋 Configurando HTTPS con Let's Encrypt para api.qahood.com"

echo "1️⃣ Actualizando sistema e instalando dependencias..."
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y

echo "2️⃣ Configurando Nginx como proxy reverso..."
sudo tee /etc/nginx/sites-available/hoodfy-api > /dev/null <<'EOF'
server {
    listen 80;
    server_name api.qahood.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

echo "3️⃣ Activando configuración de Nginx..."
sudo ln -s /etc/nginx/sites-available/hoodfy-api /etc/nginx/sites-enabled/
sudo nginx -t
if [ $? -eq 0 ]; then
    sudo systemctl reload nginx
    echo "✅ Nginx configurado correctamente"
else
    echo "❌ Error en configuración de Nginx"
    exit 1
fi

echo "4️⃣ Obteniendo certificado SSL con Let's Encrypt..."
echo "⚠️  Se pedirá un email para notificaciones de renovación"
sudo certbot --nginx -d api.qahood.com --agree-tos --non-interactive --redirect

if [ $? -eq 0 ]; then
    echo "✅ Certificado SSL obtenido exitosamente"
else
    echo "❌ Error al obtener certificado SSL"
    echo "🔍 Verifica que api.qahood.com apunte a esta IP en Route 53"
    echo "🔍 Verifica que el puerto 80 esté abierto en el Security Group"
    exit 1
fi

echo "5️⃣ Configurando renovación automática..."
(sudo crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | sudo crontab -

echo "6️⃣ Verificando configuración..."
sudo nginx -t
sudo systemctl reload nginx

echo ""
echo "🎉 ¡HTTPS configurado exitosamente para api.qahood.com!"
echo "✅ Tu API backend ya está disponible en: https://api.qahood.com"
echo "✅ Nginx está redirigiendo el tráfico HTTPS al puerto 5000"
echo ""
echo "📝 PRÓXIMOS PASOS:"
echo "1. Actualizar NEXT_PUBLIC_API_URL en AWS Amplify Console:"
echo "   https://api.qahood.com"
echo "2. Hacer nuevo deploy del frontend"
echo "3. Probar login en la aplicación"
echo ""
echo "🔧 Comandos útiles:"
echo "• Ver logs de Nginx: sudo tail -f /var/log/nginx/error.log"
echo "• Verificar certificado: sudo certbot certificates"
echo "• Renovar certificado: sudo certbot renew"
echo "• Reiniciar Nginx: sudo systemctl restart nginx" 