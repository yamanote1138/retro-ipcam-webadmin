# Retro IP Camera Web Admin - Project Guide

This file contains project conventions, architecture decisions, and development standards for maintaining consistency across Claude sessions.

## Project Overview

**Retro IP Camera Web Admin** is a modern web-based administration interface for older Amcrest (and compatible Dahua-based) IP cameras whose original web interfaces no longer work on modern browsers. It's a single-page application (SPA) that provides direct HTTP communication with camera devices using the Amcrest HTTP CGI API.

### Problem Being Solved
- Old Amcrest camera web interfaces require deprecated browser plugins (ActiveX, Flash)
- Firmware updates have stopped for older camera models
- Users still have functional hardware but can't access management interfaces
- Need a modern, cross-browser compatible admin interface

### Tech Stack
- **Vue 3** with Composition API and TypeScript
- **Vite** for fast development and building
- **Bootstrap 5** for responsive UI components
- **digest-fetch** for HTTP Digest Authentication
- **Node.js 20+** required

### Current Version
v0.1.0 - Initial development phase with core infrastructure and connection setup.

## Architecture Principles

### Pure Frontend SPA
- **No backend server** - The browser communicates directly with cameras via HTTP
- **Direct HTTP/HTTPS connection** - Uses digest-fetch library for authentication
- **Network requirement** - Browser and camera must be on the same network
- **Runtime configuration** - Connection settings configured through web UI

### Key Architecture Decisions

1. **HTTP Digest Authentication**
   - Uses `digest-fetch` library for automatic digest auth handling
   - Supports standard RFC 7616 digest authentication
   - Works in modern browsers without Node.js-specific dependencies

2. **Singleton State Pattern**
   - Camera connection state is managed as a singleton in `useCamera` composable
   - Single CameraApiClient instance shared across all components
   - State persists across component mounts/unmounts

3. **Response Parser**
   - Amcrest cameras return two formats: key=value and JSON
   - Custom parser handles key=value format with nested properties
   - Supports array notation like `Encode[0].MainFormat[0].Video.Width=1920`

4. **Runtime Configuration**
   - Connection settings configured through web UI on first launch
   - Settings stored in browser localStorage
   - No environment variables or build-time configuration needed
   - Logout button returns to setup screen to change settings

5. **Video Display Strategy (MVP)**
   - Snapshot polling (request JPEG every 500-1000ms)
   - Simple, works everywhere, no codec issues
   - Good for older cameras with limited streaming support
   - MJPEG and RTSP support planned for future

## Project Structure

```
/Users/spitfire/Projects/retro-ipcam-webadmin/
├── src/
│   ├── components/          # Vue components
│   │   ├── ConnectionSetup.vue  # Initial connection form
│   │   └── StatusBar.vue        # Connection status display
│   ├── composables/         # Reusable composition functions
│   │   └── useCamera.ts        # Main camera client (singleton)
│   ├── types/              # TypeScript type definitions
│   │   ├── camera.ts           # Camera-related types
│   │   └── digest-fetch.d.ts   # Type declarations for digest-fetch
│   ├── utils/              # Utility functions
│   │   ├── logger.ts           # Logging utility
│   │   ├── parser.ts           # key=value response parser
│   │   └── apiClient.ts        # Camera API client
│   ├── App.vue             # Root component
│   └── main.ts             # Application entry point
├── resources/              # Documentation
│   ├── HTTP_API_V3.26.pdf      # Amcrest API documentation
│   └── HTTP_API_V3.26.txt      # Extracted text version
├── debug/                  # Debug files (GITIGNORED)
├── public/                 # Static assets
├── vite.config.ts          # Vite build configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies and scripts
├── CLAUDE.md               # This file
└── README.md               # User documentation
```

## Development Conventions

### Vue/TypeScript Style

1. **Composition API Only**
   - Use `<script setup>` syntax for all components
   - Prefer `ref` and `computed` over reactive objects
   - Use TypeScript with proper type annotations

2. **Component Organization**
   ```vue
   <script setup lang="ts">
   // 1. Imports (grouped: vue, external libs, local)
   import { ref, computed, onMounted } from 'vue'
   import { useCamera } from '@/composables/useCamera'

   // 2. Props/Emits
   const props = defineProps<{ ... }>()
   const emit = defineEmits<{ ... }>()

   // 3. Composables
   const { state, methods } = useCamera()

   // 4. Local state
   const localState = ref(...)

   // 5. Computed properties
   const computedValue = computed(() => ...)

   // 6. Methods
   const handleAction = () => { ... }

   // 7. Lifecycle hooks
   onMounted(() => { ... })
   </script>

   <template>
     <!-- Simple, semantic HTML with Bootstrap classes -->
   </template>

   <style scoped>
     /* Component-specific styles */
   </style>
   ```

3. **Import Aliases**
   - Use `@/` for src imports: `import { logger } from '@/utils/logger'`
   - Never use relative paths like `../../utils/logger`

4. **Logging**
   - Use the centralized logger from `@/utils/logger`
   - Available methods: `logger.debug()`, `logger.info()`, `logger.warn()`, `logger.error()`
   - Don't use `console.log()` directly

5. **Debugging Files**
   - ALWAYS place debugging scripts, test files, and screenshots in the `debug/` directory
   - The `debug/` directory is gitignored and never committed
   - Keep the root directory clean - no uncommitted files outside of `debug/`

### Runtime Configuration

Connection settings configured through web UI:

1. **Connection Setup Screen**
   - Displayed on first launch
   - Form fields for camera host, port, username, password
   - Secure connection toggle (HTTP vs HTTPS)
   - Debug logging checkbox
   - Settings saved to browser localStorage

2. **LocalStorage Keys**
   - `camera-connection-settings` - JSON object with connection configuration
   - `camera-debug-enabled` - String 'true'/'false' for debug logging
   - Settings persist across browser sessions
   - Settings are per-browser, per-domain

3. **Logger Configuration**
   - Debug messages only show when `localStorage.getItem('camera-debug-enabled') === 'true'`
   - Info, warn, error always shown
   - User controls via checkbox in ConnectionSetup

4. **Changing Settings**
   - User clicks "Logout" button in StatusBar
   - Calls `disconnect()` to clean up camera client
   - Returns to ConnectionSetup screen
   - New settings saved and connection re-established

### Git Commit Conventions

1. **Commit Message Format**
   - Use clear, descriptive commit messages
   - Focus on the "why" not just the "what"
   - NO AI attribution in commits

2. **Feature Commits**
   - Examples:
     - `Implement core infrastructure with digest authentication`
     - `Add connection setup UI components`
     - `Create video preview with snapshot polling`

### Code Quality

1. **TypeScript Strictness**
   - Run `npm run type-check` before committing
   - Fix all TypeScript errors - don't use `@ts-ignore`
   - Properly type all function parameters and return values

2. **Build Process**
   - Build command runs type-check automatically: `npm run build`
   - Must pass type-check before successful build

3. **Responsive Design**
   - Mobile-first approach
   - Bootstrap utility classes for responsive layouts
   - Dev server allows network access (`host: true`) for device testing

## Amcrest HTTP API

### API Characteristics
- **Two formats:** CGI-style key=value and JSON
- **Authentication:** HTTP Digest Authentication (RFC 7616)
- **Port:** Default HTTP port 80 (HTTPS on 443)

### Essential API Endpoints

**System Information:**
- `GET /cgi-bin/magicBox.cgi?action=getDeviceType`
- `GET /cgi-bin/magicBox.cgi?action=getSoftwareVersion`
- `GET /cgi-bin/magicBox.cgi?action=getSerialNo`

**Video Access:**
- Snapshot: `GET /cgi-bin/snapshot.cgi?channel=1`
- MJPEG: `GET /cgi-bin/mjpg/video.cgi?channel=1&subtype=1`

**Configuration:**
- `GET /cgi-bin/configManager.cgi?action=getConfig&name=Encode`
- `GET /cgi-bin/configManager.cgi?action=setConfig&...`

**System Control:**
- Reboot: `GET /cgi-bin/magicBox.cgi?action=reboot`

See `resources/HTTP_API_V3.26.pdf` for complete documentation.

## Common Tasks

### Starting Development
```bash
cd /Users/spitfire/Projects/retro-ipcam-webadmin
npm install
npm run dev  # Starts at http://localhost:5173
```

### Building for Production
```bash
npm run type-check  # Check TypeScript errors
npm run build       # Type-checks and builds
npm run preview     # Preview production build
```

### Testing with Your Cameras
- Old camera: http://192.168.1.10 (admin / YOUR_PASSWORD)
- New camera: http://192.168.1.18 (admin / YOUR_PASSWORD)

## Security Considerations

1. **Password Storage** - Stored in browser localStorage (not encrypted), warn users
2. **HTTP vs HTTPS** - Cameras often only support HTTP, digest auth provides protection
3. **CORS Handling** - Direct browser-to-camera requires CORS support
4. **Authentication** - Never log passwords or auth headers

## References

- **Amcrest HTTP API V3.26**: `resources/HTTP_API_V3.26.pdf`
- **digest-fetch Package**: https://www.npmjs.com/package/digest-fetch
- **Vue 3 Docs**: https://vuejs.org/guide/
- **Bootstrap 5**: https://getbootstrap.com/docs/5.3/

---

*Last Updated: February 2026 (v0.1.0)*
