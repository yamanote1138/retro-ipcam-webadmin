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
- Old camera: http://192.168.1.10 (admin / 1ts4tr4p!)
- New camera: http://192.168.1.18 (admin / 1ts4tr4p!)

### Running Playwright Tests
```bash
# Run connection test with real camera
node debug/test-connection.mjs
```

## Development Progress

### ✅ Completed (February 14, 2026)

**Step 1: Project Initialization**
- Scaffolded Vite + Vue 3 + TypeScript project
- Configured path aliases (@/ → src/)
- Installed dependencies (bootstrap, digest-fetch, playwright)
- Set up git repository with proper .gitignore
- Created debug/ directory for temporary testing files

**Step 2: Core Infrastructure**
- `src/utils/logger.ts` - Centralized logging with debug mode
- `src/utils/parser.ts` - Response parser for key=value format
- `src/types/camera.ts` - TypeScript type definitions
- `src/types/digest-fetch.d.ts` - Type declarations for digest-fetch
- `src/utils/apiClient.ts` - Camera API client with digest auth
- `src/composables/useCamera.ts` - Singleton state management

**Step 3: Connection Setup UI**
- `src/components/ConnectionSetup.vue` - Connection form with validation
- `src/components/StatusBar.vue` - Connection status display
- Updated `src/App.vue` - Routing between setup and main interface
- Bootstrap CSS integration
- All TypeScript compilation errors resolved

**Testing Infrastructure**
- Installed Playwright for automated testing
- Created `debug/test-connection.mjs` - Automated connection test script
- Verified UI renders correctly and handles errors properly
- Screenshot captured: `debug/connection-test.png`

### 🔧 Issues Resolved

**1. digest-fetch Browser Compatibility**
- **Problem**: `digest-fetch` tried to import Node.js-specific `node-fetch` package
- **Error**: `Could not resolve "node-fetch"` during Vite build
- **Solution**:
  - Created `src/utils/fetch-stub.ts` that uses browser's native fetch
  - Added Vite alias: `node-fetch` → `fetch-stub.ts`
  - Excluded `node-fetch` from optimizeDeps
- **Status**: ✅ Fixed - Dev server runs successfully

**2. TypeScript Strict Mode Errors**
- **Problem**: Multiple TS errors in parser.ts (undefined array access)
- **Solution**: Added null checks and proper type guards
- **Status**: ✅ Fixed - Type checking passes

### ⚠️ Current Issues

**Camera Connectivity (Testing Blocked)**
- **Problem**: Both test cameras offline/unreachable
  - `192.168.1.10` - No route to host (100% packet loss)
  - `192.168.1.18` - No route to host (100% packet loss)
- **Network Scan**: Only router (192.168.1.1) and Mac (192.168.1.84) found
- **Impact**: Cannot test actual camera communication
- **Status**: ⏸️ Waiting for cameras to come online
- **Workaround Options**:
  1. Power on cameras and verify network connectivity
  2. Implement mock mode for testing without hardware
  3. Continue building features with assumption code is correct

### 📋 TODO - Remaining Steps

**Step 4: System Information Display**
- Create `SystemInfo.vue` component
- Display device type, serial number, firmware version
- Test with real camera once available

**Step 5: Video Preview**
- Create `VideoPreview.vue` component
- Implement snapshot polling (request JPEG every 500-1000ms)
- Add refresh rate control
- Optional: MJPEG stream support

**Step 6: Settings Panels**
- `VideoSettings.vue` - Resolution, bitrate, FPS
- `NetworkSettings.vue` - IP, DHCP, DNS, WiFi scan
- `ImageSettings.vue` - Brightness, contrast, exposure
- `MotionSettings.vue` - Motion detection configuration
- `MaintenancePanel.vue` - Reboot, logs, firmware info

**Step 7: Main Application Layout**
- Tabbed or sidebar navigation
- Integrate all settings panels
- Mobile-responsive layout

**Step 8: Docker & Documentation**
- Create Dockerfile (multi-stage build)
- Create docker-compose.yaml
- Finalize README.md

**Step 9: Testing & Polish**
- Test with real cameras (once online)
- Handle API differences between camera models
- Add loading states and better error messages
- Cross-browser testing

### 🚀 Current Status

**Working:**
- ✅ Dev server running at http://localhost:5173
- ✅ Connection UI fully functional
- ✅ Error handling working correctly
- ✅ TypeScript compilation passing
- ✅ Playwright test infrastructure ready

**Blocked:**
- ❌ Camera testing (hardware offline)
- ⏸️ Further development waiting for decision:
  - Continue building features?
  - Add mock mode?
  - Wait for camera availability?

### 📝 Notes for Next Session

1. **Test Cameras First**: Before continuing development, verify at least one camera is online and accessible
2. **Mock Mode**: Consider implementing mock responses based on API documentation for development without hardware
3. **CORS Issues**: May need to handle CORS if cameras don't send proper headers (test when cameras available)
4. **Browser Compatibility**: digest-fetch works in modern browsers; test in Chrome, Firefox, Safari

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
