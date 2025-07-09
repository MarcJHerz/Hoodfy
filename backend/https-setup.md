# 🔒 Configuración HTTPS en EC2 - qahood.com

## Opción A: Con Dominio (Let's Encrypt) - RECOMENDADO

### 1. Instalar Nginx y Certbot en EC2
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

### 2. Configurar Nginx como proxy reverso
```bash
sudo nano /etc/nginx/sites-available/hoodfy
```

Contenido del archivo:
```nginx
server {
    listen 80;
    server_name qahood.com www.qahood.com;

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
```

### 3. Activar configuración
```bash
sudo ln -s /etc/nginx/sites-available/hoodfy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Obtener certificado SSL
```bash
sudo certbot --nginx -d qahood.com -d www.qahood.com
```

### 5. Verificar renovación automática
```bash
sudo crontab -e
# Agregar línea:
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## Opción B: Sin Dominio (Certificado Autofirmado)

### 1. Generar certificado autofirmado
```bash
cd /home/ubuntu/hoodfy/backend
mkdir ssl
cd ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout private.key \
  -out certificate.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=44.200.188.58"
```

### 2. Modificar backend para HTTPS
Ver archivo: `backend/https-server.js`

### 3. Abrir puerto 443 en Security Group
- Puerto 443 (HTTPS)
- Protocolo: TCP
- Origen: 0.0.0.0/0

---

## Variables de entorno a actualizar

Después de configurar HTTPS, actualizar en AWS Amplify:

```
NEXT_PUBLIC_API_URL=https://qahood.com
```

## ✅ Configuración recomendada para qahood.com

1. **DNS**: ✅ Ya configurado (GoDaddy → Route 53)
2. **Dominio en Amplify**: ✅ Ya configurado
3. **Certificado SSL backend**: ⏳ Pendiente
4. **Variable de entorno**: ⏳ Pendiente actualizar a https://qahood.com 