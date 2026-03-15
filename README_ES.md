# 🎥 LiveStream Platform - Aplicación 100% Descargable

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)

## 📋 Descripción

**LiveStream Platform** es una plataforma completa de streaming en vivo con funcionalidades sociales, lista para producción y 100% descargable. Incluye sistema social (posts, likes, comentarios), perfiles de usuario, transmisiones en vivo, chat en tiempo real, regalos virtuales y pagos con Stripe.

---

## ✨ Funcionalidades Principales

### 🎯 **Sistema Social Completo**
- ✅ **Posts:** Crear posts con texto, imágenes o videos
- ✅ **Feed Cronológico:** Ver posts de todos los usuarios con paginación
- ✅ **Likes:** Sistema de likes con contador en tiempo real
- ✅ **Comentarios:** Comentar posts con modal y página dedicada
- ✅ **Compartir:** Compartir posts con URL única
- ✅ **Eliminar:** Eliminar propios posts con validación

### 👤 **Perfiles de Usuario**
- ✅ **Vista de Posts:** Ver posts del usuario en lista o grid (estilo Instagram)
- ✅ **Estadísticas:** Posts, followers, following
- ✅ **Tabs de Contenido:** Posts y Streams
- ✅ **Follow/Unfollow:** Sistema de seguimiento
- ✅ **Editar Perfil:** Cambiar nombre, bio y avatar

### 📹 **Streaming en Vivo**
- ✅ **Transmisiones HD:** Streaming con Agora RTC (720p @ 30fps)
- ✅ **Chat en Tiempo Real:** Socket.IO para mensajería instantánea
- ✅ **Regalos Virtuales:** 16 tipos de regalos con animaciones
- ✅ **Moderación:** Eliminar mensajes y expulsar usuarios
- ✅ **Estadísticas:** Viewers, duración, pico de audiencia

### 💰 **Monetización**
- ✅ **Sistema de Monedas:** Comprar monedas virtuales
- ✅ **Regalos Virtuales:** Enviar regalos a streamers
- ✅ **Dashboard de Ganancias:** Ver ingresos y historial
- ✅ **Integración Stripe:** Pagos seguros con tarjeta

### 📱 **Media y Uploads**
- ✅ **Upload de Imágenes:** Hasta 10MB (JPEG, PNG, GIF, WebP)
- ✅ **Upload de Videos:** Hasta 100MB (MP4, MOV, AVI, WebM)
- ✅ **Almacenamiento Persistente:** Archivos guardados en `/private/media/`
- ✅ **Servicio Optimizado:** Cache de 1 año, Content-Type automático

---

## 🛠️ Stack Tecnológico

### **Frontend**
- **React 19** - Biblioteca UI con últimas características
- **TypeScript** - Tipado estático para mayor seguridad
- **Vite** - Build tool ultra-rápido con HMR
- **Tailwind CSS** - Estilos utility-first
- **shadcn/ui** - Componentes UI pre-construidos
- **Motion** - Animaciones fluidas

### **Backend**
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web minimalista
- **MySQL** - Base de datos relacional
- **Drizzle ORM** - ORM type-safe para TypeScript

### **Servicios**
- **Firebase Auth** - Autenticación de usuarios
- **Agora RTC** - Streaming de video en tiempo real
- **Socket.IO** - Comunicación bidireccional en tiempo real
- **Stripe** - Procesamiento de pagos

---

## 📥 Instalación Rápida

### **1. Clonar o Descargar**

```bash
# Opción 1: Clonar desde Git
git clone <tu-repositorio-url>
cd livestream-platform

# Opción 2: Descargar desde la interfaz
# Visita /download-export en tu aplicación
```

### **2. Instalar Dependencias**

```bash
npm install
```

### **3. Configurar Variables de Entorno**

```bash
cp env.example .env
```

Edita `.env` con tus credenciales:

```env
# Base de Datos
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=tu_password
DATABASE_NAME=livestream_platform

# Firebase (Backend)
FIREBASE_PROJECT_ID=tu-proyecto-id
FIREBASE_CLIENT_EMAIL=tu-email@proyecto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Firebase (Frontend)
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# Agora
AGORA_APP_ID=tu-agora-app-id
AGORA_APP_CERTIFICATE=tu-agora-certificate

# Stripe
STRIPE_SECRET_KEY=sk_test_tu_clave
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_tu_clave
```

### **4. Configurar Base de Datos**

```bash
# Crear base de datos
mysql -u root -p
CREATE DATABASE livestream_platform;
exit;

# Ejecutar migraciones
npm run db:migrate
```

### **5. Ejecutar la Aplicación**

```bash
# Modo desarrollo
npm run dev

# Modo producción
npm run build
npm start
```

La aplicación estará disponible en:
- **Desarrollo:** `http://localhost:5173`
- **Producción:** `http://localhost:3000`

---

## 📁 Estructura del Proyecto

```
livestream-platform/
├── src/
│   ├── components/          # Componentes React
│   │   ├── ui/              # shadcn UI components
│   │   ├── PostCard.tsx     # Tarjeta de post
│   │   ├── PostGrid.tsx     # Grid de posts (Instagram-style)
│   │   ├── CreatePost.tsx   # Formulario crear post
│   │   ├── CommentList.tsx  # Lista de comentarios
│   │   └── CommentsDialog.tsx # Modal de comentarios
│   ├── pages/               # Páginas de la aplicación
│   │   ├── feed.tsx         # Feed social (página principal /)
│   │   ├── index.tsx        # Streams (/streams)
│   │   ├── user/[userId].tsx # Perfil de usuario
│   │   ├── post/[postId].tsx # Detalle de post
│   │   ├── go-live.tsx      # Iniciar transmisión
│   │   └── ...
│   ├── server/              # Backend
│   │   ├── api/             # Endpoints REST
│   │   │   ├── feed/        # API del feed
│   │   │   ├── posts/       # API de posts
│   │   │   ├── users/       # API de usuarios
│   │   │   ├── streams/     # API de streams
│   │   │   ├── upload/      # API de uploads
│   │   │   └── ...
│   │   ├── db/              # Base de datos
│   │   │   ├── schema.ts    # Schema de Drizzle ORM
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
└── .env                     # Variables de entorno
```

---

## 🗄️ Base de Datos

### **Tablas Principales:**

| Tabla | Descripción |
|-------|-------------|
| `users` | Usuarios de la plataforma |
| `posts` | Posts sociales (texto, imágenes, videos) |
| `comments` | Comentarios en posts |
| `likes` | Likes de usuarios en posts |
| `follows` | Relaciones de seguimiento |
| `streams` | Transmisiones en vivo |
| `chat_messages` | Mensajes de chat en streams |
| `gifts` | Catálogo de regalos virtuales |
| `gift_transactions` | Transacciones de regalos |
| `coin_transactions` | Transacciones de monedas |

### **Migraciones:**

```bash
# Generar nueva migración
npm run db:generate

# Aplicar migraciones
npm run db:migrate
```

---

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo (Vite + Express)

# Producción
npm run build            # Construir para producción
npm start                # Iniciar servidor de producción

# Base de Datos
npm run db:generate      # Generar migraciones desde schema
npm run db:migrate       # Aplicar migraciones a la base de datos

# Testing y Calidad
npm run type-check       # Verificar tipos de TypeScript
npm run lint             # Ejecutar ESLint
npm run test             # Ejecutar tests con Vitest
```

---

## 🌐 Despliegue

### **Opción 1: VPS (DigitalOcean, AWS, Linode)**

```bash
# 1. Conectar al servidor
ssh usuario@tu-servidor.com

# 2. Instalar dependencias del sistema
sudo apt update
sudo apt install nodejs npm mysql-server

# 3. Clonar el código
git clone <tu-repo>
cd livestream-platform

# 4. Configurar variables de entorno
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

# 8. (Opcional) Usar PM2
npm install -g pm2
pm2 start npm --name "livestream" -- start
pm2 save
pm2 startup
```

### **Opción 2: Docker**

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

```bash
docker build -t livestream-platform .
docker run -p 3000:3000 --env-file .env livestream-platform
```

### **Opción 3: Servicios Cloud (Heroku, Railway, Render)**

1. Conecta tu repositorio Git
2. Configura las variables de entorno en el panel
3. La plataforma detectará automáticamente Node.js
4. Ejecutará `npm run build` y `npm start`

---

## 🔑 Obtener Credenciales

### **Firebase:**
1. [Firebase Console](https://console.firebase.google.com/)
2. Crear proyecto → Project Settings → Service Accounts
3. Generar clave privada (backend)
4. Copiar configuración web (frontend)

### **Agora:**
1. [Agora Console](https://console.agora.io/)
2. Crear proyecto
3. Copiar App ID y App Certificate

### **Stripe:**
1. [Stripe Dashboard](https://dashboard.stripe.com/)
2. Developers → API Keys
3. Copiar claves de prueba o producción

---

## 🔒 Seguridad

### **Checklist de Producción:**

- [ ] Cambiar todas las claves a valores de producción
- [ ] Usar claves de Stripe en modo live
- [ ] Configurar CORS correctamente
- [ ] Usar HTTPS (certificado SSL)
- [ ] Configurar firewall
- [ ] Backups automáticos de base de datos
- [ ] Rate limiting en APIs
- [ ] Validación de inputs
- [ ] Sanitización de contenido

---

## 📊 APIs Disponibles

### **Posts y Feed**
- `GET /api/feed` - Feed cronológico
- `POST /api/posts` - Crear post
- `GET /api/posts/:id` - Obtener post
- `DELETE /api/posts/:id` - Eliminar post
- `GET /api/users/:id/posts` - Posts de usuario

### **Interacciones**
- `POST /api/posts/:id/like` - Dar like
- `DELETE /api/posts/:id/like` - Quitar like
- `GET /api/posts/:id/comments` - Obtener comentarios
- `POST /api/posts/:id/comments` - Crear comentario

### **Media**
- `POST /api/upload/image` - Subir imagen (max 10MB)
- `POST /api/upload/video` - Subir video (max 100MB)
- `GET /api/media/:filename` - Servir media

### **Streaming**
- `POST /api/streams/start` - Iniciar stream
- `GET /api/streams/live` - Streams activos
- `GET /api/streams/:id` - Obtener stream

---

## 🆘 Solución de Problemas

### **Error: Cannot connect to database**
```bash
# Verificar MySQL
sudo systemctl status mysql

# Verificar credenciales en .env
# Verificar que la base de datos exista
mysql -u root -p -e "SHOW DATABASES;"
```

### **Error: Firebase authentication failed**
- Verificar credenciales en `.env`
- Verificar que el proyecto esté activo
- Verificar formato de la clave privada (con `\n`)

### **Error: Port already in use**
```bash
# Cambiar puerto en .env
PORT=3001

# O matar el proceso
lsof -ti:3000 | xargs kill -9
```

---

## 📄 Licencia

MIT License - Libre para uso personal y comercial.

---

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs: `npm run dev` o `pm2 logs`
2. Verifica las variables de entorno
3. Asegúrate de que MySQL esté corriendo
4. Verifica que los puertos no estén bloqueados

---

## 🎉 ¡Listo para Usar!

Tu LiveStream Platform está completamente lista para ser descargada y ejecutada en cualquier servidor.

**Características incluidas:**
- ✅ Código fuente completo
- ✅ Base de datos con migraciones
- ✅ Autenticación con Firebase
- ✅ Sistema social completo
- ✅ Streaming en vivo con Agora
- ✅ Pagos con Stripe
- ✅ Documentación completa

**Versión:** 1.0.0  
**Última actualización:** Marzo 2026
