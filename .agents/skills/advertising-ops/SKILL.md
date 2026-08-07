---
name: advertising-ops
description: Ad intelligence + creative generation pipeline. Scrapes long-running winning ads from the Meta Ad Library (via Apify), templates the winners, then acts as your CMO to produce aligned ad-copy + image/video variations into a research report and per-variation creative folders. Use when the user says "advertising ops", "/advertising-ops", "find winning ads", "scrape competitor ads", "ad library", "spy on ads", "build ad creatives", or "ad campaign research".
type: standalone
version: 0.2.2
category: marketing
---

# Advertising Ops — CMO in a Box

## Pipeline Overview

1. **Scope** — Identify the business, target ICP, keywords, and offer outcome.
2. **Scrape** — Fetch long-running winning ads from Meta Ad Library via Apify (`brilliant_gum/facebook-ads-library-scraper`), filtered to active ads running 60+ days.
3. **Teardown** — Extract video transcript, hook structure, script, and Call-to-Action (CTA).
4. **Brief** — Run CMO-style creative brief to align offer, hook, and messaging.
5. **Generate** — Produce 5+ high-converting ad copy and visual asset variations into campaign creative folders.
