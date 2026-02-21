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
v2.0.0 - Major architectural overhaul: single Node.js server, mandatory proxy, encrypted storage.

## Architecture Principles

### Single Server Architecture
- **Integrated Node.js server** - Serves static Vue app and handles camera proxy requests
- **Mandatory CORS proxy** - All camera requests routed through `/proxy/*` endpoints
- **HTTP Digest authentication** - Handled server-side using digest-fetch library
- **Single port** - Everything runs on port 8888 (configurable)
- **Network requirement** - Server and camera must be on the same network
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

6. **Integrated Proxy (Mandatory)**
   - Older cameras don't support CORS headers required by modern browsers
   - All camera API requests routed through integrated Express proxy
   - **Production**: Single `server.mjs` handles both static files and proxy routes
   - **Development**: Separate `proxy-server.mjs` (port 3001) + Vite dev server (port 5173)
   - Handles HTTP Digest auth server-side and forwards requests
   - Proxy mode is always enabled (not configurable)

## Project Structure

```
/Users/spitfire/Projects/retro-ipcam-webadmin/
├── src/
│   ├── components/              # Vue components
│   │   ├── ConnectionSetup.vue      # Initial connection configuration
│   │   ├── StatusBar.vue            # App header with connection status
│   │   ├── CameraInfoPage.vue       # System information display page
│   │   ├── OverlaysPage.vue         # Video overlays management page
│   │   ├── PtzPage.vue              # PTZ controls and presets page
│   │   ├── VideoPreview.vue         # Live camera snapshot display
│   │   ├── SystemInfo.vue           # Camera details component
│   │   └── VideoOverlaySettings.vue # Overlay control panel (tabbed)
│   ├── composables/             # Reusable composition functions
│   │   ├── useCamera.ts            # Camera API client (singleton)
│   │   └── useDarkMode.ts          # Dark mode state management
│   ├── types/                  # TypeScript type definitions
│   │   ├── camera.ts               # Camera-related types
│   │   └── digest-fetch.d.ts       # Type declarations for digest-fetch
│   ├── utils/                  # Utility functions
│   │   ├── logger.ts               # Centralized logging
│   │   ├── parser.ts               # key=value response parser
│   │   ├── apiClient.ts            # Camera API client with digest auth
│   │   └── fetch-stub.ts           # Browser fetch adapter for digest-fetch
│   ├── App.vue                 # Root component with page routing
│   ├── main.ts                 # Application entry point
│   └── style.css               # Global styles and dark mode
├── resources/                  # Documentation
│   ├── HTTP_API_V3.26.pdf          # Amcrest API documentation
│   └── HTTP_API_V3.26.txt          # Extracted text version
├── debug/                      # Debug files (GITIGNORED)
│   ├── test-connection.mjs         # Browser automation test
│   ├── test-proxy.mjs              # Proxy server test
│   └── get-timestamp-position.mjs  # Debug overlay position query
├── public/                     # Static assets
├── server.mjs                  # Production server (static files + proxy)
├── proxy-server.mjs            # Development-only proxy server (port 3001)
├── Dockerfile                  # Single-stage Docker build (Node 20 Alpine)
├── compose.yaml                # Production Docker Compose
├── compose.dev.yaml            # Development Docker Compose
├── .dockerignore               # Docker build exclusions
├── vite.config.ts              # Vite build configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies and scripts
├── CLAUDE.md                   # This file (developer documentation)
└── README.md                   # User documentation
```

## Implemented Features

### 1. Connection Management
- **Runtime configuration** through web UI
- **HTTP Digest Authentication** with digest-fetch library (server-side)
- **Integrated CORS proxy** (mandatory, always enabled)
- **Encrypted localStorage** using AES-256-GCM with PBKDF2 key derivation
- **Password-protected unlock** on each session (password never stored)
- **Logout functionality** to reconfigure connection

### 2. System Information Display
- Device type and model information
- Firmware version
- Serial number
- Connection status indicator

### 3. Video Preview
- **Snapshot polling** (refreshes every 500ms)
- Live JPEG display from camera
- Automatic refresh with smooth transitions
- Works with all camera models that support `/cgi-bin/snapshot.cgi`

### 4. Video Overlay Management
Comprehensive control over camera text overlays with tabbed interface:

#### Camera Name Overlay
- Custom text input
- Visibility toggle
- Six position presets (top-left, top-center, top-right, bottom-left, bottom-center, bottom-right)
- Background opacity slider (0-100%)
- Coordinates match timestamp spacing (Y=352 for top positions)

#### Timestamp Overlay
- Visibility toggle
- Position control (6 presets)
- Background opacity slider
- Proper edge spacing (Y=352 for top, Y=7424 for bottom)

#### Logo/Branding Overlay
- Visibility toggle
- Position control (6 presets)
- Supports PictureTitle overlay type

#### Technical Details
- **Coordinate system**: 0-8192 normalized coordinates
- **Position presets**: Pre-calculated rectangles for consistent placement
- **Opacity conversion**: UI 0-100% → Camera API 0-255 alpha
- **API endpoint**: `/cgi-bin/configManager.cgi?action=setConfig` with VideoWidget parameters

### 5. PTZ Controls
Comprehensive Pan/Tilt/Zoom control interface for cameras with motorized mounts:

#### Directional Controls
- **8-way movement** grid (Up, Down, Left, Right, and 4 diagonals)
- **Mouse-based operation**: Hold button to move, release to stop
- **Compact button layout** (180px grid, 0.4rem padding)
- **Continuous movement** via mousedown/mouseup/mouseleave handlers

#### Zoom & Focus
- **Zoom controls**: ZoomWide (zoom out) and ZoomTele (zoom in)
- **Focus controls**: FocusNear and FocusFar
- **Same mouse-based operation** as directional controls

#### Speed Control
- **Adjustable speed slider** (1-8 range)
- **Real-time speed updates** without needing to restart movement
- **Default speed**: 4 (medium)

#### Preset Management
- **16 preset slots** with three actions per preset:
  - **Go**: Move camera to saved position
  - **Save**: Store current position as preset
  - **Clear**: Delete preset (with confirmation)
- **Status messages**: Success/error feedback for all operations
- **Movement lock**: Prevents concurrent movements

#### Technical Details
- **API endpoint**: `/cgi-bin/ptz.cgi`
- **Start movement**: `action=start&code=<code>&arg2=<speed>`
- **Stop movement**: `action=stop&code=<code>`
- **Preset commands**: GotoPreset, SetPreset, ClearPreset with `arg2=<preset_num>`
- **Cleanup on unmount**: Automatically stops active movements when component unmounts

### 6. Dark Mode
- **Toggle button** in StatusBar with sun/moon icons
- **Bootstrap 5 native dark mode** using `data-bs-theme="dark"` attribute
- **System preference detection** on first load
- **LocalStorage persistence** across sessions
- **Comprehensive styling** for all components (cards, forms, scrollbars, buttons)

### 7. Responsive Design
- **Mobile-first** approach with Bootstrap 5 grid
- **Tabbed navigation** between Camera Info, Overlays, and PTZ pages
- **Responsive breakpoints** optimized for mobile, tablet, and desktop
- **Touch-friendly** controls and buttons
- **Icons** from Bootstrap Icons and Font Awesome

### 8. Docker Support
- **Multi-stage Dockerfile** (Node 20 Alpine builder + Node 20 Alpine runtime)
- **Single Node.js server** serves static files and handles proxy routes
- **Production deployment** with `compose.yaml` (default port 8888)
- **Development mode** with hot reload via `compose.dev.yaml`
- **SPA routing** support (all routes serve index.html via Express middleware)
- **Health checks** for container monitoring
- **Graceful shutdown** handling (SIGINT/SIGTERM)

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

**Local development:**
```bash
cd /Users/spitfire/Projects/retro-ipcam-webadmin

# Install dependencies (first time only)
npm install

# Terminal 1: Start CORS proxy
npm run proxy  # Runs at http://localhost:3001

# Terminal 2: Start dev server
npm run dev  # Starts at http://localhost:5173
```

**Docker development mode (with hot reload):**
```bash
# Start proxy first (in separate terminal)
npm run proxy

# Start Docker dev container
docker compose -f compose.dev.yaml up --build

# Access at http://localhost:5173
# Source changes auto-reload
```

### Building for Production

**Local build:**
```bash
npm run type-check  # Check TypeScript errors
npm run build       # Type-checks and builds to dist/
npm run preview     # Preview production build
```

**Docker production build:**
```bash
# Build and start container
docker compose up --build

# Access at http://localhost:8080
# Or custom port: PORT=3000 docker compose up -d

# Stop container
docker compose down
```

### Testing with Your Cameras

**Camera endpoints:**
- Old camera: http://192.168.1.10 (admin / YOUR_PASSWORD)
- New camera: http://192.168.1.18 (admin / YOUR_PASSWORD)

**Using the proxy (recommended):**
1. Start proxy server: `npm run proxy`
2. Open app in browser
3. Enter connection details:
   - Proxy URL: `http://localhost:3001`
   - Camera Host: `192.168.1.10` (without http://)
   - Username: `admin`
   - Password: `YOUR_PASSWORD`
4. Click Connect

### Running Debug Scripts
```bash
# Test connection via browser automation
node debug/test-connection.mjs

# Test proxy server
node debug/test-proxy.mjs

# Query timestamp overlay position
node debug/get-timestamp-position.mjs
```

### Docker Commands

**Production:**
```bash
# Build and start
docker compose up -d

# View logs
docker compose logs -f

# Stop and remove
docker compose down

# Rebuild after changes
docker compose up --build
```

**Development:**
```bash
# Start with hot reload
docker compose -f compose.dev.yaml up

# Rebuild
docker compose -f compose.dev.yaml up --build

# Stop
docker compose -f compose.dev.yaml down
```

## Development Progress

### ✅ Completed (February 14-15, 2026)

**Step 1: Project Initialization** ✅
- Scaffolded Vite + Vue 3 + TypeScript project
- Configured path aliases (@/ → src/)
- Installed dependencies (bootstrap, digest-fetch, playwright, bootstrap-icons, font-awesome)
- Set up git repository with proper .gitignore
- Created debug/ directory for temporary testing files

**Step 2: Core Infrastructure** ✅
- `src/utils/logger.ts` - Centralized logging with debug mode
- `src/utils/parser.ts` - Response parser for key=value format
- `src/types/camera.ts` - TypeScript type definitions
- `src/types/digest-fetch.d.ts` - Type declarations for digest-fetch
- `src/utils/apiClient.ts` - Camera API client with digest auth
- `src/composables/useCamera.ts` - Singleton state management
- `src/utils/fetch-stub.ts` - Browser fetch adapter for digest-fetch

**Step 3: Connection Setup UI** ✅
- `src/components/ConnectionSetup.vue` - Connection form with validation and encrypted unlock
- `src/components/StatusBar.vue` - Connection status, system info, dark mode toggle, logout
- Updated `src/App.vue` - Routing between setup and main interface
- Bootstrap 5 integration with Bootstrap Icons and Font Awesome
- All TypeScript compilation errors resolved

**Step 3.5: CORS Proxy Implementation** ✅
- Created `proxy-server.mjs` - Express-based CORS proxy server
- Resolves CORS issues with older cameras
- Handles digest auth server-side
- Runs on port 3001 (start with `npm run proxy`)

**Step 4: System Information Display** ✅
- `src/components/SystemInfo.vue` - Display device type, serial, firmware
- Successfully fetches and displays camera system info
- Integrated into CameraInfoPage

**Step 5: Video Preview** ✅
- `src/components/VideoPreview.vue` - Snapshot polling implementation
- Refreshes every 500ms with smooth transitions
- Displays live JPEG from camera `/cgi-bin/snapshot.cgi` endpoint
- Proper error handling and loading states

**Step 6: Video Overlay Settings** ✅
- `src/components/VideoOverlaySettings.vue` - Comprehensive overlay management
- Three tabbed sections: Camera Name, Timestamp, Logo
- Features:
  - Custom camera name text input
  - Visibility toggles for all overlays
  - Six position presets (corners and centers)
  - Background opacity sliders (0-100%)
  - Proper coordinate calculations (0-8192 system)
  - Y=352 for top positions matching timestamp spacing
- Debug script: `debug/get-timestamp-position.mjs` to query positions
- All TypeScript strict mode errors resolved

**Step 7: Main Application Layout** ✅
- `src/App.vue` - Tabbed navigation between Camera Info and Overlays pages
- `src/components/CameraInfoPage.vue` - System information page
- `src/components/OverlaysPage.vue` - Video preview and overlay controls
- Responsive Bootstrap grid layout
- Mobile-first design with proper breakpoints

**Step 7.5: Styling and Dark Mode** ✅
- `src/style.css` - Global styles with dark mode support
- `src/composables/useDarkMode.ts` - Dark mode state management
- Bootstrap 5 native dark mode integration (`data-bs-theme`)
- System preference detection on first load
- LocalStorage persistence
- Comprehensive dark mode styling:
  - Cards, forms, buttons
  - Scrollbars (custom webkit styling)
  - Navigation tabs
  - All UI components

**Step 8: Docker & Documentation** ✅
- `Dockerfile` - Multi-stage build (Node 20 Alpine builder + Node 20 Alpine runtime)
- `server.mjs` - Production Express server (static files + proxy routes)
- `compose.yaml` - Production deployment (port 8888)
- `compose.dev.yaml` - Development mode with Vite hot reload
- `.dockerignore` - Build optimization
- `README.md` - Comprehensive user documentation
- `CLAUDE.md` - Complete developer documentation (this file)
- Health checks and SPA routing support

**Step 9: Testing & Polish** 🔄
- ✅ Successfully tested with real Amcrest cameras (192.168.1.10, 192.168.1.18)
- ✅ CORS proxy resolves network issues
- ✅ macOS Local Network Privacy handled
- ✅ TypeScript strict mode compliance
- ✅ All features working with real hardware
- ⏳ Cross-browser testing (tested in Chrome, needs Firefox/Safari)
- ⏳ Mobile device testing (responsive design implemented)

### 🔧 Issues Resolved

**1. digest-fetch Browser Compatibility**
- **Problem**: `digest-fetch` tried to import Node.js-specific `node-fetch` package
- **Solution**: Created `src/utils/fetch-stub.ts` adapter using browser's native fetch
- **Status**: ✅ Fixed - Works in all modern browsers

**2. TypeScript Strict Mode Errors**
- **Problem**: Undefined array access in parser.ts and overlay settings
- **Solution**: Added proper null checks and type guards
- **Status**: ✅ Fixed - Type checking passes

**3. Camera Network Accessibility**
- **Problem**: Cameras not responding to direct browser requests
- **Solution**: Implemented CORS proxy server (proxy-server.mjs)
- **Status**: ✅ Fixed - Proxy successfully handles all camera communication

**4. macOS Local Network Privacy**
- **Problem**: Intermittent connection issues on macOS
- **Solution**: Verified browser has Local Network access in System Settings
- **Status**: ✅ Resolved - Documented in README troubleshooting

**5. Overlay Position Spacing**
- **Problem**: Top-left position too close to edge (Y=128)
- **Solution**: Matched timestamp Y-coordinate (Y=352) for proper spacing
- **Status**: ✅ Fixed - All top positions use Y=352

**6. TypeScript Errors in findClosestPosition**
- **Problem**: Array element access could return undefined
- **Solution**: Added proper undefined checks for all array accesses
- **Status**: ✅ Fixed - Strict mode compliant

### 🚀 Current Status

**Application State:**
- ✅ Feature-complete v1.0.0
- ✅ All planned features implemented
- ✅ Successfully tested with real hardware
- ✅ Production-ready Docker deployment
- ✅ Comprehensive documentation

**Known Working:**
- ✅ Connection setup and authentication
- ✅ System information display
- ✅ Live video preview (snapshot polling)
- ✅ Complete overlay management (name, timestamp, logo)
- ✅ Dark mode with persistence
- ✅ Responsive mobile design
- ✅ Docker containerization
- ✅ CORS proxy for camera compatibility

### 📝 Future Enhancements (Not Planned for v1.0)

Consider for future versions:
- [ ] Multi-camera support (manage multiple cameras)
- [ ] Network settings management (IP, DHCP, DNS, WiFi)
- [ ] Image quality settings (brightness, contrast, exposure)
- [ ] Motion detection configuration
- [ ] PTZ controls (for supported cameras)
- [ ] Recording management (view/download footage)
- [ ] MJPEG live streaming (alternative to snapshot polling)
- [ ] Firmware upgrade support
- [ ] User management (camera users)
- [ ] Network camera discovery (UPnP/SSDP)
- [ ] Export/import camera settings

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

*Last Updated: February 15, 2026 (v1.0.0)*
