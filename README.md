# Sarjai Ticker Backend

This is a Cloudflare Worker backend for SEC ticker queries, built with [Hono](https://hono.dev/) and [Bun](https://bun.sh/).

Uses KV and caching for performance and to reduce repetitive network requests.

## Getting Started

Install dependencies with Bun:

```txt
bun install
bun run dev
```

```txt
bun run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
bun run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```
