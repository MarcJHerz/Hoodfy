# 🚀 Hoodfy Backend

Backend API para la aplicación Hoodfy, construido con Node.js, Express y MongoDB.

## 📋 Requisitos Previos

### Dependencias del Sistema

#### 1. Node.js y npm
```bash
# Instalar Node.js 18+ y npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 2. MongoDB
```bash
# Instalar MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### 3. FFmpeg (Para generación de miniaturas de video)
```bash
# Actualizar repositorios
sudo apt update

# Instalar ffmpeg
sudo apt install ffmpeg -y

# Verificar instalación
ffmpeg -version
```

#### 4. Nginx (Para proxy reverso)
```bash
# Instalar nginx
sudo apt install nginx -y

# Configurar límites de archivos grandes
sudo tee /etc/nginx/sites-available/hoodfy-api > /dev/null <<'EOF'
server {
    server_name api.qahood.com;

    # Configurar límites de tamaño para archivos grandes
    client_max_body_size 500M;
    proxy_read_timeout 300s;
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;

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
        
        # Configurar límites específicos para esta ubicación
        client_max_body_size 500M;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/api.qahood.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/api.qahood.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = api.qahood.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name api.qahood.com;
    return 404; # managed by Certbot
}
EOF

# Verificar configuración
sudo nginx -t

# Recargar nginx
sudo systemctl reload nginx
```

## 🔧 Instalación

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd hoodfy/backend
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
```

Editar `.env` con las siguientes variables:
```env
# Servidor
PORT=5000
NODE_ENV=production

# MongoDB
MONGODB_URI=mongodb://localhost:27017/hoodfy

# JWT
JWT_SECRET=tu-jwt-secret-super-seguro

# Firebase
FIREBASE_PROJECT_ID=tu-proyecto-firebase
FIREBASE_PRIVATE_KEY=tu-clave-privada-firebase
FIREBASE_CLIENT_EMAIL=tu-email-firebase

# AWS S3
AWS_ACCESS_KEY_ID=tu-access-key
AWS_SECRET_ACCESS_KEY=tu-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=tu-bucket-s3

# Stripe
STRIPE_SECRET_KEY=tu-stripe-secret-key
STRIPE_WEBHOOK_SECRET=tu-stripe-webhook-secret

# URLs
BASE_URL=https://api.qahood.com
NEXT_PUBLIC_API_URL=https://api.qahood.com
```

### 4. Configurar PM2
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar la aplicación
pm2 start index.js --name "hoodfy-backend"

# Configurar para que inicie automáticamente
pm2 startup
pm2 save
```

## 🚀 Despliegue

### Configuración de HTTPS con Let's Encrypt
```bash
# Instalar certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtener certificado SSL
sudo certbot --nginx -d api.qahood.com --agree-tos --non-interactive --redirect

# Configurar renovación automática
(sudo crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | sudo crontab -
```

### Configuración de límites de archivos
Los límites de archivos están configurados para soportar archivos grandes de iPhone:

- **Express middleware**: 500MB
- **Multer (posts)**: 500MB para videos
- **Multer (uploads)**: 50MB para imágenes
- **Multer (users)**: 50MB para imágenes de perfil
- **Multer (communities)**: 50MB para imágenes de portada
- **Nginx**: 500MB (`client_max_body_size 500M`)

## 📁 Estructura del Proyecto

```
backend/
├── config/           # Configuraciones (Firebase, Stripe, etc.)
├── controllers/      # Controladores de la API
├── middleware/       # Middlewares personalizados
├── models/          # Modelos de MongoDB
├── routes/          # Rutas de la API
├── utils/           # Utilidades (S3, generación de miniaturas)
├── validators/      # Validaciones de datos
├── uploads/         # Archivos subidos (temporal)
└── index.js         # Punto de entrada
```

## 🔧 Características Principales

### 📱 Soporte para iPhone/Safari
- **Conversión HEIC a JPEG**: Automática en el frontend
- **Límites de archivos**: Optimizados para archivos grandes de iPhone
- **Compatibilidad**: Total con Safari y iOS

### 🎬 Generación de Miniaturas de Video
- **FFmpeg**: Para generar miniaturas automáticamente
- **S3**: Almacenamiento de miniaturas en AWS
- **Fallback**: Continúa sin miniatura si falla la generación

### 🔐 Autenticación y Seguridad
- **JWT**: Tokens de autenticación
- **Firebase Auth**: Integración con Firebase
- **Rate Limiting**: Protección contra spam
- **CORS**: Configurado para múltiples dominios

### 💳 Integración con Stripe
- **Pagos**: Procesamiento de suscripciones
- **Webhooks**: Manejo de eventos de pago
- **Productos**: Gestión de precios y productos

## 🐛 Troubleshooting

### Problemas con archivos grandes
```bash
# Verificar límites de nginx
sudo nginx -t
sudo systemctl status nginx

# Verificar logs
sudo tail -f /var/log/nginx/error.log
pm2 logs
```

### Problemas con miniaturas de video
```bash
# Verificar ffmpeg
ffmpeg -version

# Verificar logs del backend
pm2 logs

# Reiniciar backend
pm2 restart all
```

### Problemas con S3
```bash
# Verificar variables de entorno
echo $AWS_REGION
echo $S3_BUCKET_NAME

# Verificar conectividad
node -e "const { S3Client } = require('@aws-sdk/client-s3'); console.log('S3 Client:', new S3Client({ region: process.env.AWS_REGION }))"
```

## 📊 Monitoreo

### Logs
```bash
# Ver logs del backend
pm2 logs

# Ver logs de nginx
sudo tail -f /var/log/nginx/error.log

# Ver logs de MongoDB
sudo tail -f /var/log/mongodb/mongod.log
```

### Estado del sistema
```bash
# Estado de PM2
pm2 status

# Estado de nginx
sudo systemctl status nginx

# Estado de MongoDB
sudo systemctl status mongod

# Uso de disco
df -h

# Uso de memoria
free -h
```

## 🔄 Actualizaciones

### Actualizar código
```bash
# Pull del repositorio
git pull origin main

# Instalar nuevas dependencias
npm install

# Reiniciar aplicación
pm2 restart all
```

### Actualizar dependencias del sistema
```bash
# Actualizar paquetes
sudo apt update && sudo apt upgrade -y

# Reiniciar servicios
sudo systemctl restart nginx
sudo systemctl restart mongod
pm2 restart all
```

## 📞 Soporte

Para problemas técnicos o preguntas sobre el backend, consultar:
- Logs del sistema
- Documentación de las librerías utilizadas
- Issues del repositorio

---

**Versión**: 1.0.0  
**Última actualización**: Julio 2024  
**Mantenido por**: Equipo Hoodfy
