# astruXo - LiveStream Platform

A modern, production-ready live streaming platform built with Vite, React, TypeScript, and Agora.io. Features real-time video streaming, live chat, virtual gifts, and monetization capabilities.

## 📊 System Status

**Current Version:** 964c097  
**Health Score:** 85/100 ✅  
**Status:** Production Stable  
**Last Maintenance:** March 10, 2026

📋 [View Full Health Report](SYSTEM_HEALTH_REPORT.md) | 🔧 [Maintenance Guide](QUICK_MAINTENANCE_GUIDE.md) | 📅 [Maintenance Schedule](MAINTENANCE_SCHEDULE.md)

## 🚀 Features

### **Live Streaming**
- **📹 HD Video Streaming**: Powered by Agora.io with 720p @ 30fps
- **🎙️ Audio Broadcasting**: High-quality audio with music_standard profile
- **📊 Real-time Analytics**: Viewer count, peak viewers, stream duration
- **🔴 Live Indicators**: Visual LIVE badges and status indicators

### **Real-time Chat**
- **💬 Live Chat**: Socket.IO powered real-time messaging
- **👥 User Presence**: Join/leave notifications
- **🎨 Host Badges**: Special badges for broadcasters
- **📜 Chat History**: Persistent message storage
- **🔄 Auto-reconnection**: Automatic reconnection on disconnect

### **Virtual Gifts & Monetization**
- **🎁 16 Gift Types**: 4 tiers from 1 to 5000 coins
- **💰 Coin System**: Virtual currency for purchasing gifts
- **💵 Earnings Dashboard**: Track revenue and gift history
- **🎯 Gift Animations**: Floating animations when gifts are sent
- **🔔 Real-time Notifications**: Toast notifications for gift events
- **💳 Stripe Integration**: Ready for payment processing (UI complete)

### **Technical Features**
- **⚡ Lightning Fast**: Vite for instant hot module replacement
- **🎯 Type Safe**: Full TypeScript coverage across frontend and backend
- **🎨 Beautiful UI**: shadcn/ui components with Tailwind CSS
- **🔐 Firebase Auth**: Secure authentication with email/password
- **🗄️ PostgreSQL Database**: Drizzle ORM for type-safe queries
- **📱 Responsive**: Mobile-first design with modern CSS
- **🚀 Production Ready**: Optimized builds and deployment-ready

## 🛠️ Tech Stack

### Frontend

- **React 19** - Modern React with hooks and concurrent features
- **TypeScript 5** - Full type safety across the application
- **Vite 5** - Fast build tool and dev server with HMR
- **Tailwind CSS 3** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible component library
- **React Router DOM** - Client-side routing
- **Motion (Framer Motion)** - Smooth animations and transitions
- **Agora RTC React** - Real-time video streaming SDK
- **Socket.IO Client** - Real-time bidirectional communication

### Backend

- **Express.js** - Web application framework
- **TypeScript** - Type-safe backend development
- **PostgreSQL** - Relational database
- **Drizzle ORM** - Type-safe database queries
- **Firebase Admin** - Server-side authentication
- **Socket.IO** - Real-time WebSocket server
- **Agora Token Server** - Secure token generation for streaming

### Authentication & Security

- **Firebase Auth** - Email/password authentication
- **JWT Tokens** - Secure API authentication
- **Token Refresh** - Automatic token renewal

### Development Tools

- **ESLint 9** - Code linting
- **Prettier** - Code formatting
- **Vitest** - Fast unit testing
- **TypeScript ESLint** - TypeScript-specific linting
- **Drizzle Kit** - Database migrations

## 🎯 Key Features Explained

### Live Streaming Workflow

1. **Go Live**: Users click "Go Live" button, fill in stream details
2. **Broadcasting**: Agora SDK captures camera/mic, publishes to CDN
3. **Viewing**: Viewers join stream, subscribe to video/audio feed
4. **Chat**: Real-time messaging via Socket.IO
5. **Gifts**: Viewers send virtual gifts, broadcasters earn money
6. **End Stream**: Broadcaster ends stream, duration and stats saved

### Monetization System

- **Coin Packages**: 5 tiers from $0.99 (100 coins) to $49.99 (5000 coins + bonus)
- **Gift Catalog**: 16 gifts across 4 tiers (1-5000 coins)
- **Revenue Split**: 1 coin = $0.01 USD for streamers
- **Earnings Dashboard**: Track total earnings, gift history, withdrawal options
- **Transaction History**: Complete audit trail of all coin/gift transactions

### Real-time Features

- **Socket.IO Chat**: Persistent connections, automatic reconnection
- **Viewer Count**: Live updates every 5 seconds
- **Gift Animations**: Floating animations with toast notifications
- **User Presence**: Join/leave notifications in chat
- **Host Badges**: Special visual indicators for broadcasters

## 📁 Project Structure

```
livestream-platform/
├── src/
│   ├── components/           # React components
│   │   ├── ui/               # shadcn/ui base components (40+ components)
│   │   ├── AuthDialog.tsx    # Login/Register modal
│   │   ├── GiftSelector.tsx  # Gift selection modal
│   │   ├── GiftAnimation.tsx # Floating gift animations
│   │   ├── ProtectedRoute.tsx # Auth guard component
│   │   └── Spinner.tsx
│   ├── layouts/              # Layout systems
│   │   ├── RootLayout.tsx    # Centralized layout wrapper
│   │   ├── Website.tsx       # Structural container
│   │   ├── Dashboard.tsx     # Dashboard layout
│   │   └── parts/            # Layout components
│   │       ├── Header.tsx    # Navigation with auth
│   │       └── Footer.tsx
│   ├── pages/                # Page components
│   │   ├── index.tsx         # Homepage (stream list)
│   │   ├── go-live.tsx       # Start stream form
│   │   ├── broadcast/        # Broadcaster pages
│   │   │   ├── [streamId].tsx       # Broadcaster dashboard
│   │   │   └── broadcaster-view.tsx # Agora publisher
│   │   ├── stream/           # Viewer pages
│   │   │   ├── [streamId].tsx # Stream viewer page
│   │   │   └── viewer-view.tsx # Agora subscriber
│   │   ├── user/             # User profiles
│   │   │   └── [userId].tsx
│   │   ├── earnings.tsx      # Earnings dashboard
│   │   ├── buy-coins.tsx     # Coin purchase page
│   │   └── _404.tsx
│   ├── lib/                  # Utilities and API
│   │   ├── utils.ts          # Utility functions
│   │   ├── api-client.ts     # API client
│   │   ├── auth-context.tsx  # Auth state management
│   │   └── firebase-client.ts # Firebase client config
│   ├── server/               # Backend code
│   │   ├── api/              # API routes
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   ├── streams/      # Stream management
│   │   │   ├── gifts/        # Gift transactions
│   │   │   ├── wallet/       # Coin/earnings endpoints
│   │   │   └── users/        # User profiles
│   │   ├── db/               # Database
│   │   │   ├── client.ts     # Drizzle client
│   │   │   ├── schema.ts     # Database schema
│   │   │   └── seed-gifts.ts # Gift catalog seeder
│   │   ├── services/         # Business logic
│   │   │   ├── firebase.ts   # Firebase Admin
│   │   │   ├── agora.ts      # Agora token generation
│   │   │   └── socket.ts     # Socket.IO server
│   │   ├── middleware/       # Express middleware
│   │   │   └── auth.ts       # JWT verification
│   │   └── configure.js      # Express setup
│   ├── styles/               # Global styles
│   │   └── globals.css
│   ├── App.tsx               # Root application component
│   ├── main.tsx              # Application entry point
│   └── routes.tsx            # Route definitions
├── drizzle/                  # Database migrations
├── public/                   # Static assets
└── vite.config.ts            # Vite configuration
```

## 📜 Available Scripts

### Development
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

### Database
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Apply database migrations
- `npm run db:seed` - Seed gift catalog (run after migrations)

### Code Quality
- `npm run test` - Run Vitest unit tests
- `npm run lint` - Run ESLint code linting
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier

### Setup
- `npm run setup` - Initialize project with dependencies
- `npm run clean` - Clean build artifacts
- `npm run reset` - Reset node_modules and reinstall

## 🎨 UI Components

This template includes shadcn/ui components that are:

- **Accessible** - Built with Radix UI primitives
- **Customizable** - Easy to modify and extend
- **Consistent** - Design system with CSS variables
- **Copy-paste friendly** - Own your components

The template includes 40+ pre-configured shadcn/ui components:

- **Layout**: Card, Separator, Tabs, Sheet, Dialog
- **Forms**: Button, Input, Textarea, Select, Checkbox, Switch
- **Navigation**: Navigation Menu, Breadcrumb, Pagination
- **Feedback**: Alert, Badge, Progress, Skeleton, Sonner
- **Data Display**: Table, Avatar, Calendar, Hover Card
- **Overlays**: Popover, Tooltip, Alert Dialog, Drawer
- **Interactive**: Accordion, Collapsible, Command, Context Menu

To add new components:

```bash
npx shadcn-ui@latest add component-name
```

## 🧠 AI Integration

### Component Introspection

The custom source-mapper plugin adds metadata to components in development:

```html
<div
  data-source-file="/src/components/Button.tsx"
  data-source-line="15"
  data-source-component="Button"
>
  Click Me
</div>
```

### Development Mode Integration

The dev-tools package provides:

- **Element selection**: Click to identify components
- **Live editing**: Modify component props in real-time
- **Source mapping**: Navigate directly to component source
- **AI integration**: Enhanced context for AI development tools

### AI-Friendly Patterns

- **Consistent naming**: PascalCase components, camelCase hooks
- **Clear file structure**: Logical separation of concerns
- **Type-first approach**: Comprehensive TypeScript types
- **Standard patterns**: CRUD operations, form handling, error boundaries

## 🗃️ API & Layouts

### API Routes

The template includes:

- `GET /api/health` - Health check endpoint
- Extensible API client setup in `src/lib/api-client.ts`

### Layout System

**RootLayout Pattern** (Recommended for multi-page sites):

Configure header and footer once in `App.tsx`, applies to all pages:

```tsx
// src/App.tsx
const headerConfig = {
  logo: { text: "MyApp" },
  navItems: [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
  ],
};

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <RootLayout config={{ header: headerConfig, footer: footerConfig }}>
        <Outlet />
      </RootLayout>
    ),
    children: routes,
  },
]);
```

Pages become simple content components:

```tsx
// src/pages/home.tsx
export default function HomePage() {
  return <div>Your content here</div>;
}
```

**Available Layouts**:

- **RootLayout** (`src/layouts/RootLayout.tsx`) - Centralized header/footer wrapper
- **Website** (`src/layouts/Website.tsx`) - Structural container (used by RootLayout)
- **Dashboard** (`src/layouts/Dashboard.tsx`) - Admin panels and dashboards

See `src/layouts/*.md` for detailed usage documentation.

## 🧪 Testing

Run tests with:

```bash
npm run test
```

The template includes:

- **Vitest** - Fast unit testing framework
- **React Testing Library** - Component testing utilities
- **Jest DOM** - Custom Jest matchers

## 📦 Deployment & Export

### Build for production:

```bash
npm run build
```

### Deploy options:

- **Vercel/Netlify** - Frontend deployment
- **Railway/Render** - Full-stack deployment
- **Docker** - Containerized deployment
- **VPS (DigitalOcean, Linode)** - Full control deployment

### Export for Independent Hosting

This platform is fully portable and can be exported for independent hosting:

1. **Complete Deployment Guide**: See `DEPLOYMENT_GUIDE.md` for:
   - Complete tech stack documentation
   - Environment variables configuration
   - Database schema and migrations
   - API endpoints documentation
   - Third-party integrations (Firebase, Agora, Stripe)
   - Recommended hosting stack
   - Security checklist

2. **Export Instructions**: See `EXPORT_INSTRUCTIONS.md` for:
   - How to export source code
   - File checklist
   - Migration steps
   - Backup procedures
   - Verification checklist

3. **Quick Export**:
   ```bash
   # Create complete archive
   tar -czf livestream-platform-export.tar.gz \
     src/ public/ drizzle/ \
     package.json tsconfig.json vite.config.ts \
     DEPLOYMENT_GUIDE.md EXPORT_INSTRUCTIONS.md
   ```

**The platform includes:**
- ✅ Complete source code (frontend + backend)
- ✅ Database schema with migrations
- ✅ Stripe payment integration
- ✅ Socket.IO real-time features
- ✅ Agora video streaming
- ✅ Firebase authentication
- ✅ Full deployment documentation

## 🔧 Configuration

### Required Secrets

The platform requires the following secrets to be configured:

#### Firebase Authentication
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Server-side Firebase Admin
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

#### Agora.io Streaming
```env
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_certificate
```

### Setup Instructions

1. **Firebase Setup**:
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Email/Password authentication
   - Download service account key for admin SDK
   - Copy credentials to secrets

2. **Agora Setup**:
   - Create an Agora account at https://console.agora.io
   - Create a new project
   - Enable "App Certificate" for secure token generation
   - Copy App ID and Certificate to secrets

3. **Database Setup**:
   ```bash
   npm run db:generate  # Generate migrations
   npm run db:migrate   # Apply migrations
   npm run db:seed      # Seed gift catalog
   ```

### Custom Plugins

**Source Mapper Plugin**: Adds component introspection for AI tools
**Dev Tools Plugin**: Enables development mode enhancements
**Fullstory Integration**: Optional user analytics (configurable)

Configure in `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import { sourceMapperPlugin } from "./source-mapper";
import { devToolsPlugin } from "./dev-tools";

export default defineConfig({
  plugins: [sourceMapperPlugin(), devToolsPlugin()],
});
```

## 🎯 Best Practices

### Component Architecture

- Keep components small and focused
- Use composition over inheritance
- Extract reusable logic into hooks
- Prefer function components with hooks

### State Management

- Keep local state in components with useState/useReducer
- Use React Context for app-wide state (theme, auth)
- Consider external libraries (Zustand, Redux Toolkit) for complex state
- Leverage layout props for shared configuration

### Layout Usage

- Use RootLayout for multi-page sites (configure in `App.tsx`)
- Pages should only contain content, not layout concerns
- Define header/footer once, applies to all pages
- Follow layout documentation in `src/layouts/*.md`
- Never duplicate header/footer config across pages

## 🔧 Maintenance & Monitoring

### Automated Weekly Maintenance

The system includes automated weekly maintenance checks every Sunday at 12:00 AM:

```bash
# Run manual maintenance check
bash scripts/weekly-maintenance.sh
```

**What it checks:**
- ✅ TypeScript errors
- ✅ Linting issues
- ✅ Security vulnerabilities
- ✅ Outdated dependencies
- ✅ Build status
- ✅ Code quality metrics

### Quick Health Check

```bash
# Fast 5-minute check
npm run type-check  # TypeScript
npm run lint        # ESLint
npm audit           # Security
npm run build       # Build test
```

### Documentation

- 📊 **[System Health Report](SYSTEM_HEALTH_REPORT.md)** - Detailed system analysis
- 🚀 **[Quick Maintenance Guide](QUICK_MAINTENANCE_GUIDE.md)** - Fast reference
- 📅 **[Maintenance Schedule](MAINTENANCE_SCHEDULE.md)** - Automation setup

### Health Score System

- **90-100:** ✅ Excellent
- **70-89:** ⚠️ Good (minor attention needed)
- **50-69:** ⚠️ Fair (attention required)
- **0-49:** 🚨 Critical (immediate action)

**Current Score:** 85/100 ✅

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if needed
5. Run linting and tests
6. Submit a pull request

## 📄 License

MIT License - feel free to use this template for any project.

## 🙏 Acknowledgments

Built with amazing open-source tools:

- [Vite](https://vitejs.dev/)
- [React](https://react.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Framer Motion](https://www.framer.com/motion/)
- [Vitest](https://vitest.dev/)

---

**Happy coding! 🎉**
# Trigger deploy
