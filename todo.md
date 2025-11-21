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

## Upscale Feature - User Requested (CURRENT)
- [ ] Přidat Upscale tlačítko vedle Download/Crop/Animate na výsledcích
- [ ] Vytvořit upscaleService.ts pro Replicate upscale modely
- [ ] Implementovat image upscale pomocí Real-ESRGAN (4x zvětšení)
- [ ] Implementovat video upscale pomocí vhodného modelu
- [ ] Přidat UI pro upscale progress a výsledky
- [ ] Uložit upscalované výsledky jako nové joby
- [ ] Otestovat upscale na obrázcích i videích

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
