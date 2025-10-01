# Quick Start Guide

## One-Command Setup

```bash
npm install
npm run dev
```

That's it! The app will start with:
- ✅ Backend server on `http://localhost:3001` (hot reloading enabled)
- ✅ Frontend app on `http://localhost:5173` (hot reloading enabled)
- ✅ Color-coded terminal output (blue for server, green for client)

Open `http://localhost:5173` in your browser to play!

## Hot Reloading

Both servers support hot reloading:

### Backend (Express + TypeScript)
- Edit any file in `server/`
- Server automatically restarts with `tsx watch`
- Changes reflected immediately

### Frontend (React + Vite)
- Edit any file in `src/`
- Browser updates instantly with Vite HMR
- No manual refresh needed

## Development Workflow

1. Start the app: `npm run dev`
2. Make changes to any file
3. See updates automatically
4. Stop with `Ctrl+C` (stops both servers)

## Separate Commands (Optional)

If you prefer separate terminals:

```bash
# Terminal 1 - Backend only
npm run dev:server

# Terminal 2 - Frontend only
npm run dev:client
```

## Useful Commands

```bash
npm run dev        # Start both servers
npm run dev:server # Backend only
npm run dev:client # Frontend only
npm run build      # Build for production
npm run lint       # Run linter
```

## Troubleshooting

### Port already in use
If you get a port error:
```bash
# Kill existing processes
pkill -f "tsx watch"
pkill -f "vite"

# Restart
npm run dev
```

### Module not found
```bash
npm install
```

### Changes not reflecting
1. Check terminal for errors
2. Hard refresh browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux)
3. Restart dev servers: `Ctrl+C` then `npm run dev`

