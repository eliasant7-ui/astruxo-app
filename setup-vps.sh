#!/bin/bash
# ============================================
# Setup Script para VPS - astruXo
# ============================================
# Ejecutar en el VPS nuevo como root
# ============================================

echo "🚀 Configurando servidor para astruXo..."

# Actualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 22
echo "📦 Instalando Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# Verificar instalación
node --version
npm --version

# Instalar PM2
echo "📦 Instalando PM2..."
npm install -g pm2

# Instalar MySQL
echo "📦 Instalando MySQL..."
apt-get install -y mysql-server

# Asegurar MySQL
mysql_secure_installation

# Instalar Nginx
echo "📦 Instalando Nginx..."
apt-get install -y nginx

# Configurar firewall
echo "🔥 Configurando firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable

# Crear directorio de la aplicación
echo "📁 Creando directorio..."
mkdir -p /var/www/astruxo
cd /var/www/astruxo

# Instalar dependencias globales
npm install -g pm2

# Crear usuario para la app (opcional, más seguro)
echo "👤 Creando usuario astruxo..."
useradd -m -s /bin/bash astruxo || echo "Usuario ya existe"
chown -R astruxo:astruxo /var/www/astruxo

# Configurar Nginx como reverse proxy
echo "🌐 Configurando Nginx..."
cat > /etc/nginx/sites-available/astruxo << 'EOF'
server {
    listen 80;
    server_name astruxo.net www.astruxo.net;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io/ {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api/ {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    client_max_body_size 100M;
}
EOF

# Activar sitio
ln -sf /etc/nginx/sites-available/astruxo /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Probar y reiniciar Nginx
nginx -t
systemctl restart nginx

# Instalar Certbot para SSL gratuito
echo "🔒 Instalando Certbot para SSL..."
apt-get install -y certbot python3-certbot-nginx

# Instrucciones para SSL (después de configurar DNS)
echo ""
echo "============================================"
echo "✅ Servidor configurado exitosamente"
echo "============================================"
echo ""
echo "Próximos pasos:"
echo "1. Sube tus archivos a /var/www/astruxo"
echo "2. Configura tu .env con las variables de entorno"
echo "3. Ejecuta: npm run build"
echo "4. Inicia la app: pm2 start dist/server.bundle.cjs --name astruxo"
echo "5. Configura DNS para apuntar a este servidor"
echo "6. Luego ejecuta: certbot --nginx -d astruxo.net -d www.astruxo.net"
echo ""
echo "IP del servidor: $(curl -s ifconfig.me)"
echo ""
