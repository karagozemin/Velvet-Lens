<p align="center">
  <img src="public/brand/velvet-lens.png" alt="Velvet Lens logo" width="250" />
</p>

# Velvet Lens

Velvet Lens is a premium, read-only DeFAI strategy lab built on top of Velvet Capital's token analysis API. It turns a token, contract address, or token thesis into a normalized analysis view and a deterministic strategy preview with risk notes, narrative context, momentum signals, and an allocation range tuned to the user's risk profile.

The app is intentionally an analyst cockpit, not a trading surface. It does not connect wallets, execute swaps, rebalance assets, request signatures, or submit transactions.

## Architecture

For the full technical breakdown, see [ARCHITECTURE.md](./ARCHITECTURE.md).

That document covers the request lifecycle, module boundaries, data contracts, normalization strategy, deterministic strategy engine, security model, and extension points.

## What It Does

- Accepts token symbols, contract addresses, or token thesis text.
- Calls Velvet's token analysis endpoint from a server-only Next.js route.
- Keeps the Velvet API key out of the browser.
- Normalizes common analysis fields from changing API response shapes.
- Builds a read-only strategy preview with deterministic rules.
- Renders a dark purple premium strategy terminal UI.
- Preserves the raw normalized JSON for inspection.

## What It Does Not Do

- No wallet connection.
- No trade execution.
- No swaps or transaction signing.
- No portfolio custody.
- No automated rebalancing.
- No financial advice.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Zod
- lucide-react

## Project Structure

```text
src/
  app/
    api/analyze/route.ts  Server route for validation, Velvet API calls, normalization, and strategy generation
    globals.css           Global theme, premium panel styles, and strategy reveal animations
    layout.tsx            Root metadata and app shell
    page.tsx              Main dashboard UI
  components/
    Field.tsx             Form field wrapper
    Metric.tsx            Token snapshot metric cell
  lib/
    velvet.ts             Server-only Velvet API adapter
    normalize.ts          Response normalization and fallback extraction
    strategy.ts           Deterministic strategy preview engine
  types/
    strategy.ts           Strategy preview types
    velvet.ts             Request and normalized analysis types
```

## Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
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

| Variable | Required | Description |
| --- | --- | --- |
| `VELVET_API_KEY` | Yes | Velvet API key. Read only by the server route. Never exposed to the browser. |
| `VELVET_TOKEN_ANALYSIS_URL` | No | Velvet token analysis endpoint. Defaults to `https://vu.velvetdao.xyz/agent-api/v1/token`. |

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
```

## API Flow

1. The browser submits the analysis form to `POST /api/analyze`.
2. The route validates the request with Zod.
3. `src/lib/velvet.ts` calls Velvet's token analysis API server-side.
4. `src/lib/normalize.ts` extracts a stable normalized analysis shape.
5. `src/lib/strategy.ts` builds a deterministic strategy preview.
6. The UI renders the strategy card and optional raw JSON inspection panel.

## Safety Model

Velvet Lens is research software. The strategy output is a preview for analysis, not financial advice. The current MVP is deliberately read-only and keeps execution paths out of scope.

Important safety choices:

- The frontend never calls Velvet directly.
- The API key is only read on the server.
- The strategy engine is deterministic and inspectable.
- Missing data reduces confidence and allocation ranges.
- Raw normalized output remains available for review.

## Current Limitations

- The app depends on Velvet's token analysis endpoint being available.
- Normalization is tolerant, but new response shapes may need additional aliases.
- Strategy logic is rule-based and conservative by design.
- There is no persisted strategy history yet.

## Future Scope

- Vault preview
- Rebalance preview
- Strategy history
- Wallet tracking in read-only mode
- Telegram bot
- MCP integration
- Deeper testing around normalization and strategy scoring
