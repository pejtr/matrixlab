# Apify Ad Scraping Framework

How Advertising Ops pulls long-running winning ads from the Meta Ad Library.

## Purpose
Configure and run the Apify actor that scrapes the Meta Ad Library so the pipeline can isolate ads that have been running long enough, and engaging enough, to count as proven winners.

## Core Concepts

### The actor
`brilliant_gum/facebook-ads-library-scraper` — the Facebook Ads Library Scraper. Chosen because it computes each ad's run time and exposes a real date filter, which the other actors do not. README use case: "identify long-running ads and build swipe files of high-duration creatives."

Covers Facebook, Instagram, Messenger, Threads, and Audience Network ads.

### Connecting Apify
The user connects the Apify MCP themselves:
- The MCP is `@apify/actors-mcp-server` (https://github.com/apify/actors-mcp-server). Register it in `.mcp.json` as a stdio server: `npx -y @apify/actors-mcp-server`.
- API token: https://console.apify.com/settings/integrations (Personal API tokens), set as the `APIFY_TOKEN` env var on the server entry.
- Once connected, tools named `mcp__apify__*` are available

Prefer the MCP over a raw API call. Always `fetch-actor-details` before `call-actor` to confirm the input schema.

### The "running 2+ months" recipe
The date input filters on the ad's START date. To find proven winners, combine two filters:
- `endDate` = today minus the agreed run length (started on or before that date)
- `adActiveStatus` = "ACTIVE" (still live now)

Started long ago AND still active = has been running at least that long. Do NOT use `startDate` for this; that would exclude the old ads you want.

For a 2-month floor, `endDate` is roughly today minus 60 days. For 3 months, today minus 90.

### Input shape
```json
{
  "searchTerms": ["keyword or brand"],
  "countries": ["US"],
  "adActiveStatus": "ACTIVE",
  "endDate": "YYYY-MM-DD",
  "maxAds": 50,
  "resolveSnapshotUrls": true
}
```
- `resolveSnapshotUrls: true` resolves the real landing-page URL and CDN media per ad (slower, ~5s/ad) — worth it for a swipe file because you want the funnel, not just the creative.
- Pull a buffer above the requested count so media-type and engagement filtering still leaves enough.

### What the actor returns (and what it does not)
The actor returns structured records: copy, CTA, run time, engagement signals, timestamps, and **media URLs** — CDN links to the image or video creative. It does NOT return the binary image or video files. Set `resolveSnapshotUrls: true` so those real CDN image/video URLs (and the landing page URL) are resolved; without it you may only get the snapshot page link.

To actually see a creative you download it from its URL:
- **Image** — `curl -L "{image_url}" -o ad-{n}.jpg`, then read it as an image.
- **Video** — `curl -L "{video_url}" -o ad-{n}.mp4`, then extract frames with ffmpeg (see [video-ad-analysis](video-ad-analysis.md)).

### Ranking the winners
1. Filter to the requested media type (image or video).
2. Keep the requested number of ads with the most engagement.
3. Sort the final set by run duration least-to-longest (shortest-running winner first).

## Examples
- "Med spa, US, image ads, running 3+ months" → `searchTerms: ["med spa"]`, `endDate` = today-90, `adActiveStatus: ACTIVE`, filter to image, top 10 by engagement.

## Anti-Patterns
- Using `startDate` to find old ads (it excludes them).
- Dropping `adActiveStatus: ACTIVE` (a long-dead ad that ran 90 days is a loser, not a winner).
- Calling `call-actor` without `fetch-actor-details` first when unsure of the schema.
