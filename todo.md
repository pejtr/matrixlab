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

## Current Session - User Requests
- [x] Přidat Animate tlačítko do hlavního menu (vedle Home, FaceSwap, atd.)
- [x] Přepnout Animate na Replicate I2V API (místo MiniMax)
- [x] Přidat detailní progress indikátor s procenty (0% → 100%)
- [x] Zobrazit odhadovaný čas generování ("Usually takes 2-3 minutes")
- [x] Přidat Delete/Cancel tlačítko pro běžící Wan Animate joby
- [ ] Implementovat webhook pro real-time progress updates (volitelné)
- [ ] Otestovat animaci s reálným výsledkem

## Deep-Live-Cam Features - User Requested
- [x] Webcam Live Preview s real-time face swap
  - [x] Vytvořit LiveCam stránku s webcam přístupem
  - [x] MediaStream API pro přístup ke kameře
  - [x] Canvas pro real-time rendering
  - [ ] WebSocket server pro streaming frames (připraveno pro budoucí implementaci)
  - [ ] Real-time face swap processing (připraveno pro budoucí implementaci)
  - [ ] Návrat zpracovaných frames zpět do browseru (připraveno pro budoucí implementaci)
- [x] Face Enhancement (vylepšení kvality po face swapu)
  - [x] Enhance tlačítko vedle Animate
  - [x] Real-ESRGAN 2x vylepšení (optimalizováno pro obličeje)
  - [x] UI pro preview before/after s download

## LiveCam Bug Fixes - User Reported
- [x] Přidat dropdown selector pro výběr kamery (místo automatického výběru)
- [x] Enumerovat všechny dostupné video input zařízení
- [x] Umožnit uživateli přepínat mezi kamerami
- [x] Auto-select první nepřímé kameru (ne XSplit, OBS, Virtual)

## LiveCam Enhancements - User Requested
- [x] Přidat "Refresh Cameras" tlačítko pro aktualizaci seznamu kamer bez reloadu
- [x] Uložit preferovanou kameru do localStorage (zapamatovat výběr)
- [x] Zobrazit camera preview thumbnails v dropdown menu pro snadnější identifikaci
- [x] Implementovat video recording (5-10 sekund)
- [x] Integrovat s Wan 2.2 Replacement mode pro face swap ve videu
- [x] Přidat video galerii s přehrávačem a download
- [x] Start/Stop Recording tlačítka s countdown timerem

## LiveCam Bug Fixes - Current Session
- [x] Opravit error handling v generateCameraPreviews (skip kamery bez deviceId nebo s access errorem)

## LiveCam UX Improvements - User Requested
- [x] Přidat loading skeleton pro camera preview thumbnails během generování
- [x] Implementovat camera permission check s helper message
- [x] Přidat camera settings - možnost nastavit rozlišení a framerate
- [x] Přeložit info zprávu do češtiny

## LiveCam Video Upload Feature
- [x] Přidat "Upload Video" tlačítko pod "Start Camera"
- [x] Validovat délku videa (max 10 sekund)
- [x] Integrovat s existujícím face swap workflow

## LiveCam Job Management
- [x] Přidat backend API pro cancel job
- [x] Přidat backend API pro delete job
- [x] Přidat Cancel tlačítko pro běžící joby
- [x] Přidat Delete tlačítko pro dokončené joby

## UI Improvements for 2K-4K Monitors - User Requested
- [x] Add responsive scaling CSS for 2K-4K monitors (transform scale)
- [x] Remove TARGET badge from bottom-left corner of result image
- [x] Add click handler to TARGET label in left column preview (opens lightbox)
- [x] Add click handler to target preview image area (opens file picker)
- [ ] Test on different screen resolutions

## Wan Animate Bug Fixes - User Reported
- [x] Fix duplicate delete button (křížek) in video cards (LiveCam)
- [x] Fix video freezing/loading issue in Wan Animate jobs (added key prop and preload)

## LiveCam Source Face Selection - User Requested
- [x] Add "Source Face Image" upload section to LiveCam page
- [x] Fetch unique source faces from completed swap jobs (tRPC procedure)
- [x] Display saved source faces as circular thumbnails below upload area
- [x] Implement click handler to select saved source face
- [ ] Test source face selection workflow

## Desktop Layout Optimization - All Jobs Grid Repositioning
- [x] Move All Jobs section from bottom to left column (below Generate button)
- [x] Create scrollable grid container with max-height matching main photo height
- [x] Implement vertical scrolling for job thumbnails
- [x] Ensure grid doesn't exceed right column height (72vh)
- [ ] Test responsive behavior on different screen sizes

## Target Preview Sync and Navigation - User Requested
- [x] Fix target preview not updating when navigating with arrow buttons
- [x] Change "TARGET" label to "TARGETS"
- [x] Add lightbox for TARGETS with navigation between all saved target images
- [x] Collect all unique target images from completed jobs
- [ ] Test navigation and synchronization

## FACE Badge Sync and Grid View - Current Session
- [x] Fix FACE badge synchronization - update when navigating with arrow buttons
- [x] Increase All Jobs grid initial display (+3 rows minimum, 9-12 thumbnails) - now shows 24 thumbnails (8 rows)
- [x] Add infinite scroll to All Jobs grid (dynamic loading on scroll) - loads 12 more on scroll
- [x] Implement Grid View layout (fullscreen grid alternative to Detail View)
- [x] Add view switcher toggle in header (Detail View ↔ Grid View)

- [x] Swap model functionalities (HQ should be faster, LQ should be slower but better quality)
- [x] Add model info display to show which model was used for each result

- [x] Add "Save as Face" button to action buttons (extract face from result and save to saved faces collection)
- [x] Implement face extraction from generated result
- [x] Show saved face in source faces gallery for reuse

## Grid View Layout Improvements - Current Session
- [x] Widen left panel to 310px (from original fullscreen grid)
- [x] Change grid thumbnails to 4:3 portrait aspect ratio (aspect-[3/4])
- [x] Add bottom preview area in left panel showing currently selected image
- [x] Add right grid area with small square thumbnails for quick overview
- [x] Add "Open Detail View" button in preview area

## Detail View Layout Fix - Move All Jobs to Right Column
- [x] Move All Jobs grid from left column to right column (below main result image)
- [x] Fill empty purple space in right column with All Jobs thumbnails
- [x] Fix Grid View layout - restore 310px left panel with preview and larger thumbnails in right grid
- [ ] Ensure responsive behavior on mobile (All Jobs at bottom)
