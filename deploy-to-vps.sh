#!/bin/bash
# ============================================
# astruXo - Deployment Script para VPS
# ============================================
# Uso: ./deploy-to-vps.sh user@your-server.com
# ============================================

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuración
SERVER=${1:-$DEPLOY_SERVER}
DEPLOY_PATH=${2:-"/var/www/astruxo"}
BACKUP_PATH="/var/backups/astruxo"

echo -e "${YELLOW}============================================${NC}"
echo -e "${YELLOW}astruXo - Deployment a Producción${NC}"
echo -e "${YELLOW}============================================${NC}"

# Verificar servidor
if [ -z "$SERVER" ]; then
    echo -e "${RED}Error: Debes especificar el servidor${NC}"
    echo "Uso: $0 user@server.com [deploy_path]"
    exit 1
fi

echo -e "${GREEN}Servidor: $SERVER${NC}"
echo -e "${GREEN}Directorio: $DEPLOY_PATH${NC}"

# Verificar build
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}Build no encontrado. Construyendo...${NC}"
    npm run build
fi

# Crear backup remoto
echo -e "${YELLOW}[1/5] Creando backup remoto...${NC}"
ssh $SERVER "mkdir -p $BACKUP_PATH && cp -r $DEPLOY_PATH $BACKUP_PATH/astruxo_backup_$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo 'No hay versión previa'"

# Subir archivos
echo -e "${YELLOW}[2/5] Subiendo archivos...${NC}"
scp -r dist/* $SERVER:$DEPLOY_PATH/

# Subir package.json para dependencias
echo -e "${YELLOW}[3/5] Subiendo package.json...${NC}"
scp package.json $SERVER:$DEPLOY_PATH/

# Instalar dependencias en servidor
echo -e "${YELLOW}[4/5] Instalando dependencias en servidor...${NC}"
ssh $SERVER "cd $DEPLOY_PATH && npm ci --production"

# Reiniciar aplicación
echo -e "${YELLOW}[5/5] Reiniciando aplicación...${NC}"
ssh $SERVER "cd $DEPLOY_PATH && pm2 restart all || pm2 start dist/server.bundle.cjs --name astruxo"

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✅ Deployment completado exitosamente${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${YELLOW}Próximos pasos:${NC}"
echo "1. Verifica el sitio: https://astruXo.net"
echo "2. Revisa logs: ssh $SERVER 'pm2 logs astruxo'"
echo "3. Monitorea: ssh $SERVER 'pm2 status'"
