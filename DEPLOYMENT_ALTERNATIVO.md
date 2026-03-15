# 🚀 astruXo - Deployment Alternativo (Sin GoDaddy)

## ⚠️ Situación Actual

GoDaddy no responde y necesitas publicar actualizaciones críticas en astruXo.net.

---

## ✅ Soluciones Disponibles

### **Opción 1: GitHub Actions + VPS Propio (Recomendada)**

**Requisitos:**
- Tener un VPS (DigitalOcean, AWS EC2, Linode, etc.)
- O contratar uno nuevo (~$5-10/mes)

**Ventajas:**
- ✅ Control total del servidor
- ✅ Deployment automático con cada push a GitHub
- ✅ Sin depender de terceros
- ✅ Más económico a largo plazo

**Pasos:**

1. **Contratar VPS** (si no tienes uno):
   - [DigitalOcean](https://www.digitalocean.com/) ($6/mes)
   - [Linode](https://www.linode.com/) ($5/mes)
   - [AWS EC2](https://aws.amazon.com/ec2/) (gratis 12 meses)

2. **Configurar servidor**:
   ```bash
   # Conéctate a tu VPS
   ssh root@tu_server_ip

   # Instalar Node.js
   curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
   apt-get install -y nodejs

   # Instalar PM2
   npm install -g pm2

   # Instalar MySQL
   apt-get install -g mysql-server

   # Instalar Nginx
   apt-get install -y nginx
   ```

3. **Configurar GitHub Actions**:
   - Generar SSH key: `ssh-keygen -t ed25519 -C "github-actions"`
   - Copiar clave pública al servidor: `ssh-copy-id user@server`
   - Agregar secretos en GitHub (ver `.github/GITHUB_SECRETS.md`)

4. **Hacer push a GitHub**:
   ```bash
   git add .
   git commit -m "Critical security fixes"
   git push origin main
   ```

   ¡El deployment se hace automáticamente!

---

### **Opción 2: Platform as a Service (PaaS)**

**Plataformas recomendadas:**

| Plataforma | Precio | Ventajas |
|------------|--------|----------|
| [Railway](https://railway.app/) | $5/mes | Fácil, incluye DB |
| [Render](https://render.com/) | Gratis-$7/mes | Generoso free tier |
| [Fly.io](https://fly.io/) | $5/mes | Edge computing |
| [Heroku](https://www.heroku.com/) | $7/mes | Clásico, confiable |

**Pasos para Railway:**

1. Crear cuenta en Railway.app
2. Conectar repositorio de GitHub
3. Agregar variables de entorno (.env)
4. Deploy automático con cada push

**Pasos para Render:**

1. Crear cuenta en Render.com
2. New Web Service → Conectar GitHub
3. Build command: `npm run build`
4. Start command: `node dist/server.bundle.cjs`
5. Agregar variables de entorno

---

### **Opción 3: VPS + Panel de Control**

**Para hosting más parecido a GoDaddy:**

1. **CloudPanel** (gratis):
   - Panel moderno y rápido
   - Incluye gestor de archivos
   - Soporta Node.js

2. **cPanel** (pago):
   - El mismo que usa GoDaddy
   - Más familiar

3. **Plesk** (pago):
   - Alternativa a cPanel
   - Bueno para Node.js

---

## 📋 **Migración de astruXo.net**

### **Paso 1: Exportar Base de Datos**

```bash
# En tu servidor actual (si tienes acceso)
mysqldump -u root astruxo_dev > astruxo_backup.sql
```

### **Paso 2: Configurar Nuevo Servidor**

```bash
# Crear base de datos
mysql -u root -p
CREATE DATABASE astruxo_prod;
EXIT;

# Importar datos
mysql -u root -p astruxo_prod < astruxo_backup.sql
```

### **Paso 3: Configurar DNS**

1. Ir a donde compraste el dominio (GoDaddy)
2. DNS Management → Editar registros A
3. Apuntar a nueva IP del servidor
4. Esperar propagación (2-48 horas)

### **Paso 4: Configurar SSL**

```bash
# En nuevo servidor
apt-get install certbot python3-certbot-nginx
certbot --nginx -d astruxo.net -d www.astruxo.net
```

---

## 🔧 **Archivos de Deployment Incluídos**

En este repositorio:

```
.github/
├── workflows/
│   └── deploy.yml          # GitHub Actions workflow
└── GITHUB_SECRETS.md       # Instrucciones de secretos

DEPLOYMENT_ALTERNATIVO.md   # Esta guía
```

---

## 💰 **Costos Estimados**

| Opción | Costo Mensual | Setup |
|--------|---------------|-------|
| VPS propio (DigitalOcean) | $6 | 30 min |
| Railway | $5-10 | 15 min |
| Render | Gratis-$7 | 15 min |
| Heroku | $7 | 15 min |

**Comparado con GoDaddy:** Similar o más barato, con más control.

---

## 🆘 **Si GoDaddy Nunca Responde**

### **Escenario: No tienes acceso al servidor actual**

1. **El dominio astruXo.net sigue siendo tuyo** (lo compraste)
2. **Puedes apuntar el dominio a un nuevo servidor**
3. **El código lo tienes localmente** (ya está buildiando)

**Pasos de emergencia:**

1. Contratar VPS nuevo (DigitalOcean, $6/mes)
2. Configurar servidor (1 hora)
3. Subir aplicación (15 min)
4. Cambiar DNS en GoDaddy (5 min)
5. Esperar propagación (2-48 horas)

**Resultado:** astruXo.net funcionará en el nuevo servidor sin necesidad de GoDaddy.

---

## 📞 **Soporte Alternativo**

Si necesitas ayuda técnica:

- **DigitalOcean Community**: Tutoriales gratuitos excelentes
- **Stack Overflow**: Para errores específicos
- **Reddit r/webhosting**: Recomendaciones de hosting
- **Discord de desarrollo**: Ayuda en tiempo real

---

## ✅ **Checklist de Migración**

- [ ] Contratar nuevo VPS
- [ ] Configurar servidor (Node.js, MySQL, Nginx)
- [ ] Exportar base de datos (si hay acceso)
- [ ] Importar datos en nuevo servidor
- [ ] Configurar variables de entorno
- [ ] Subir aplicación
- [ ] Configurar DNS del dominio
- [ ] Configurar SSL (HTTPS)
- [ ] Probar aplicación
- [ ] Monitorear por errores

---

## 🎯 **Recomendación Personal**

**Para tu caso específico:**

1. **Corto plazo (hoy):**
   - Contrata DigitalOcean Droplet ($6/mes)
   - Sigue tutorial de deployment
   - Cambia DNS en GoDaddy

2. **Mediano plazo (1 semana):**
   - Configura GitHub Actions
   - Deployment automático
   - Monitoreo y backups automáticos

3. **Largo plazo:**
   - Considera múltiples servidores
   - CDN para mejor performance
   - Backups en otra región

---

## 📧 **Contactar GoDaddy (Opcional)**

Si aún quieres intentar con GoDaddy:

```
Asunto: URGENTE - Acceso a aplicación Node.js - astruXo.net

Hola,

Mi aplicación astruXo.net fue creada con Airo AI y necesito 
actualizaciones críticas de seguridad.

Si no recibo respuesta en 24 horas, procederé a migrar a otro 
servidor. Solo necesito:

1. Acceso FTP/SFTP al directorio de la aplicación
2. Instrucciones para reiniciar el servicio Node.js

Gracias.
```

---

**¿Listo para proceder? Te puedo guiar paso a paso en cualquiera de estas opciones.**
