# Project TODO

## Replicate Webhook Implementation - User Requested
- [x] Vytvořit webhook endpoint /api/replicate-webhook
- [x] Přidat predictionId do database schema
- [x] Implementovat webhook signature validation pro bezpečnost
- [x] Aktualizovat job status v databázi při webhook notifikaci
- [x] Stáhnout a uložit result media z webhook payload
- [x] Přidat webhook URL do replicateService.ts při vytváření prediction
- [ ] Nastavit REPLICATE_WEBHOOK_SECRET (whsec_V2TquxuvamjIWE8QzHtZK4aWm4vz4pxq) v Settings
- [ ] Nastavit WEBHOOK_URL (https://faceswap.manus.space/api/replicate-webhook) v Settings
- [ ] Otestovat webhook s reálným Replicate API voláním

## Upscale Feature - User Requested (CURRENT)
- [ ] Přidat Upscale tlačítko vedle Download/Crop/Animate
- [ ] Vytvořit upscaleService.ts pro Replicate upscale modely
- [ ] Implementovat image upscale (4x zvětšení)
- [ ] Implementovat video upscale pomocí Wan modelu
- [ ] Přidat UI pro upscale progress a výsledky
- [ ] Otestovat upscale na obrázcích i videích

## New AI Models Integration - User Requested
- [ ] Integrovat Wan model pro video upscaling
- [ ] Integrovat Flux model pro text-to-video generování
- [ ] Vytvořit novou sekci "Video Generator" s Flux
- [ ] Přidat UI pro text-to-video s preview
- [ ] Otestovat oba modely s reálnými daty

## Vercel Integration API Key
- [ ] Přidat Vercel Integration API key (r8_0AII45zb3ibrKU4UojdwbVc8ZOwd1Tq2LKBb9) do Settings

## Previous Features (All Completed)
See git history for complete list of implemented features.
