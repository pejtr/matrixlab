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

## Wan2.2-Animate Integration - User Requested (HIGH PRIORITY)
- [ ] Integrovat Wan2.2-Animate-14B model (wan-video/wan-2.2-animate-animation)
- [ ] Implementovat Animation Mode - animace postavy podle reference videa
- [ ] Implementovat Replacement Mode - full body swap (nahrazení celé postavy)
- [ ] Vytvořit UI pro výběr módu (Animation vs Replacement)
- [ ] Přidat upload pro character image + reference video
- [ ] Preprocessing videa před odesláním do modelu
- [ ] Zobrazit progress a výsledky pro oba módy
- [ ] Otestovat s reálnými videi a postavami

## Hailuo AI-Style Video Generation UI - User Requested
- [ ] Vytvořit tmavý layout inspirovaný Hailuo AI
- [ ] Levý panel - prompt input, image upload, mode selection
- [ ] Pravý panel - grid galerie vygenerovaných videí
- [ ] Video thumbnails s duration overlay (např. "00:10")
- [ ] Bookmark ikony pro přidání do favorites
- [ ] Filtr Type: Videos + Favorites toggle
- [ ] Responsive grid layout (3-4 sloupce)
- [ ] Hover efekty a smooth transitions
