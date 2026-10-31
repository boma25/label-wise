# Architecture

## Request flow

1. User captures or uploads a label image in the browser.
2. Client resizes to ~1024px JPEG (`lib/image.ts`) to keep payloads small.
3. Client `POST`s a data URL to `/api/explain`.
4. Route handler calls Gemini API model `gemma-4-26b-a4b-it` with the shared prompt from `lib/prompt.ts`.
5. Response is parsed into fixed sections + optional `nafdacRegNumber`.
6. If an NRN is present, client `POST`s `/api/nafdac`, which queries Greenbook:

   `GET https://greenbook.nafdac.gov.ng/?search[value]=<NRN>` with `X-Requested-With: XMLHttpRequest`.

7. UI renders explanation + registry status (Active / Inactive / Not found / Error).

## Trust boundaries

- `GEMINI_API_KEY` stays on the server.
- Images are not persisted by LabelWise (request body only).
- Greenbook lookup is informational registration status, not MAS authenticity.

## Deferred

- On-device path via WebGPU + MediaPipe/LiteRT (dynamic import, `ssr: false`).
- Model file on object storage + Cache Storage / OPFS.
- DigitalOcean hosting and Gradient Inference.
