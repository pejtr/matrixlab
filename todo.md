# Project TODO

## Replicate Webhook Implementation - Completed
- [x] Vytvořit webhook endpoint /api/replicate-webhook
- [x] Přidat predictionId do database schema
- [x] Implementovat webhook signature validation pro bezpečnost
- [x] Aktualizovat job status v databázi při webhook notifikaci
- [x] Stáhnout a uložit result media z webhook payload
- [x] Přidat webhook URL do replicateService.ts při vytváření prediction
- [ ] Nastavit REPLICATE_WEBHOOK_SECRET (whsec_V2TquxuvamjIWE8QzHtZK4aWm4vz4pxq) v Settings
- [ ] Nastavit WEBHOOK_URL (https://faceswap.manus.space/api/replicate-webhook) v Settings
- [ ] Otestovat webhook s reálným Replicate API voláním

## Upscale Feature - Completed
- [x] Přidat Upscale tlačítko vedle Download na výsledcích
- [x] Vytvořit upscaleService.ts pro Replicate upscale modely
- [x] Implementovat image upscale pomocí Real-ESRGAN (4x zvětšení)
- [x] Přidat UI pro upscale progress a výsledky (dialog s before/after)
- [x] tRPC API procedure pro upscale
- [ ] Implementovat video upscale pomocí vhodného modelu
- [ ] Otestovat upscale na reálných obrázcích

## Text-to-Video Models Integration - User Requested
- [ ] Integrovat Wan model pro text-to-video generování
- [ ] Integrovat Flux model pro text-to-video generování
- [ ] Vytvořit novou sekci "Text to Video" s oběma modely
- [ ] Přidat UI pro text prompt input a model selection
- [ ] Přidat preview a download pro vygenerovaná videa
- [ ] Otestovat oba modely s reálnými prompty

## API Keys Setup
- [ ] Přidat Vercel Integration API key (r8_0AII45zb3ibrKU4UojdwbVc8ZOwd1Tq2LKBb9) do Settings

## Previous Features (All Completed)
See git history for complete list of implemented features.

## Wan2.2-Animate Integration - Completed
- [x] Integrovat Wan2.2-Animate-14B model (wan-video/wan-2.2-animate-animation)
- [x] Vytvořit wanAnimateService.ts s Animation a Replacement módy
- [x] Database schema - wanAnimateJobs tabulka
- [x] tRPC API procedures (createJob, getJobs, getJobById, deleteJob)
- [x] Vytvořit Hailuo-style UI s tmavým layoutem
- [x] Levý panel - mode selection, image/video upload
- [x] Pravý panel - grid galerie videí
- [x] Processing animace POUZE v miniaturách (ne v hlavním preview)
- [ ] Implementovat worker pro zpracování Wan Animate jobů
- [ ] Otestovat s reálnými videi a postavami

## Hailuo AI-Style Video Generation UI - Completed
- [x] Vytvořit tmavý layout inspirovaný Hailuo AI
- [x] Levý panel - mode selection, image/video upload
- [x] Pravý panel - grid galerie vygenerovaných videí
- [x] Video thumbnails s duration overlay ("00:10")
- [x] Bookmark ikony pro přidání do favorites
- [x] Responsive grid layout (3 sloupce)
- [x] Gradient background (gray-900 → purple-900)
- [x] Processing animace pouze v miniaturách

## UX Improvements - User Requested
- [ ] Processing animace POUZE v miniaturách v "All Jobs" sekci
- [ ] Hlavní preview zůstává čistý bez processing overlays
- [ ] Progress bar a status pouze v job thumbnails
