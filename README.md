Backup monday.com boards and view boards with a static page.

# Tech Stack
- Node JS v22.13.0
- Typescript
- Nuxt v4.2.1
- Tailwind CSS

# Backup
Add `monday.com` API key to `.env`
```
MONDAY_API_TOKEN='token_here'
```

Running `pnpm install` then `pnpm seed`, the program will fetch the board data from `monday.com` which include
- groups
- posts (`items` in monday)
- comments (`updates` in monday)
- replies
- assets

data store to a JSON format in `public/board/{board-id}.json`

assets store in `public/asset/{board-id}/{asset-id}.{file-extension}`

# Frontend
This project uses **Nuxt 4** to build the frontend interface for browsing the backed-up Monday.com board data.

## Directory Structure
The main source code is located in the `src/` directory:
- `src/pages/`: Page routing
  - `boards/[id].vue`: Board detail page, reads and displays specific backup boards
- `src/components/`: Reusable components (e.g., `ItemDetail.vue`)
- `src/server/api/`: Server-side API, used to read JSON data from `public/`
- `src/app.vue`: Application entry point

### Start Development Server
```bash
pnpm dev
```
The service will start at `http://localhost:3000`.

### Start Production in Server
install pm2 by `pnpm add -g pm2`
```
pm2 start ecosystem.config.js
```
