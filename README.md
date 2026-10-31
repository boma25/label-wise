# LabelWise

Open-source Next.js app that explains medicine package labels in plain language and automatically checks a **NAFDAC registration number** against the public Greenbook when one is readable.

> **Not medical advice.** Confirm with a pharmacist.  
> LabelWise does **not** decide if a pack is fake or original. A Greenbook hit means the number appears on the register; MAS scratch-SMS is still required for pack-level authenticity when available.

## Problem

Medicine packs are dense and hard to read under pressure. People need a careful plain-language summary — and a path to official NAFDAC checks — without uploading guesswork about counterfeits.

## What works today (MVP)

1. Take or upload a photo of a medicine box.
2. Client resizes to ~1024px JPEG.
3. Choose cloud **provider** (Gemma 4 via Gemini, or OpenAI). Availability comes from server env keys; default is Gemma when both are set.
4. `POST /api/explain` dispatches to the selected provider (keys server-side only).
5. Structured sections: What it is, What it's for, How it's usually taken, Warnings, Ask a pharmacist if…
6. If an NRN is extracted, `POST /api/nafdac` looks it up on [Greenbook](https://greenbook.nafdac.gov.ng/).
7. UI shows path badge **Cloud · Gemma/OpenAI** and a privacy note for cloud uploads.

## Architecture

```
Next.js (App Router)
├─ Client: camera/upload → resize → cloud explain → optional NAFDAC lookup
├─ GET  /api/providers → which keys are configured + default
├─ POST /api/explain → gemma (Gemini) or openai providers
├─ POST /api/nafdac  → NAFDAC Greenbook public JSON search
├─ Shared prompt: lib/prompt.ts
└─ PWA manifest (app shell offline / on-device Gemma: deferred)
```

See [docs/architecture.md](docs/architecture.md).

## Setup

```bash
cp .env.example .env.local
# set GEMINI_API_KEY=...
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

| Variable | Where | Notes |
| --- | --- | --- |
| `GEMINI_API_KEY` | server only | Enables Gemma 4 provider |
| `OPENAI_API_KEY` | server only | Enables OpenAI (`gpt-4o-mini`) provider |

At least one key is required. If both are set, the UI defaults to **Gemma**.

## Safety

- Unclear photos → ask for a better shot; no guessing.
- No genuine/fake model verdict.
- Registry miss ≠ counterfeit; registry hit ≠ proven genuine pack.
- Point users to Greenbook, NAPAMS verify, and NAFDAC MAS.

## Deferred (next)

- On-device Gemma (WebGPU) + model caching
- Service worker app-shell offline
- DigitalOcean App Platform deploy + Gradient AI path

## License

MIT — see [LICENSE](LICENSE). Gemma model weights and Google API use remain under their respective terms.

## Contributing

See [docs/contributing.md](docs/contributing.md) and open issues tagged `good first issue`.
