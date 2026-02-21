# Retro IP Camera Web Admin

A modern, responsive web interface for managing older Amcrest and compatible IP cameras whose original web admin interfaces no longer work on modern browsers due to deprecated plugins (ActiveX, Flash, Java applets).

## Why This Exists

Older Amcrest IP cameras (and their Dahua-based counterparts) came with web interfaces that required browser plugins that are no longer supported by modern browsers. While the cameras themselves still work perfectly, the web admin interface is inaccessible. This project provides a clean, modern alternative that works in any browser without plugins.

## Features

- 🌐 **Pure Web App** - No plugins, no downloads, just open in your browser
- 🔒 **Secure Authentication** - HTTP Digest Authentication support
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- 🌓 **Dark Mode** - Toggle between light and dark themes
- 🎥 **Live Preview** - Real-time snapshot polling from camera
- ⚙️ **Video Overlay Management**
  - Camera name overlay with custom text
  - Timestamp overlay with position control
  - Logo/branding overlay support
  - Background opacity controls for text overlays
  - Six position presets (corners and centers)
- 📊 **System Information** - View camera model, firmware, serial number
- ⚡ **Direct Communication** - Browser connects directly to camera (no backend server)
- 🐳 **Docker Support** - Easy deployment with Docker Compose

## Quick Start

### Method 1: Local Development

```bash
# Install dependencies
npm install

# Start development (runs Vite + proxy server)
npm run dev
```

Open http://localhost:5173 in your browser, enter your camera's IP address and credentials, and start managing your camera.

**Note:** `npm run dev` automatically starts both the Vite dev server (with hot reload) and the proxy server in one command.

### Method 2: Docker Compose (Recommended for Production)

```bash
# Build and start the container
docker compose up -d

# Access at http://localhost:8080
```

The app will prompt you to configure your camera connection on first launch.

## Requirements

### System Requirements
- **Node.js 20+** (for local development)
- **Docker** (optional, for containerized deployment)
- **Modern browser** (Chrome, Firefox, Safari, Edge)

### Network Requirements
- Camera and browser must be on the same network (or camera accessible via network route)
- Camera's HTTP API must be accessible (default port 80)

### Compatible Cameras
- Amcrest IP cameras (older models with deprecated web interfaces)
- Dahua-based IP cameras
- Any camera implementing the Amcrest/Dahua HTTP CGI API

## Architecture

This application is a **single Node.js server** that provides both the web interface and camera proxy:

- **Frontend**: Vue.js SPA served as static files
- **Proxy Routes**: `/proxy/*` endpoints forward requests to cameras with authentication
- **Single Port**: Everything runs on port 80 (configurable via `PORT` env var)

All camera API requests are routed through the integrated proxy to bypass browser CORS restrictions that older cameras don't support. This eliminates the need for separate server processes.

## Deployment Options

### Development Mode
```bash
# Build and run the server locally
npm run build
npm run dev

# For active development (auto-rebuild on changes):
# Terminal 1: Watch and rebuild Vue app
npm run dev:watch

# Terminal 2: Run the server
npm run dev
```

### Production Build
```bash
# Build static files
npm run build

# Preview production build locally
npm run preview
```

### Docker Production
```bash
# Default: http://localhost:8080
docker compose up -d

# Custom port (e.g., 3000)
PORT=3000 docker compose up -d

# Stop container
docker compose down
```

The Docker image uses a multi-stage build:
1. **Builder stage**: Node 20 Alpine compiles the Vue/TypeScript app
2. **Production stage**: Caddy 2 Alpine serves the static files with gzip compression

## Configuration

### Runtime Configuration (No Build-Time Secrets!)

As of v1.0.0, all configuration happens at runtime through the web interface:

1. Open the app in your browser
2. Enter your camera details:
   - **Camera Host**: Your camera's IP address (e.g., `192.168.1.10`)
   - **Port**: Camera HTTP port (default: `80`)
   - **Username**: Camera admin username (default: `admin`)
   - **Password**: Your camera password
   - **Debug Logging**: Enable to see detailed API calls in browser console
3. Click "Connect"

**Note:** The CORS proxy server runs automatically inside the container on port 3001. All camera communication is routed through the proxy to handle CORS restrictions and authentication.

Settings are encrypted with AES-256-GCM and saved in your browser's localStorage.

### Changing Settings

Click the "Logout" button in the top-right corner to disconnect and return to the connection setup screen.

## Project Structure

```
/
├── src/
│   ├── components/          # Vue components
│   │   ├── ConnectionSetup.vue    # Initial connection configuration
│   │   ├── StatusBar.vue          # App header with connection status
│   │   ├── CameraInfoPage.vue     # System information display
│   │   ├── OverlaysPage.vue       # Video overlays management page
│   │   ├── VideoPreview.vue       # Live camera snapshot display
│   │   ├── SystemInfo.vue         # Camera details component
│   │   └── VideoOverlaySettings.vue # Overlay control panel
│   ├── composables/         # Reusable composition functions
│   │   ├── useCamera.ts          # Camera API client (singleton)
│   │   └── useDarkMode.ts        # Dark mode state management
│   ├── types/              # TypeScript type definitions
│   │   └── camera.ts            # Camera API types
│   ├── utils/              # Utility functions
│   │   ├── logger.ts           # Centralized logging
│   │   ├── apiClient.ts        # HTTP client with digest auth
│   │   └── parser.ts           # Response parser (key=value format)
│   ├── App.vue             # Root component with page routing
│   ├── main.ts             # Application entry point
│   └── style.css           # Global styles and dark mode
├── debug/                  # Debug scripts and test files (gitignored)
├── public/                 # Static assets
├── resources/              # API documentation (PDF)
├── proxy-server.mjs        # CORS proxy server
├── Dockerfile              # Multi-stage Docker build
├── compose.yaml            # Production Docker Compose
├── compose.dev.yaml        # Development Docker Compose
└── CLAUDE.md               # Comprehensive developer documentation
```

## Development

### Available Scripts

```bash
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # Type-check and build for production
npm run preview      # Preview production build
npm run type-check   # Run TypeScript type checking
```

### Development Workflow

1. Make changes to Vue components in `src/`
2. Vite hot-reloads changes automatically
3. Use browser DevTools with debug logging enabled
4. Test with real camera hardware when possible

### Code Style

- **Vue 3 Composition API** with `<script setup>` syntax
- **TypeScript** with strict mode enabled
- **Bootstrap 5** for UI components and responsive layout
- **Bootstrap Icons** and **Font Awesome** for icons
- Centralized logging via `utils/logger.ts`

See [CLAUDE.md](CLAUDE.md) for complete development conventions and architecture decisions.

## Browser Compatibility

Tested and working on:
- ✅ Chrome/Edge (Chromium) 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Android)

## Security Considerations

### Password Storage
- Connection settings (including passwords) are stored in browser localStorage
- localStorage is NOT encrypted
- Only use on trusted devices
- Consider using a dedicated camera management network

### HTTP vs HTTPS
- Most older cameras only support HTTP (not HTTPS)
- HTTP Digest Authentication provides some protection
- Recommend placing cameras on isolated network/VLAN

### Network Isolation
- Keep cameras on a separate management network if possible
- Use firewall rules to restrict camera internet access
- Only expose management interface on trusted networks

## Troubleshooting

### Connection Failures

**Issue**: "Failed to connect to camera"
- ✅ Verify camera is powered on and connected to network
- ✅ Check camera IP address is correct
- ✅ Ensure proxy server is running (`node proxy-server.mjs`)
- ✅ Verify username and password are correct
- ✅ Check browser console for detailed error messages

**Issue**: "CORS errors" in browser console
- ✅ Make sure proxy server is running on port 3001
- ✅ Use `http://localhost:3001` as the proxy URL in connection setup
- ✅ Check that camera's HTTP API is enabled

### macOS Network Permissions

**Issue**: Connection works sometimes but not always
- ✅ Check System Settings → Privacy & Security → Local Network
- ✅ Ensure your browser has Local Network access enabled
- ✅ This is especially important for Safari and Chrome on macOS

### Video Preview Issues

**Issue**: Video preview not updating
- ✅ Check camera snapshot endpoint is working: `http://[camera-ip]/cgi-bin/snapshot.cgi`
- ✅ Verify authentication credentials
- ✅ Check browser console for 401/403 errors

### Overlay Changes Not Saving

**Issue**: Overlay settings don't persist
- ✅ Wait 1-2 seconds after changing settings
- ✅ Check browser console for API errors
- ✅ Verify camera firmware supports VideoWidget overlay API
- ✅ Some settings may require camera reboot to take effect

## Known Limitations

- **Single camera management**: Currently designed for one camera at a time
- **Snapshot polling**: Video preview uses periodic snapshots (not live streaming)
- **Limited feature set**: Focuses on essential management features, not a complete replacement
- **No PTZ control**: Pan/tilt/zoom not yet implemented
- **No recording management**: Cannot view or download recorded footage

## Future Enhancements

Potential features for future versions:

- [ ] Multi-camera support (manage multiple cameras simultaneously)
- [ ] PTZ controls (pan, tilt, zoom) for supported cameras
- [ ] Motion detection configuration
- [ ] Network settings management
- [ ] MJPEG live streaming (as alternative to snapshot polling)
- [ ] Recording playback and download
- [ ] Camera firmware upgrade support
- [ ] User management (add/remove camera users)
- [ ] Export/import camera settings
- [ ] Network discovery (automatic camera detection)

## Contributing

Contributions welcome! Please follow existing code style and conventions outlined in [CLAUDE.md](CLAUDE.md).

## License

MIT License - see [LICENSE](LICENSE) for details

## Acknowledgments

- Built with [Vue 3](https://vuejs.org/), [Vite](https://vitejs.dev/), and [Bootstrap 5](https://getbootstrap.com/)
- Designed for Amcrest/Dahua-based IP cameras
- Inspired by the need to keep older camera hardware useful

---

**Note**: This is an independent community project and is not affiliated with or endorsed by Amcrest Technologies or Dahua Technology.
