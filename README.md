# H3 Master

Unofficial companion app for **Heroes of Might & Magic III: The Board Game**.

Live: <https://h3master.app>

A bilingual (EN/RU), offline-ready Progressive Web App that gives players a searchable rulebook, scenario browser, unit / hero / spell / artifact reference, town tracker, AI Game Master (RAG over the published rules), and a session-setup wizard for any of the five game modes (Clash, Campaign, Co-op, Alliance, Solo).

> H3 Master is a **fan-made, unofficial** companion. It is not affiliated with, endorsed by, or sponsored by Archon Studio or Ubisoft. All game names, scenario titles, and character names belong to their respective owners. The app exists to make the published rules easier to navigate at the table; no game content is sold, and the project is fully free and ad-free.

---

## Features

- Searchable rulebook covering all 271 rules of the base game and Rewrite 2.0-rc4, with cross-references.
- 61 scenarios from 10 mission books with full setup details, map variants, story, victory and lose conditions, and per-round timed events.
- 241 unit cards, 64 heroes, 91 artifacts, 59 spells, 32 abilities, 5 war machines, 71 map elements - all browsable and filterable by faction / tier / type.
- Town tracker with all 10 factions, their buildings, dwellings, and starting layouts.
- AI Game Master (OpenAI gpt-4o + RAG over the rulebook + extended Rewrite chunks) - answers any rule question with cited references. Bilingual EN/RU.
- Game Setup wizard - pick scenario + players + factions, generate a ready-to-share session URL valid for 24 hours.
- Works offline (PWA) - install on phone / tablet for table-side reference.
- No accounts, no ads, no paywall.

---

## Tech stack

| Layer | Tool |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Supabase (Postgres + Auth + Storage + Edge Functions + Vector / RAG) |
| AI | OpenAI gpt-4o (chat), text-embedding-3-small (vectors), Whisper (voice input) |
| Hosting | Hetzner CX22 Nürnberg (Ubuntu + Nginx) behind Cloudflare proxy |
| CI / Deploy | Lovable.dev (frontend builder) -> GitHub (source) -> GitHub Actions -> Hetzner |
| Analytics | Google Analytics 4 (Consent Mode v2, opt-in) |
| Donations | Ko-fi (`ko-fi.com/h3master`) |

---

## Quick start (local development)

Requirements: Node.js 20+, npm.

```bash
git clone https://github.com/smirnov-yury/h3-companion-chat
cd h3-companion-chat
npm install
cp .env.example .env   # fill in Supabase URL + anon key
npm run dev
```

The app is served at `http://localhost:5173`. Most pages work without auth; the admin panel under `/dragonutopia` requires a Supabase admin user.

### Useful scripts

```bash
npm run dev        # Vite dev server
npm run build      # production build to dist/
npm run preview    # serve the production build locally
npm run test       # Vitest suite (29 tests at last count)
npm run lint       # eslint
```

---

## Project structure

```
src/
  components/        # React UI components (tabs, cards, dialogs)
  pages/             # top-level route components
  pwa/               # service worker registration + force-refresh
  context/           # Language, Glyphs, Rules, RuleExtModal, AdminAuth providers
  hooks/             # custom hooks (entity link handling, etc.)
  config/            # section registry (URL routing config)
  integrations/
    supabase/        # generated types + client wrapper
  lib/               # analytics, storage helpers, utilities
  seo/               # breadcrumb + meta builders
  utils/             # rendering helpers (glyphs, formatting)
infra/
  cf-worker/         # Cloudflare Worker for per-route canonical / meta rewrite (SEO)
supabase/
  migrations/        # SQL migrations (applied via Supabase MCP / CLI)
  functions/         # edge functions (ai-chat, transcribe, embed-query, etc.)
```

---

## Roadmap

The project is feature-complete for the published Heroes 3 Board Game content as of May 2026. Active work focuses on SEO, AI Master polish, and operational stability rather than new modules. See the issues tab for current backlog.

---

## Support the project

If H3 Master saves you table-side time, you can drop a tip at <https://ko-fi.com/h3master> - covers Hetzner hosting and OpenAI usage. No subscription, no rewards, fully voluntary. Donation page in-app: <https://h3master.app/donate>.

---

## Credits

- Designed and run by **Jurijs Smirnovs** (Riga, Latvia).
- Rule content sourced from the official Heroes 3 Board Game rulebooks and the community **Heroes 3 Rules Rewrite 2.0-rc4** (used with permission for fair-use navigation).
- Built using Lovable.dev, Supabase, OpenAI, and the open-source React ecosystem.

---

## Legal

- **Trademarks:** "Heroes of Might & Magic", "HoMM", and "Heroes III" are trademarks of Ubisoft Entertainment. "Archon Studio" is the publisher of the board game. H3 Master claims no rights to these marks.
- **Disclaimer:** This is an unofficial fan project. The author is not responsible for any rules discrepancy between this companion and the official rulebook; in case of conflict, the official rulebook wins.
- **License:** the source code in this repository is shared for transparency and contribution; commercial reuse of the code requires written permission. Game content (scenario text, card text, rule wording) belongs to its publishers and is reproduced here for navigation purposes only.

---

## Links

- Live app: <https://h3master.app>
- Privacy policy: <https://h3master.app/privacy>
- Terms of service: <https://h3master.app/terms>
- Support: <https://h3master.app/donate>
- Ko-fi: <https://ko-fi.com/h3master>
- Contact: privacy [at] h3master.app
