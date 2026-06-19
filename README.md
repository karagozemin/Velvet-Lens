# Velvet Lens

Velvet Lens is a read-only strategy copilot built on top of Velvet Capital's token analysis API. A user enters a token, contract address, or token thesis; the app calls Velvet server-side, normalizes the response, and produces a strategy preview with risk notes, narrative summary, momentum signals, and an allocation range based on risk profile.

This MVP does not execute trades. There are no swaps, wallet signatures, portfolio actions, or transaction flows.

## How It Works

1. The browser posts the analysis form to `/api/analyze`.
2. The Next.js API route validates the request with Zod.
3. `src/lib/velvet.ts` calls Velvet's token analysis endpoint server-side with `x-api-key`.
4. `src/lib/normalize.ts` safely extracts common token analysis fields from the API response.
5. `src/lib/strategy.ts` applies deterministic scoring to produce a read-only strategy preview.
6. The UI renders the strategy card and a collapsible normalized JSON response.

## Setup

```bash
npm install
cp .env.example .env.local
```

Add your Velvet API key:

```bash
VELVET_API_KEY=your_key_here
VELVET_TOKEN_ANALYSIS_URL=https://vu.velvetdao.xyz/agent-api/v1/token
```

Run locally:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

- `VELVET_API_KEY`: API key for Velvet. This is only read by the server route.
- `VELVET_TOKEN_ANALYSIS_URL`: Velvet token analysis endpoint. Defaults to `https://vu.velvetdao.xyz/agent/api/token-402`.

## API Flow

The frontend never calls Velvet directly and never receives the API key. `/api/analyze` handles validation, timeout handling, non-200 responses, normalization, and strategy generation.

Velvet's current key-gated token endpoint is `POST /agent-api/v1/token`. If Velvet requires a different request method or auth format later, update only `src/lib/velvet.ts`. The adapter is intentionally isolated and documented for that adjustment.

## Safety Note

Velvet Lens is research software. Strategy suggestions are previews, not financial advice. The MVP is read-only and does not connect to wallets, execute swaps, rebalance assets, or sign transactions.

## Future Scope

- Vault preview
- Rebalance preview
- Wallet tracking
- Strategy history
- Telegram bot
- MCP integration
