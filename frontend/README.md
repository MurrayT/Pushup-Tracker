# Pushup Tracker — Frontend

React + Vite SPA with two distinct experiences:
- **Mobile app** — bottom-nav layout for phones
- **TV dashboard** (`/tv`) — full-screen dark display for big screens
## Stack

- React 18 + React Router v6
- Recharts for all charts
- date-fns for date arithmetic
- Vite for dev server + bundling
## Getting started

```bash
# In the frontend/ directory:
npm install
npm run dev        # starts on http://localhost:5173
                   # API calls are proxied to http://localhost:8080
```

Make sure the Go API is running first (`go run .` from the project root).

## Pages

| Route          | Description                                      |
|----------------|--------------------------------------------------|
| `/login`       | Login form                                       |
| `/register`    | Registration form                                |
| `/`            | Personal dashboard — 30-day area chart + stats   |
| `/log`         | Log pushups — preset buttons + custom input      |
| `/leaderboard` | Ranked list of all users with progress bars      |
| `/tv`          | TV dashboard — large line/bar chart + leaderboard sidebar, auto-refreshes every 60s |

## TV Dashboard

Open `/tv` in a browser pointed at a TV or large display. It:
- Plots all users on a shared chart (line or stacked bar)
- Shows a live leaderboard sidebar with per-user colour coding
- Displays a real-time clock
- Refreshes automatically every 60 seconds
- Works without being logged in (read-only)
## Production build

```bash
npm run build     # outputs to dist/
```

Serve the `dist/` folder from the Go binary by adding a static file handler,
or deploy separately to any static host (Vercel, Netlify, Cloudflare Pages).

### Serving from Go

Add this to `main.go` to serve the built frontend from the same binary:

```go
import "net/http"
 
// After your API routes:
mux.Handle("/", http.FileServer(http.Dir("./frontend/dist")))
```