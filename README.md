Backup monday.com boards and view boards with a static page.

# Tech Stack
- Node JS v22.13.0
- Typescript

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

data store to a JSON format in `src/data/{board-id}.json`

assets store in `src/data/asset/{board-id}/{asset-id}.{file-extension}`

# Frontend
TODO