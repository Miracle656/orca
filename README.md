# Orca — Launchpad and Marketplace App for Sui

Orca is a sophisticated launchpad and marketplace application designed for the Sui blockchain, focused on providing a comprehensive experience for digital assets like NFTs and tokens. The platform is built with a creator-first approach, offering dedicated tooling for launching collections, minting assets, setting royalties, and managing tokens, all within a distinct "neobrutalist" UI style. It emphasizes modern development practices and features integration with decentralized storage, positioning itself as a primary gateway for creating and trading digital assets on the Sui network.


`
Table of contents
`
- Overview
- Key technologies
- High-level architecture and numbered flow (mapped to Orca's architectural image)
- Repository / directory layout
- Environment variables & configuration
- Local development
- Build, lint and CI
- Deployment (Vercel / static hosting)
- Integrations: Sui, Walrus (storage), Wallet
- Minting flow & off-chain indexer
- Security & operational best-practices
- Troubleshooting & FAQ
- Contribution guidelines
- Glossary and references

---

Overview
--------

`orca` is the browser-facing React single-page application (SPA) that:
- Lets an end user upload assets (images, metadata) via a browser UI.
- Interacts with a Walrus storage gateway (IPFS/CID management) to store asset data.
- Uses the Sui SDK and dapp-kit to craft transactions which are signed by the user's wallet.
- Submits mint transactions to a Sui RPC node and optionally emits events to an off-chain indexer and analytics systems.
- Is built with Vite for fast dev feedback and optimized production builds.

This frontend is deliberate about being client-side-only for UI and user-driven signing. Secrets and custodial capabilities (private keys, backend signing) are intentionally offloaded to backend services if needed — see Security section.

Key technologies
----------------
- React (TypeScript)
- Vite
- Tailwind CSS (and shadcn UI primitives where applicable)
- GSAP for animations
- Sui SDK + @mysten/dapp-kit for blockchain integrations
- Walrus storage gateway (IPFS/CID) — configurable via environment variables
- Hosting / CDN: Vercel (recommended)
- Linting: ESLint and TypeScript

High-level architecture and numbered flow
------------------------------------------
The diagram  shows the major components; here is the textual version, with the same numbered sequence:

<img width="1024" height="1024" alt="Architecture" src="https://github.com/user-attachments/assets/308c8be8-5054-4c2d-8d50-5e7e3f01ec46" />

1. User uploads an asset from the Browser to Walrus Storage (gateway). The Walrus API returns a CID/URD and stores the raw bytes.
2. The deployed frontend (static artifact) calls a blockchain integration module to prepare a mint transaction (deploy artifact / mint tx).
3. The transaction is submitted to a Sui RPC node (via the user's wallet signing flow).
4. The Wallet prompts the user to sign the transaction; once signed the wallet sends it to the Sui RPC node.
5. The Sui RPC node confirms, and the transaction metadata includes references to the stored asset (CID/URD).
6. The off-chain indexer (optional) listens or polls Sui RPC for new events and indexes metadata for performant queries and analytics.
7. Analytics and telemetry (optional) are collected server-side only (do not leak private keys).
8. Vercel serves the built SPA (vite build output) and can trigger serverless functions (if present) for backend operations like indexing or webhook handling.
9. Security note (diagram): Never store keys in the client; keep secrets on the backend.

Directory layout (recommended / typical)
---------------------------------------
Note: adjust if your repo differs. Confirm actual layout in this repo before making automation that depends on filenames.

- src/
  - main.tsx            - React application entry
  - index.css           - global styles (Tailwind)
  - assets/             - static images and SVGs
  - components/         - UI primitives (shadcn/Tailwind components)
  - lib/
    - blockchain/       - Sui integration (mysten/dapp-kit wrappers)
    - walrus/           - storage gateway client helpers
    - hooks/            - custom React hooks (useWallet, useUpload)
  - pages/              - top-level pages (Upload, Mint status, Gallery)
  - utils/              - utilities, validators, types
- public/               - index.html and static hosting assets
- vite.config.ts
- package.json
- tsconfig.json
- .eslintrc / .prettierrc
- vercel.json (optional)
- README.md (this file)
- diagram: Architecture

Environment variables
---------------------
The frontend relies on public-facing configuration values. These are typically prefixed with VITE_ (Vite will inline them into the client build). Minimal variables used across the app:

- VITE_SUI_RPC_URL
  - A Sui RPC endpoint (example: https://fullnode.devnet.sui.io). If running locally use a local devnet or testnet endpoint.
- VITE_WALRUS_URL
  - Base URL of the Walrus storage gateway.
- VITE_WALRUS_API_KEY
  - API key for Walrus if the gateway requires authentication.
- VITE_OFFCHAIN_INDEXER_URL (optional)
  - URL to the optional off-chain indexer service.
- VITE_ANALYTICS_URL (optional)
  - Endpoint to securely forward anonymized usage events server-side.

Example `.env.local` (do not commit, never store secrets in repo):
```env
VITE_SUI_RPC_URL=https://fullnode.testnet.sui.io
VITE_WALRUS_URL=https://walrus.example.com/gateway
VITE_WALRUS_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_OFFCHAIN_INDEXER_URL=https://indexer.example.com
VITE_ANALYTICS_URL=https://analytics.example.com/ingest
```

Local development
-----------------
Prerequisites:
- Node 18+ (or the version pinned in .nvmrc)
- Yarn / npm / pnpm (use the project-preferred tool in package.json)
- Optionally: a Sui testnet or local devnet for development testing

Common commands:
- Install
  - npm install
- Development server (hot reload)
  - npm run dev
  - The app will be served at http://localhost:5173 by default (Vite).
- Run TypeScript checks
  - npm run typecheck
- Lint (ESLint)
  - npm run lint
- Build production
  - npm run build
- Preview production build locally
  - npm run preview

If you need to run a local Sui node for isolated integration testing:
- Follow Sui's official docs to run a local node or faucet.
- Update VITE_SUI_RPC_URL to point at your local node.

Build, lint and CI
------------------
- The intended CI pipeline:
  - Install dependencies (use lockfile)
  - TypeScript check
  - ESLint
  - Build (vite build) – fail on errors
  - Upload artifacts for deployment (Vercel or other)
- Recommended GitHub Actions steps:
  - actions/checkout
  - Setup Node
  - Cache node_modules / pnpm-store
  - npm ci
  - npm run lint
  - npm run build
  - Optionally run tests and snapshot checks

Sample package.json scripts (verify against repo):
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview --port 5173",
    "lint": "eslint \"src/**/*.{ts,tsx}\" --max-warnings=0",
    "typecheck": "tsc --noEmit"
  }
}
```

Deployment (Vercel and CDN)
---------------------------
- Vercel is the recommended host for static SPA. Use the `vite build` output (dist/) as the deployment target.
- If you have vercel.json it can:
  - configure rewrites/redirects
  - add serverless functions for off-chain indexing webhooks
- Set Vercel environment variables to mirror those in your `.env.local`. For secret values (Walrus API keys), use Vercel's Secret/Environment variables feature.
- For custom domain and CDN caching:
  - Configure cache-control headers for content that is immutable.
  - Invalidate CDN caches on deploy if your assets are mutable.

Integrations: Sui, Walrus, Wallet UX
-----------------------------------
- Sui integration:
  - Use @mysten/dapp-kit and Sui SDK to build transaction templates.
  - Do not sign or store private key material on the client. Use the user’s wallet to sign transactions.
  - Make RPC calls via the configured VITE_SUI_RPC_URL.
- Walrus (Storage):
  - Upload assets to the Walrus gateway. The gateway should return a stable CID/URD used by the mint transaction.
  - Validate and verify returned CID on the client before submitting transactions that reference it.
  - If the gateway provides server-side callbacks (webhooks), the off-chain indexer can be notified as an additional signal.
- Wallet UX:
  - The usual flow is:
    1. User selects files and fills metadata in the UI.
    2. Frontend uploads asset to Walrus and receives CID.
    3. Frontend prepares a mint transaction referencing CID (but does NOT sign it).
    4. Wallet UI (e.g., Sui wallet) prompts the user to sign and submit the transaction.
    5. On success, show transaction ID/hash to the user and poll Sui RPC for finality or use event streams to get confirmation.

Minting flow walkthrough (detailed, mapping to Orca's architectural image)
----------------------------------------------------
1. Upload asset: Browser -> Walrus storage. Walrus returns CID/URD.
2. Prepare transaction: Frontend composes a mint transaction that references the CID from Walrus. This may include metadata like name, description, creator address, royalties.
3. Wallet signs & submits: User's wallet receives the prebuilt transaction, shows them a confirmation modal, and upon acceptance, signs and sends to the Sui RPC node.
4. Sui RPC node processes tx and returns a transaction digest and effects. The transaction will reference the on-chain object that contains the asset metadata.
5. Off-chain indexer (optional) observes the chain and indexes the newly minted asset, recording mapping CID <-> on-chain id for the web UI's gallery.
6. Analytics systems can record high-level events (upload, mint success) via secure server endpoints (never client-side with secrets).
7. The UI shows progress and finality to the end-user (tx hash, link to explorer, minted object ID).

Security & operational best practices
------------------------------------
- NEVER store private keys or secrets in the client bundle.
- Treat VITE_* variables as public (they are bundled into the client). Do not put any secret values directly in client-side code unless they are intentionally public.
- Use a backend service for any privileged operations (e.g., signing server-side, webhooks requiring API keys, analytics ingestion that uses a key).
- Validate file type and size on client-side and server-side before upload. Use content-type checks and antivirus scanning if applicable.
- Rate-limit uploads and protect Walrus API with server-side proxies or signed upload URLs if the gateway supports them.
- Sanitize metadata prior to using it in any HTML or markdown rendering.
- GDPR/privacy: Do not send Personally Identifiable Information (PII) to third-party analytics without user consent.

Troubleshooting & FAQ
---------------------
Q: Upload fails with 401/403 from Walrus
- Check VITE_WALRUS_API_KEY and Walrus gateway permissions. Review CORS settings on the gateway.

Q: Wallet won't prompt or transaction fails on submission
- Confirm the wallet is connected and the origin is allowed.
- Inspect the RPC endpoint (VITE_SUI_RPC_URL) for health and CORS.
- Verify transaction building code isn’t including client-only secrets.

Q: CID returned by Walrus doesn't match file
- Re-fetch the asset via the gateway and verify hash locally. Ensure binary is not transformed by the gateway (Content-Encoding, base64 transforms).

Q: App works locally but fails in production build
- Confirm that environment variables are set in the production host and that there are no runtime assumptions about NODE_ENV.
- Check Vercel build logs for missing env values and ensure correct secrets are set.

Developer notes & recommended refactors
--------------------------------------
- Isolate blockchain logic under `src/lib/blockchain` and Walrus under `src/lib/walrus` so they can be tested and mocked independently.
- Implement an abstraction layer for the wallet provider (e.g., a `useWallet` hook) so other wallets can be supported with minimal changes.
- Add E2E tests (Cypress/Playwright) for critical happy-path flows: upload -> mint -> confirmation.
- Consider implementing a server-side signed upload URL flow for Walrus to avoid embedding API keys in the frontend or exposing privileged upload endpoints.

Contribution guidelines
-----------------------
- All code changes should follow the repository's linting and formatting rules (ESLint / Prettier).
- Create descriptive PRs with intent and summary of changes, reference related issues when applicable.
- Include unit tests for new logic and update integration tests for new user flows.
- Run `npm run lint` and `npm run typecheck` before submitting PR.

Glossary & references
---------------------
- Walrus: A gateway/service that stores assets (likely IPFS-like) and returns stable CIDs/URD references.
- CID / URD: Content Identifiers for content-addressable storage.
- Sui RPC Node: JSON-RPC endpoint for submitting transactions and querying chain state.
- @mysten/dapp-kit: SDK for Sui to help build and interact with transactions and wallets.

References:
- Sui documentation: https://docs.sui.io
- Mysten dapp-kit docs: (check package README in the repo)
- Vite docs: https://vitejs.dev
- Tailwind CSS: https://tailwindcss.com
- GSAP: https://greensock.com/gsap/

Image reference
---------------
The included architecture sketch is referenced in this README as Orca's architecture for the numbered flow and is a canonical source for the UI ↔ storage ↔ chain interactions.

---
