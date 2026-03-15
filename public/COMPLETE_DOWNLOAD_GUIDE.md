# 📦 LiveStream Platform - Guía Completa de Descarga

## 🎯 Aplicación 100% Descargable y Autónoma

Esta guía te permitirá descargar y ejecutar tu LiveStream Platform completa en cualquier servidor o computadora local.

---

## 📋 Contenido de la Aplicación

### **Funcionalidades Completas:**
- ✅ **Sistema Social:** Posts, likes, comentarios, feed cronológico
- ✅ **Perfiles de Usuario:** Vista de lista y grid, estadísticas, follow/unfollow
- ✅ **Streaming en Vivo:** Transmisiones con Agora, chat en tiempo real
- ✅ **Sistema de Regalos:** Regalos virtuales con animaciones
- ✅ **Pagos:** Integración con Stripe para compra de monedas
- ✅ **Media:** Upload de imágenes y videos, almacenamiento persistente
- ✅ **Autenticación:** Firebase Authentication (email/password)

### **Stack Tecnológico:**
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Backend:** Express.js + Node.js
- **Base de Datos:** MySQL con Drizzle ORM
- **Streaming:** Agora RTC SDK
- **Pagos:** Stripe
- **Autenticación:** Firebase Admin SDK
- **Real-time:** Socket.IO

---

## 📥 Método 1: Descarga Directa desde el Navegador

### **Paso 1: Descargar el Código Fuente**

Visita la página de descarga en tu aplicación:
```
https://tu-app.preview.airoapp.ai/download-export
```

O haz clic en el botón de descarga que aparecerá en la interfaz.

### **Paso 2: Extraer el Archivo**

```bash
# Descomprimir el archivo descargado
tar -xzf livestream-platform-export.tar.gz

# Entrar al directorio
cd livestream-platform
```

---

## 📥 Método 2: Clonar desde Git (Si tienes repositorio configurado)

```bash
# Clonar el repositorio
git clone <tu-repositorio-url>
cd livestream-platform

# Instalar dependencias
npm install
```

---

## 🔧 Configuración Inicial

### **1. Instalar Dependencias**

```bash
npm install
```

### **2. Configurar Variables de Entorno**

Copia el archivo de ejemplo y edita con tus credenciales:

```bash
cp env.example .env
```

Edita `.env` con tus credenciales:

```env
# Base de Datos MySQL
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=tu_usuario
DATABASE_PASSWORD=tu_password
DATABASE_NAME=livestream_platform

# Firebase Admin SDK (Backend)
FIREBASE_PROJECT_ID=tu-proyecto-id
FIREBASE_CLIENT_EMAIL=tu-service-account@proyecto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_CLAVE_PRIVADA\n-----END PRIVATE KEY-----\n"

# Firebase Client SDK (Frontend)
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# Agora (Streaming)
AGORA_APP_ID=tu-agora-app-id
AGORA_APP_CERTIFICATE=tu-agora-certificate

# Stripe (Pagos)
STRIPE_SECRET_KEY=sk_test_tu_clave_secreta
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_tu_clave_publica

# Puerto del servidor
PORT=3000
```

### **3. Configurar Base de Datos MySQL**

```bash
# Crear la base de datos
mysql -u root -p
CREATE DATABASE livestream_platform;
exit;

# Ejecutar migraciones
npm run db:migrate

# (Opcional) Poblar datos de ejemplo
npm run db:seed
```

---

## 🚀 Ejecutar la Aplicación

### **Modo Desarrollo:**

```bash
npm run dev
```

La aplicación estará disponible en: `http://localhost:5173`

### **Modo Producción:**

```bash
# 1. Construir la aplicación
npm run build

# 2. Iniciar el servidor de producción
npm start
```

La aplicación estará disponible en: `http://localhost:3000`

---

## 📁 Estructura de Archivos

```
livestream-platform/
├── src/
│   ├── components/          # Componentes React
│   │   ├── ui/              # Componentes shadcn UI
│   │   ├── PostCard.tsx     # Tarjeta de post
│   │   ├── PostGrid.tsx     # Grid de posts
│   │   ├── CreatePost.tsx   # Formulario crear post
│   │   ├── CommentList.tsx  # Lista de comentarios
│   │   └── ...
│   ├── pages/               # Páginas de la aplicación
│   │   ├── index.tsx        # Streams (antes home)
│   │   ├── feed.tsx         # Feed social (ahora /)
│   │   ├── user/[userId].tsx # Perfil de usuario
│   │   ├── post/[postId].tsx # Detalle de post
│   │   └── ...
│   ├── server/              # Backend
│   │   ├── api/             # Endpoints REST
│   │   │   ├── feed/        # API del feed
│   │   │   ├── posts/       # API de posts
│   │   │   ├── users/       # API de usuarios
│   │   │   ├── streams/     # API de streams
│   │   │   └── ...
│   │   ├── db/              # Base de datos
│   │   │   ├── schema.ts    # Schema de Drizzle
│   │   │   └── client.ts    # Cliente de DB
│   │   └── services/        # Servicios
│   │       ├── agora.ts     # Servicio de Agora
│   │       ├── firebase.ts  # Servicio de Firebase
│   │       └── socket.ts    # Socket.IO
│   ├── layouts/             # Layouts
│   │   ├── RootLayout.tsx   # Layout principal
│   │   └── parts/
│   │       ├── Header.tsx   # Header de navegación
│   │       └── Footer.tsx   # Footer
│   └── lib/                 # Utilidades
│       ├── auth-context.tsx # Contexto de autenticación
│       └── utils.ts         # Funciones auxiliares
├── drizzle/                 # Migraciones de DB
├── public/                  # Archivos estáticos
├── package.json             # Dependencias
├── vite.config.ts           # Configuración de Vite
├── tsconfig.json            # Configuración de TypeScript
└── .env                     # Variables de entorno
```

---

## 🔑 Obtener Credenciales

### **Firebase:**
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un proyecto o selecciona uno existente
3. Ve a **Project Settings** → **Service Accounts**
4. Genera una nueva clave privada (para backend)
5. Ve a **Project Settings** → **General** (para frontend)

### **Agora:**
1. Ve a [Agora Console](https://console.agora.io/)
2. Crea un proyecto
3. Obtén el App ID y App Certificate

### **Stripe:**
1. Ve a [Stripe Dashboard](https://dashboard.stripe.com/)
2. Ve a **Developers** → **API Keys**
3. Copia las claves de prueba o producción

---

## 🗄️ Base de Datos

### **Tablas Principales:**

1. **users** - Usuarios de la plataforma
2. **posts** - Posts sociales (texto, imágenes, videos)
3. **comments** - Comentarios en posts
4. **likes** - Likes de usuarios en posts
5. **follows** - Relaciones de seguimiento
6. **streams** - Transmisiones en vivo
7. **chat_messages** - Mensajes de chat en streams
8. **gifts** - Catálogo de regalos virtuales
9. **gift_transactions** - Transacciones de regalos
10. **coin_transactions** - Transacciones de monedas

### **Migraciones:**

Las migraciones se encuentran en `drizzle/` y se aplican automáticamente con:

```bash
npm run db:migrate
```

---

## 🌐 Despliegue en Servidor

### **Opción 1: VPS (DigitalOcean, AWS, etc.)**

```bash
# 1. Conectar al servidor
ssh usuario@tu-servidor.com

# 2. Instalar Node.js y MySQL
sudo apt update
sudo apt install nodejs npm mysql-server

# 3. Clonar o subir el código
git clone <tu-repo> # o usar scp/ftp

# 4. Configurar variables de entorno
cd livestream-platform
nano .env

# 5. Instalar dependencias
npm install

# 6. Configurar base de datos
mysql -u root -p
CREATE DATABASE livestream_platform;
exit;
npm run db:migrate

# 7. Construir y ejecutar
npm run build
npm start

# 8. (Opcional) Usar PM2 para mantener el proceso
npm install -g pm2
pm2 start npm --name "livestream" -- start
pm2 save
pm2 startup
```

### **Opción 2: Docker**

Crea un `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Ejecutar con Docker:

```bash
# Construir imagen
docker build -t livestream-platform .

# Ejecutar contenedor
docker run -p 3000:3000 --env-file .env livestream-platform
```

### **Opción 3: Servicios Cloud (Heroku, Railway, etc.)**

Sigue las instrucciones específicas de cada plataforma. Generalmente:

1. Conecta tu repositorio Git
2. Configura las variables de entorno en el panel
3. La plataforma detectará automáticamente Node.js y ejecutará `npm run build` y `npm start`

---

## 🔒 Seguridad en Producción

### **Checklist de Seguridad:**

- [ ] Cambiar todas las claves de `.env` a valores de producción
- [ ] Usar claves de Stripe en modo producción
- [ ] Configurar CORS correctamente
- [ ] Usar HTTPS (certificado SSL)
- [ ] Configurar firewall en el servidor
- [ ] Hacer backup regular de la base de datos
- [ ] Limitar rate limiting en APIs
- [ ] Validar todos los inputs del usuario
- [ ] Sanitizar contenido de posts y comentarios

---

## 📊 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo

# Producción
npm run build            # Construir para producción
npm start                # Iniciar servidor de producción

# Base de Datos
npm run db:generate      # Generar migraciones
npm run db:migrate       # Aplicar migraciones
npm run db:seed          # Poblar datos de ejemplo

# Testing y Calidad
npm run type-check       # Verificar tipos de TypeScript
npm run lint             # Ejecutar ESLint
npm run test             # Ejecutar tests
```

---

## 🆘 Solución de Problemas

### **Error: Cannot connect to database**
```bash
# Verificar que MySQL esté corriendo
sudo systemctl status mysql

# Verificar credenciales en .env
# Verificar que la base de datos exista
mysql -u root -p -e "SHOW DATABASES;"
```

### **Error: Firebase authentication failed**
```bash
# Verificar que las credenciales de Firebase sean correctas
# Verificar que el proyecto de Firebase esté activo
# Verificar que la clave privada esté en formato correcto (con \n)
```

### **Error: Port already in use**
```bash
# Cambiar el puerto en .env
PORT=3001

# O matar el proceso que usa el puerto
lsof -ti:3000 | xargs kill -9
```

### **Error: Module not found**
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

---

## 📞 Soporte

Si tienes problemas con la descarga o configuración:

1. Revisa los logs del servidor: `npm run dev` o `pm2 logs`
2. Verifica que todas las variables de entorno estén configuradas
3. Asegúrate de que MySQL esté corriendo y accesible
4. Verifica que los puertos no estén bloqueados por firewall

---

## 🎉 ¡Listo!

Tu LiveStream Platform está ahora completamente descargable y lista para ejecutarse en cualquier servidor. 

**Características incluidas:**
- ✅ Código fuente completo
- ✅ Base de datos con migraciones
- ✅ Autenticación con Firebase
- ✅ Sistema social completo
- ✅ Streaming en vivo
- ✅ Pagos con Stripe
- ✅ Documentación completa

**Próximos pasos recomendados:**
1. Configurar dominio personalizado
2. Configurar SSL/HTTPS
3. Configurar backups automáticos
4. Monitoreo con herramientas como PM2 o New Relic
5. CDN para archivos estáticos (Cloudflare, AWS CloudFront)

---

**Versión:** 1.0.0  
**Última actualización:** Marzo 2026  
**Licencia:** MIT (o la que prefieras)
