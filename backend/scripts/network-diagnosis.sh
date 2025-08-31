#!/bin/bash

echo "🔍 HOODFY - DIAGNÓSTICO DE RED PARA OPENSEARCH"
echo "=================================================="

# Colores para la consola
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "OK" ]; then
        echo -e "${GREEN}✅ $message${NC}"
    elif [ "$status" = "WARNING" ]; then
        echo -e "${YELLOW}⚠️  $message${NC}"
    else
        echo -e "${RED}❌ $message${NC}"
    fi
}

echo -e "\n${BLUE}1. INFORMACIÓN DEL SERVIDOR${NC}"
echo "----------------------------------------"

# Información del sistema
echo "Hostname: $(hostname)"
echo "Usuario: $(whoami)"
echo "Fecha: $(date)"
echo "Uptime: $(uptime)"

# Información de red
echo -e "\n${BLUE}2. INFORMACIÓN DE RED${NC}"
echo "----------------------------------------"

# IP pública
PUBLIC_IP=$(curl -s --max-time 10 ifconfig.me 2>/dev/null)
if [ -n "$PUBLIC_IP" ]; then
    print_status "OK" "IP Pública: $PUBLIC_IP"
else
    print_status "WARNING" "No se pudo obtener IP pública"
fi

# IP privada
PRIVATE_IP=$(curl -s --max-time 5 http://169.254.169.254/latest/meta-data/local-ipv4 2>/dev/null)
if [ -n "$PRIVATE_IP" ]; then
    print_status "OK" "IP Privada: $PRIVATE_IP"
else
    print_status "WARNING" "No se pudo obtener IP privada (probablemente no estás en AWS)"
fi

# VPC ID (si estás en AWS)
VPC_ID=$(curl -s --max-time 5 http://169.254.169.254/latest/meta-data/network/interfaces/macs/$(curl -s http://169.254.169.254/latest/meta-data/mac)/vpc-id 2>/dev/null)
if [ -n "$VPC_ID" ]; then
    print_status "OK" "VPC ID: $VPC_ID"
else
    print_status "WARNING" "No se pudo obtener VPC ID"
fi

echo -e "\n${BLUE}3. CONECTIVIDAD A OPENSEARCH${NC}"
echo "----------------------------------------"

OPENSEARCH_HOST="vpc-hoodfy-opensearch-logs-cjcslmrxwoetuh36r3zsmkogge.us-east-1.es.amazonaws.com"

# Verificar DNS
echo "Verificando resolución DNS..."
if nslookup $OPENSEARCH_HOST >/dev/null 2>&1; then
    print_status "OK" "DNS resuelto correctamente"
    nslookup $OPENSEARCH_HOST | grep "Address:"
else
    print_status "ERROR" "No se pudo resolver DNS"
fi

# Verificar conectividad TCP
echo -e "\nVerificando conectividad TCP (puerto 443)..."
if timeout 10 bash -c "</dev/tcp/$OPENSEARCH_HOST/443" 2>/dev/null; then
    print_status "OK" "Puerto 443 accesible"
else
    print_status "ERROR" "Puerto 443 no accesible"
fi

# Verificar conectividad HTTP básica
echo -e "\nVerificando conectividad HTTP..."
HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 15 -k https://$OPENSEARCH_HOST 2>/dev/null)
if [ "$HTTP_RESPONSE" = "401" ] || [ "$HTTP_RESPONSE" = "403" ]; then
    print_status "OK" "HTTP accesible (código: $HTTP_RESPONSE - requiere autenticación)"
elif [ "$HTTP_RESPONSE" = "200" ]; then
    print_status "OK" "HTTP accesible (código: $HTTP_RESPONSE)"
elif [ -n "$HTTP_RESPONSE" ]; then
    print_status "WARNING" "HTTP accesible pero código inesperado: $HTTP_RESPONSE"
else
    print_status "ERROR" "HTTP no accesible (timeout o error de red)"
fi

# Verificar conectividad con autenticación
echo -e "\nVerificando conectividad con autenticación..."
if [ -n "$OPENSEARCH_USERNAME" ] && [ -n "$OPENSEARCH_PASSWORD" ]; then
    AUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 15 -k -u "$OPENSEARCH_USERNAME:$OPENSEARCH_PASSWORD" https://$OPENSEARCH_HOST/_cluster/health 2>/dev/null)
    if [ "$AUTH_RESPONSE" = "200" ]; then
        print_status "OK" "Autenticación exitosa (código: $AUTH_RESPONSE)"
    elif [ "$AUTH_RESPONSE" = "401" ]; then
        print_status "WARNING" "Autenticación falló (código: $AUTH_RESPONSE - credenciales incorrectas)"
    elif [ "$AUTH_RESPONSE" = "403" ]; then
        print_status "WARNING" "Acceso denegado (código: $AUTH_RESPONSE - permisos insuficientes)"
    elif [ -n "$AUTH_RESPONSE" ]; then
        print_status "WARNING" "Respuesta inesperada con autenticación: $AUTH_RESPONSE"
    else
        print_status "ERROR" "No se pudo conectar con autenticación (timeout o error de red)"
    fi
else
    print_status "WARNING" "No se configuraron credenciales para autenticación"
fi

echo -e "\n${BLUE}4. DIAGNÓSTICO DE RUTAS${NC}"
echo "----------------------------------------"

# Traceroute (si está disponible)
if command -v traceroute >/dev/null 2>&1; then
    echo "Traceroute a OpenSearch (primeros 5 saltos):"
    traceroute -m 5 $OPENSEARCH_HOST 2>/dev/null | head -10
else
    print_status "WARNING" "traceroute no está disponible"
fi

# Ping (si está disponible)
if command -v ping >/dev/null 2>&1; then
    echo -e "\nPing a OpenSearch (3 paquetes):"
    ping -c 3 $OPENSEARCH_HOST 2>/dev/null
else
    print_status "WARNING" "ping no está disponible"
fi

echo -e "\n${BLUE}5. RECOMENDACIONES${NC}"
echo "----------------------------------------"

if [ -n "$VPC_ID" ]; then
    if [ "$VPC_ID" = "vpc-0435f3000398caa25" ]; then
        print_status "OK" "Tu EC2 está en la misma VPC que OpenSearch"
        echo "   - Verificar Security Groups"
        echo "   - Verificar subnets y routing"
    else
        print_status "WARNING" "Tu EC2 está en VPC diferente: $VPC_ID"
        echo "   - OpenSearch está en: vpc-0435f3000398caa25"
        echo "   - Necesitas VPC Peering o VPN"
    fi
else
    print_status "WARNING" "No se pudo determinar VPC"
    echo "   - Verificar si estás en AWS"
    echo "   - Verificar permisos de metadatos"
fi

echo -e "\n${BLUE}6. COMANDOS DE VERIFICACIÓN${NC}"
echo "----------------------------------------"
echo "Para verificar Security Groups en AWS Console:"
echo "   - OpenSearch: vpc-hoodfy-opensearch-logs"
echo "   - Security Group: hoodfy-postgres-sg"
echo "   - Verificar que permita tráfico desde tu IP/subnet"

echo -e "\nPara verificar conectividad manualmente:"
echo "   curl -v -k -u 'hoodfy_admin:algebraBCQ100+search' \\"
echo "     https://$OPENSEARCH_HOST/_cluster/health"

echo -e "\n${GREEN}🎯 Diagnóstico de red completado!${NC}"
