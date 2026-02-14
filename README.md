# Retro IP Camera Web Admin

A modern web interface for managing older Amcrest and compatible IP cameras whose original web admin no longer works on modern browsers.

## Features

- 🌐 **Browser-based** - No plugins required, works in any modern browser
- 🔒 **Secure** - HTTP Digest Authentication support
- 📱 **Responsive** - Works on desktop, tablet, and mobile
- ⚡ **Fast** - Direct camera communication, no backend server needed

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 and enter your camera's connection details.

## Requirements

- Node.js 20+
- Camera and browser on the same network
- Amcrest/Dahua-compatible IP camera

## Test Cameras

For testing with your cameras:
- Camera 1: 192.168.1.10
- Camera 2: 192.168.1.18

Default credentials: admin / [your password]

## Development

```bash
npm run type-check  # Check TypeScript
npm run build       # Build for production
npm run preview     # Preview production build
```

## Documentation

See [CLAUDE.md](CLAUDE.md) for complete project documentation.

## License

MIT
