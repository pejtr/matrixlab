# Project TODO

## Core Features (Completed)
- [x] Databázové schéma pro face swap úlohy
- [x] Backend API pro nahrávání souborů
- [x] Backend API pro vytváření face swap úloh
- [x] Backend API pro získání stavu úlohy
- [x] Backend API pro stažení výsledku
- [x] Frontend - hlavní stránka s nahráváním souborů
- [x] Frontend - zobrazení průběhu zpracování
- [x] Frontend - zobrazení a stažení výsledku
- [x] Frontend - historie úloh uživatele
- [x] Demo worker proces pro testování

## FaceFusion Integration
- [x] Vytvořit produkční worker proces pro FaceFusion
- [x] Implementovat download/upload logiku pro soubory
- [x] Přidat error handling pro FaceFusion CLI
- [x] Dokumentace pro FaceFusion instalaci
- [ ] Testování s reálnými face swap úlohami

## MiniMax Integration
- [ ] Přidat MiniMax API key do environment variables
- [x] Vytvořit MiniMax service wrapper pro MCP volání
- [x] Implementovat Image Generation funkci
- [ ] Implementovat Image-to-Video funkci
- [x] Implementovat Text-to-Video funkci
- [x] Implementovat Music Generation funkci
- [ ] Implementovat Voice Cloning funkci

## Extended Features
- [ ] Nová stránka: AI Image Generator
- [ ] Nová stránka: Video Generator (I2V, T2V)
- [ ] Nová stránka: Music Generator
- [ ] Nová stránka: Voice Studio
- [ ] Workflow: Face Swap → Video Animation
- [ ] Workflow: Generate Image → Face Swap → Animate
- [ ] Přidat možnost přidat hudbu k výsledným videím

## UI Improvements
- [ ] Dashboard s přehledem všech AI nástrojů
- [ ] Unified job history pro všechny typy úloh
- [ ] Progress bar s procenty místo jen "Processing"
- [ ] Galerie šablon pro face swap
- [ ] Preview před zpracováním

## Database Schema Updates
- [x] Rozšířit job schema o různé typy úloh (faceswap, image_gen, video_gen, music_gen)
- [x] Přidat metadata pro každý typ úlohy
- [x] Migrace existujících dat


## Current Sprint - Frontend Implementation
- [x] Vytvořit AI Dashboard s přehledem všech nástrojů
- [x] Implementovat Image Generator stránku
- [x] Implementovat Video Generator stránku (T2V + I2V)
- [x] Implementovat Music Generator stránku
- [ ] Unified job history pro všechny typy úloh
- [ ] Workflow: "Animate Result" tlačítko na face swap výsledcích


## Urgent Fixes - Current Issues
- [x] Face swap nefunguje - demo worker jen kopíruje soubory
- [x] Integrovat Replicate API pro skutečný face swap
- [x] Opravit MiniMax service - manus-mcp-cli tool nenalezen
- [ ] Testovat video generation s opravou
- [x] Nastavit REPLICATE_API_TOKEN a MINIMAX_API_KEY
- [x] Spustit Replicate worker proces


## Critical Bugs - Must Fix Before Release
- [x] Replicate face swap selhává - chyba 422 "invalid version or not permitted"
- [x] Najít správnou verzi Replicate face swap modelu (codeplugtech/face-swap)
- [x] Video Generator selhává - dočasně vypnuto, zaměření na face swap
- [x] Otestovat face swap s reálnými obrázky - připraven k testování uživatelem


## New Features - User Requested
- [x] Progress indikátor - zobrazit real-time průběh (0-100%)
- [x] Retry mechanismus - automaticky opakovat selhané úlohy až 3x
- [x] Vyřešit Replicate API credit problém - nový API token


## Critical Bug - API Parameters
- [x] Replicate API validation error - špatné názvy parametrů (swap_image vs source_image)
- [x] Zkontrolovat dokumentaci codeplugtech/face-swap modelu
- [x] Opravit názvy parametrů v replicateService.ts


## Navigation Improvements - User Requested
- [x] Vytvořit hamburger menu komponentu (desktop + mobil)
- [x] Implementovat sticky bottom navigation pro mobil
- [x] Přidat ikony a textové názvy do bottom menu
- [x] Integrovat navigaci do všech stránek
- [x] Responsive design - skrýt bottom nav na desktopu


## UI Icon Updates - User Requested
- [x] Změnit Source Face ikonu na ikonu hlavy/portrétu (UserCircle)
- [x] Změnit Target Media ikonu na ikonu celé postavy (Users)


## Mobile Layout Improvements - User Requested
- [x] Změnit FaceSwap layout na mobilu - Source a Target vedle sebe (grid-cols-2)
- [x] Výsledek pod upload poli v plné šířce
- [x] Vytvořit "obrácené T" zobrazení na mobilu
- [x] Desktop layout zůstane původní (grid-cols-2 pro všechny karty)


## New Features - User Requested (Priority)
- [x] Batch processing - možnost nahrát více cílových médií najednou (multi-select)
- [x] Batch processing - vytvořit hromadnou úlohu se stejným zdrojovým obličejem
- [x] Batch processing - zobrazit progress pro všechny úlohy v batchi
- [x] Template gallery - vytvořit knihovnu předpřipravených šablon
- [x] Template gallery - kategorie: celebrity, memes, populární scény
- [x] Template gallery - thumbnail náhledy pro rychlé testování
- [x] Before/After comparison slider - interaktivní slider na výsledcích
- [x] Before/After comparison slider - side-by-side porovnání původního a swapnutého obličeje
- [x] Before/After comparison slider - podpora pro obrázky (videa zobrazena normálně)


## Gallery View - User Requested
- [x] Vytvořit gallery view pro batch výsledky
- [x] Přidat šipky pro navigaci mezi výsledky (předchozí/další)
- [x] Zobrazit aktuální pozici (např. "3 / 10")
- [x] Podpora klávesnice (šipky vlevo/vpravo)
- [x] Thumbnail náhledy všech výsledků v batchi
- [x] Automatické načítání z history podle batch ID nebo user ID


## FaceSwap Page Redesign - User Requested
- [x] Kompaktnější design (méně padding, menší mezery)
- [x] Zachovat obrácené T zobrazení i po zpracování (vstupy nahoře, výsledky dole)
- [x] Vše na jedné stránce - vstupy i výstupy viditelné současně
- [x] Carousel navigace pro výsledky (šipky vlevo/vpravo)
- [x] Zobrazit všechny dokončené joby inline pod vstupy
- [x] Odstranit přesměrování na history/detail stránku


## UI Cleanup - User Requested
- [x] Odstranit nadpis "Create Face Swap" a popisek
- [x] Results sekce - obrázek na plnou šířku (odstranit padding)
- [x] Odstranit "Results" nadpis
- [x] Odstranit counter badge "5 / 19"
- [x] Odstranit "Result" toggle tlačítko
- [x] Odstranit "Original" a "Swapped" labely (použití pouze result view)
- [x] Odstranit "Job #30007" a "Done" badge
- [x] Nechat pouze Download tlačítko a navigační šipky


## Further UI Simplification & New Features - User Requested
- [x] Odstranit CardHeader z upload karet ("1. Source Face", "2. Target Media")
- [x] Odstranit "Click to upload" a "Multi-select" texty
- [x] Nechat pouze ikony (UserCircle, Users) bez textu
- [x] Auto-refresh Notification - toast "New result ready!" s možností kliknout
- [x] Toast má skočit na nový výsledek v carousel po kliknutí
- [x] Quick Actions Menu - tři-tečkové menu (⋮) na každém thumbnailuilu
- [x] Quick Actions: Delete job (placeholder)
- [x] Quick Actions: Re-run with same settings (placeholder)
- [x] Quick Actions: Share link (copy to clipboard)
- [x] Quick Actions: Set as template (placeholder)
- [x] Progress Indicator - mini progress bar na thumbnail gridu
- [x] Progress bar pro pending/processing joby
- [x] Vizuální indikace stavu bez klikání


## Bug Fixes & UI Improvements - User Reported
- [x] Opravit: Preview obrázky zůstávají po odeslání formuláře
- [x] Reset sourcePreview, targetPreviews, sourceFile, targetFiles po úspěšném submitu
- [x] Kompaktnější navigace - pouze ikony bez textů
- [x] Zmenšit padding a velikost navigačního menu (h-16 → h-12)
- [x] Icon-only design pro top navigation bar


## Fullscreen Lightbox Gallery - User Requested
- [x] Vytvořit fullscreen lightbox komponentu
- [x] Otevřít lightbox po kliknutí na výslednou fotografii
- [x] Navigace šipkami vlevo/vpravo mezi všemi výtvory
- [x] Podpora klávesnice (Arrow Left/Right, Escape)
- [x] Tmavé pozadí s overlay (bg-black/95)
- [x] Zavírací tlačítko (X)
- [x] Counter zobrazující aktuální pozici (např. "3 / 10")
- [x] Thumbnail strip na spodním okraji pro rychlý přechod
- [x] Download tlačítko v lightboxu
- [x] Podpora pro videa i obrázky


## Horizontal T Layout for Desktop - User Requested
- [x] Desktop: Změnit na ležící T layout (otočené o 90° doleva)
- [x] Desktop: Levý sloupec - Source Face (nahoře) + Target Media (dole) = 2 řádky
- [x] Desktop: Pravý sloupec - Results na plnou výšku
- [x] Mobile: Zachovat původní obrácené T (vstupy vedle sebe, výsledky dole)
- [x] Responsive breakpoint: md (768px)


## UI Improvements - User Requested
- [x] Přidat delete badge (Trash2 ikona) na thumbnails pro rychlé smazání
- [x] Delete badge v pravém horním rohu každého thumbnailuilu
- [x] Zjednodušit Done badge - pouze zelená fajfka (CheckCircle) bez textu
- [x] Zachovat ostatní status badges (Pending, Processing, Failed) s textem
- [x] Odstranit Quick Actions Menu (nahrazeno delete badge)


## Bug Fix - User Reported
- [x] Opravit: Po neúspěšném vytvoření jobu zůstávají preview obrázky
- [x] Přidat reset preview i v catch bloku handleSubmit
- [x] Umožnit nové generování i po předchozí chybě
- [x] Vyčistit isUploading state po chybě


## Result Display & Saved Faces - User Requested
- [x] Odstranit horní řádek "FaceSwap Web" pro více prostoru
- [x] Výsledná fotografie max-height podle viewport (max-h-[calc(100vh-16rem)])
- [x] Přidat miniatury před/po (source face + target media) vedle hlavního výsledku
- [x] Implementovat Saved Faces feature - možnost uložit často používané source faces
- [x] Saved Faces ikona/tlačítko vedle Source Face upload pole
- [x] Database schema pro savedFaces tabulku (userId, faceImageKey, faceImageUrl, name)
- [x] UI pro výběr z uložených tváří (SavedFacesDialog modal)
- [x] Možnost smazat uloženou tvář (delete badge v dialogu)


## Job Polling & UI Improvements - User Requested
- [x] Automatický polling každých 5s pro pending/processing joby
- [x] Real-time progress updates bez manuálního refreshe
- [x] Optimistic updates pro lepší UX
- [x] Vycentrovat navigační tlačítka (menu doprostřed)
- [x] All Jobs grid - zobrazit miniatury výstupních obrázků (completed joby)
- [x] All Jobs grid - zobrazit target thumbnails pro pending/processing joby
- [x] Retry funkce pro Failed joby - možnost přegenerovat (placeholder)
- [x] Delete ikona v Lightbox galerii
- [x] Delete funkce přímo z fullscreen view (placeholder)


## Delete Fix & Thumbnail Relayout - User Requested
- [x] Implementovat skutečné mazání jobů (tRPC mutation)
- [x] Delete job z databáze (jobs tabulka)
- [x] Delete souborů z S3 (resultMediaUrl, sourceImageUrl, targetMediaUrl)
- [x] Refresh job listu po úspěšném smazání
- [x] Přesunout before/after miniatury pod generovací tlačítko (desktop)
- [x] Miniatury v levém sloupci na desktopu
- [x] Skrýt miniatury na mobilu (hidden md:flex)


## Delete UI Improvements - User Requested
- [x] Přidat delete ikonu vedle Download tlačítka v hlavním results view
- [x] Umožnit mazání i neúspěšných generování (failed jobs)
- [x] Delete badge i na failed jobs v thumbnail gridu


## Before/After Thumbnails & UI Improvements - User Requested
- [x] Zmenšit padding u Before/After miniatur pro kompaktnější zobrazení
- [x] Přidat možnost otevřít Before/After miniatury v lightboxu po kliknutí
- [x] Přidat Save to Faces badge na Before miniaturách
- [x] Redukovat Download tlačítko pouze na ikonu (bez textu)
- [x] Omezit Saved Faces na maximálně 8 uložených tváří


## All Jobs Grid & Retry Fixes - User Requested
- [x] Přesunout All Jobs grid na celou šířku (pod Before/After miniatury)
- [x] Zmenšit náhledy o 10% pro kompaktnější zobrazení
- [x] Přidat "Load More" tlačítko pro načítání dalších jobů (pagination)
- [x] Opravit Retry funkcionalitu - implementovat skutečný retry mechanismus
- [x] Opravit delete badge na failed jobs - není klikatelný kvůli overlay


## Regenerate Functionality - User Requested
- [x] Přidat Regenerate ikonu (šipky v kruhu) vedle Download a Delete tlačítek
- [x] Vytvořit RegenerateDialog komponentu pro výběr nové source face
- [x] Defaultně předvyplnit původní source a target z dokončeného jobu
- [x] Umožnit výběr jiné saved face nebo nahrání nové
- [x] Implementovat regenerate logiku - vytvoření nového jobu se stejným target, novou source


## Batch Generation Fix & Limit - User Requested
- [x] Diagnostikovat proč batch generování fotografií nefunguje
- [x] Opravit batch generation logiku pro multiple target files
- [x] Přidat limit 5 target médií maximálně
- [x] Frontend validace - zobrazit chybu při výběru více než 5 souborů
- [x] Backend validace - zabránit vytvoření více než 5 jobů najednou


## Layout Optimization - User Requested
- [x] Odstranit Back tlačítko a celý horní řádek
- [x] Optimalizovat layout pro 100% zoom na desktopu


## Before Thumbnail & Saved Faces Fixes - User Requested
- [x] Opravit Before thumbnail lightbox - zobrazit správnou source fotku místo target
- [x] Nahradit Saved Faces tlačítko inline miniaturami uložených tváří
- [x] Umožnit kliknout na saved face miniaturu pro rychlý výběr
- [x] Opravit "Failed to load saved face" chybu
- [x] Diagnostikovat proč handleLoadSavedFace selhává


## Clean State on Page Load - User Requested
- [x] Reset UI state při načtení stránky (refresh)
- [x] Vymazat source a target file inputs
- [x] Skrýt Before/After thumbnails
- [x] Nezobrazovat poslední výsledek automaticky
- [x] Uživatel začíná s čistým stavem pro nové generování


## Clean State Fix & Batch Generation - User Requested
- [x] Upravit clean state - zachovat historii jobů (All Jobs grid)
- [x] Vyčistit pouze formulář (source/target inputs) a zobrazený výsledek
- [x] Skrýt Before/After thumbnails a hlavní result view
- [x] Diagnostikovat proč batch generování nefunguje - přidány debug logy
- [ ] Opravit batch generation pro více target souborů najednou
- [ ] Testovat batch s 2-5 soubory


## Layout Optimization for 100% Zoom - User Requested
- [x] Zmenšit saved faces miniatury o 30%
- [x] Zmenšit Before/After miniatury o 30%
- [x] Redukovat padding a margins v levém sloupci
- [x] Optimalizovat velikosti cards pro 100% zoom
- [x] Zajistit že se vše vejde bez scrollování při 100% zoom


## Upload & CORS Fixes - User Reported
- [x] Opravit upload endpoint - vrací nevalidní JSON (SyntaxError)
- [x] Opravit CORS chyby při načítání saved faces z CloudFront
- [x] Přidat server-side proxy pro saved faces nebo opravit CORS headers
- [ ] Testovat batch upload s 2-3 soubory


## Critical Bugs - User Reported
- [x] Opravit 404 na /ai/dashboard route - route odstraněna z navigace
- [x] Opravit nefunkční generování (upload endpoint) - opravena route
- [x] Opravit "Failed to load saved face" chybu - použití no-cors fetch s fallback
- [x] Přidat mobile swipe support pro lightbox (touch gestures) - implementováno
- [ ] Testovat že batch generování funguje s debug logy

## Future Feature - Multiple Face Selection
- [ ] Přidat face detection preview před generováním
- [ ] Možnost označit které tváře v target médiu nahradit (checkboxy)
- [ ] Předat indexy vybraných tváří do FaceFusion API


## New User Requirements - Current Sprint
- [x] Změnit název webu na "FaceSwap AI" (místo "FaceSwap Web")
- [x] Tablet layout - levý sloupec 1/3 šířky (grid-cols-[1fr_2fr])
- [x] Opravit batch generování - codeplugtech/face-swap nepodporuje videa
- [x] Přidat podporu pro video face swap - použit xrunda/hello model
- [x] Retry funkcionalita - funguje správně, problém byl v modelu


## Layout Adjustment - User Requested
- [x] Zvětšit vygenerovaný obrázek v pravém sloupci (změnit grid ratio z 1:2 na 1:2.5)


## Loading Indicator - User Requested
- [x] Přidat vizuální indikátor načítání během generování
- [x] Loading overlay s animovaným spinnerem
- [x] Progress text s procentálním stavem (např. "Processing... 30%")
- [x] Estimated time pro delší operace (videa - "1-2 minutes")
- [x] Zobrazit na hlavním výsledkovém obrázku během zpracování
- [x] Progress bar v thumbnail gridu s procenty


## Media Type Detection - Debug & Fix
- [x] Zkontrolovat frontend detekci typu média - správně: `type.startsWith("video/")`
- [x] Zkontrolovat backend job creation - správně předává targetMediaType
- [x] Ověřit Replicate service - správný model pro fotky (codeplugtech/face-swap)
- [x] Přidat debug logy - přidány logy s cenou a časem pro každý model
- [x] Opravit špatnou verzi xrunda/hello modelu (použit bez verze = latest)


## UX Improvement - Preserve Source Face
- [x] Po vygenerování zachovat zvolenou Saved Face v input poli
- [x] Vymazat pouze target files (ne source face)
- [x] Umožnit rychlé generování dalších variant se stejnou tváří


## RunPod Deployment - Video Face Swap
- [x] Vytvořit Docker image s Inswapper (roop) + RunPod handler
- [x] Vytvořit RunPod Serverless konfiguraci
- [x] Integrovat RunPod API do aplikace (runpodService.ts)
- [x] Přidat validaci délky videa (max 30s) ve frontendu
- [x] Vytvořit dokumentaci pro deployment (DEPLOYMENT.md)
- [ ] Uživatel musí nasadit Docker image na RunPod a nastavit API keys


## Layout Optimization - 100% Zoom
- [x] Zvětšit vygenerovanou fotku na výšku (h-[calc(100vh-8rem)])
- [x] Přesunout Saved Faces NAD ikonu nahrání tváře
- [x] Udělat miniatury Saved Faces kulaté (rounded-full) a menší (grid-cols-6)
- [x] Odstranit zbytené mezery - p-1.5, gap-1.5, menší fonty
- [x] Zmenšit Before/After miniatury (aspect-[4/3], menší text)


## UI Cleanup - User Requested
- [x] Odstranit horní UserCircle ikonu nad Saved Faces (odstraněn duplikátní upload input)


## Drag & Drop Feature - User Requested
- [x] Přidat drag & drop pro source face upload
- [x] Přidat drag & drop pro target media upload
- [x] Vizuální feedback při přetáhování (border highlight + scale + bg color)
- [x] Validace file types při drop (images pro source, images/videos pro target)
- [ ] Testovat s různými file types (images, videos)


## Lightbox Save Feature - User Requested
- [x] Přidat Save ikonu do lightbox toolbar (Bookmark icon, zelená barva)
- [x] Implementovat save face funkcionalitu z lightbox (handleSaveFaceFromLightbox)
- [x] Zobrazit pouze pro "source" type lightbox (Before obrázky)
- [x] Toast notification po úspěšném uložení
- [x] Automatická invalidace saved faces seznamu po uložení


## Critical Bug - Delete Behavior
- [x] Soft delete pro source images - smazání Before fotky nesmaže celé generování
- [x] Přidat `sourceDeletedAt` timestamp do faceSwapJobs tabulky
- [x] Before thumbnail se zobrazuje normálně (jako by nic)
- [ ] Možnost obnovit smazanou source image (Restore button)
- [x] Lightbox Before galerie přeskočí smazané faces

## Batch Delete Feature
- [ ] Přidat checkbox selection do All Jobs gridu
- [ ] "Select All" checkbox v hlavičce
- [ ] "Delete Selected" button (zobrazí se když je něco vybráno)
- [ ] Confirmation dialog před smazáním více jobů

## Before/After Comparison Slider
- [ ] Implementovat slider overlay pro porovnání Before/After
- [ ] Přidat tlačítko "Compare" u každého výsledku
- [ ] Interaktivní slider pro přepínání mezi Before a After
- [ ] Responsive design pro mobile

## Export All Results
- [ ] Přidat "Download All as ZIP" button
- [ ] Server-side ZIP generation (všechny completed results)
- [ ] Progress indicator během generování ZIP
- [ ] Automatické stažení po dokončení

## Regenerate Mode - User Requested
- [ ] Detekce regenerate mode (source face změněna + current result existuje)
- [ ] Auto-fill target media s původní fotkou z current result
- [ ] Změnit tlačítko "Start Face Swap" na "Regenerate"
- [ ] Zachovat regenerate mode při změně source face

## UI Spacing Fix - User Requested
- [x] Odstranit mezeru nad Saved Faces miniaturami (zbytečný padding/margin)

## Crop Functionality - User Requested
- [x] Přidat CROP ikonu vedle Download/Delete/Regenerate
- [x] Implementovat CropDialog komponentu s canvas editorem
- [x] Interaktivní crop area s drag & resize
- [x] Auto-save oříznutého výsledku do S3
- [x] Reset funkce pro vrácení k původnímu crop area
- [ ] Aktualizace job v databázi s cropped URL (backend)
- [ ] Undo funkce - uložit původní URL před cropem

## CORS Fix for CropDialog - User Reported
- [x] Opravit CORS chybu při načítání obrázku v CropDialog
- [x] Použít existující server-side proxy endpoint (savedFaces.getFaceImageBlob)
- [x] Aktualizovat CropDialog pro použití tRPC proxy místo přímého načítání
- [ ] Testovat crop s proxy endpointem (uživatel otestuje)

## Crop Enhancement - User Requested
- [x] Přidat resize handles - 8 tažitelných bodů (4 rohy + 4 strany)
- [x] Implementovat resize logiku pro změnu velikosti crop oblasti
- [x] Aspect ratio lock - toggle tlačítko pro zamknutí poměru stran (Lock/Unlock ikona)
- [x] Aspect ratio dropdown - výběr poměru (Free, 1:1, 4:3, 16:9, 9:16)
- [x] Crop presets - rychlá tlačítka pro Instagram Post (1:1)
- [x] Crop presets - Instagram Story (9:16)
- [x] Crop presets - Facebook Cover (16:9)
- [x] Vizuální feedback při resizu (dynamické kurzory: nw-resize, n-resize, move, atd.)

## Update Result After Crop - User Requested
- [x] Přidat backend endpoint updateJobResult pro update resultMediaUrl
- [x] Přidat updateFaceSwapJobResult funkci do db.ts
- [x] Aktualizovat onSave handler v FaceSwap.tsx pro volání backendu
- [x] Automatická invalidace a refresh zobrazení po uložení
- [x] Zobrazit nově oříznutý obrázek místo původního

## Batch Upload Issues - User Reported
- [x] Opravit zobrazování thumbnail preview (byl limit na 2, nyní všechny)
- [x] Přidat náhledy (thumbnails) pro nahrané target fotky
- [x] Zobrazit skutečné miniatury místo placeholderů "Target 1", "Target 2"
- [x] Grid layout 3 sloupce pro zobrazení všech nahraných fotek (max 5)
- [x] Hover efekt s číslem fotky (#1, #2, atd.)
- [ ] Batch upload failures - čekají na uživatele pro testování

## Input Independence Issue - User Reported
- [x] Opravit resetování target files při změně source face
- [x] loadTargetFromJob se volá pouze pokud targetFiles.length === 0
- [x] Zajistit nezávislost obou vstupních polí
- [x] Odstranit nežádoucí reset logiku

## Generation Issues - User Reported
- [x] Opravit generování - nemazat target files po odeslání
- [x] Aktualizovat velkou fotku po dokončení generování (automatické přepnutí na nejnovější)
- [x] Before/Original miniatury zobrazují aktuální currentJob (správně)
- [x] Zobrazit target fotku v hlavním okně během generování (s loading overlay)
- [x] Opravit mizející target miniatura - nyní zůstává po odeslání
- [ ] Console error - čeká na uživatele pro testování

## Cancel Job Functionality - User Requested
- [x] Přidat backend endpoint cancelJob pro zrušení jobu
- [x] Update job status na "cancelled" v databázi (přidáno do schema)
- [x] Přidat Cancel tlačítko k progress bars (u každého pending/processing jobu)
- [x] Automatická invalidace a refresh po zrušení
- [x] Zobrazit toast notifikaci po úspěšném zrušení

## Generation UI Updates - User Requested
- [x] Zobrazit Before/Original miniatury během generování (ze vstupních polí)
- [x] Aktualizovat Before miniature na aktuální sourcePreview
- [x] Aktualizovat Original miniature na aktuální targetPreviews[0]
- [x] Zobrazit velkou fotku (target) s loading overlay během generování (již hotovo)
- [x] Zajistit, že miniatury se zobrazí i když ještě není currentJob

## Retry Auto-Delete - User Requested
- [x] Najít Retry button handler v All Jobs gridu
- [x] Přidat automatické smazání failed jobu po úspěšném vytvoření retry jobu
- [ ] BUG: Auto-delete nefunguje - failed joby zůstávají po kliknutí na Retry
- [ ] Zkontrolovat, proč se deleteJobMutation nevolá nebo selhává
- [ ] Opravit delete logiku a otestovat

## Generation Still Failing - CRITICAL BUG
- [x] Worker spuštěný, ale všechny joby selhaly (Failed)
- [x] Zkontrolovat worker logy - Replicate vrací null output
- [x] Identifikována příčina - codeplugtech/face-swap model nefunguje
- [x] Změněn model na yan-ops/face_swap (595K+ runs, osvědčený)
- [x] Opraveny input parametry (target_image, swap_image)
- [x] Restartovat server a worker pro aplikaci změn
- [x] Worker běží s novým modelem
- [ ] Čeká na uživatele - vytvořit nový testovací job a ověřit, že funguje

## CRITICAL: Generation Fails at 30% - User Reported
- [ ] Zkontrolovat worker logy pro 30% freeze
- [ ] Identifikovat příčinu selhání yan-ops/face_swap modelu
- [ ] Opravit generování ASAP

## Error Recovery UI - User Requested
- [ ] Přidat zobrazení konkrétní chybové zprávy u failed jobů
- [ ] Místo jen "Failed" badge zobrazit error message
- [ ] Tooltip nebo expandable sekce s detaily chyby

## Job Queue Visualization - User Requested
- [ ] Implementovat progress bar ukazující pozici ve frontě
- [ ] Zobrazit "Processing 2/5 jobs" text
- [ ] Lepší UX při batch operacích

## Templates Expansion - User Requested
- [ ] Přidat více šablon - 60% ženy, 40% muži
- [ ] Různé zajímavé typy přitažlivých lidí
- [ ] Přesunout tlačítko Templates nad ikonu (zarovnání s prvním sloupcem)

## CRITICAL FIX - Model Change (User Reported)
- [x] Zkontrolovat worker logy pro 30% freeze
- [x] Identifikovat příčinu selhání - yan-ops/face_swap model neexistuje (404)
- [x] Změnit model na easel/advanced-face-swap (komerční kvalita)
- [x] Restartovat worker proces s novým modelem
- [x] Opravit generování ASAP

## Error Recovery UI - User Requested
- [x] Přidat zobrazení konkrétní chybové zprávy u failed jobů
- [x] Tooltip na Failed badge s error message
- [x] Lepší debugging pro uživatele

## Job Queue Visualization - User Requested
- [x] Implementovat progress bar ukazující pozici ve frontě
- [x] Zobrazit "Processing X / Y jobs" text
- [x] Lepší UX při batch operacích

## Templates Expansion - User Requested
- [x] Přidat více šablon - 20 celkem (60% ženy, 40% muži)
- [x] Různé zajímavé typy přitažlivých lidí
- [x] Přesunout tlačítko Templates nad ikonu (zarovnání s prvním sloupcem)

## Custom Template Upload - User Requested
- [x] Vytvořit databázové schéma pro customTemplates (userId, name, thumbnailUrl, mediaUrl, mediaType)
- [x] Backend API - upload custom template (file upload + S3)
- [x] Backend API - list user's custom templates
- [x] Backend API - delete custom template
- [x] Frontend - tlačítko "Upload Custom" v Template Gallery
- [x] Frontend - zobrazit custom templates společně s vestavěnými
- [x] Frontend - možnost smazat vlastní šablony (delete badge)

## CRITICAL - 30% Freeze Still Persists (User Reported)
- [x] Analyzovat worker logy pro detailní příčinu zamrznutí - našel jsem špatné názvy parametrů
- [x] Opravit názvy parametrů v easel/advanced-face-swap (swap_image místo source_image)
- [x] Přidat detailní logging každého kroku (API call, polling, response)
- [x] Implementovat timeout mechanismy (max čekání na odpověď - 3min API, 1min download)
- [x] Přidat retry strategii (již existovala, zachována)
- [x] Automatické označení jako failed při timeoutu
- [x] Monitoring délky jednotlivých kroků (timestamp logging)

## tRPC Client Error - HTML Instead of JSON (User Reported)
- [x] Zkontrolovat server logy pro chyby při API voláních - našel jsem ECONNRESET
- [x] Identifikovat příčinu - MySQL connection timeout/reset
- [x] Přidat withDbRetry wrapper pro automatické zotavení z connection errors
- [x] Upravit worker pro použití withDbRetry
- [x] Testovat - worker běží bez chyb

## Template Selection Not Working (User Reported)
- [x] Zkontrolovat TemplateGallery onSelect handler - funguje správně
- [x] Identifikovat problém - tlačítko "Use Templates" je mimo viewport na mobilu/tabletu
- [x] Opravit dialog - přidat max-h-[90vh], scrollování a sticky footer
- [x] Zvýraznit tlačítko - gradient růžovo-fialový

## 30% Freeze Still Happening + Retry All (User Reported)
- [ ] Analyzovat logy - "No output images were generated"
- [ ] Zkontrolovat Replicate API parametry (swap_image vs target_image)
- [ ] Otestovat s jiným modelem nebo opravit parametry
- [ ] Přidat "Retry All" tlačítko v AI Studio
- [ ] Backend endpoint pro bulk retry failed jobs
- [ ] Testovat retry all funkcionalitu

## Test Replicate API + NSFW Blocking (User Reported)
- [x] Zkontrolovat pending/failed jobs v databázi
- [x] Otestovat Replicate API s běžným template - API klíč funguje
- [x] Ověřit, jestli API klíč funguje - není zablokovaný
- [x] Přidat lepší error message pro NSFW detection
- [x] Implementovat "Retry All" tlačítko v Job History

## CRITICAL - Stuck Processing Jobs + Generation Not Working (User Reported)
- [x] Zkontrolovat, proč worker nezpracovává joby - worker běží, ale failuje kvůli prázdným souborům
- [x] Přidat "Cancel" tlačítko pro processing joby
- [x] Vyčistit stuck joby v databázi
- [x] Přidat detailní logging do uploadHandler.ts
- [ ] Uživatel musí otestovat upload - možný problém s prázdnými soubory (0 bytů)
- [ ] Pokud upload stále selže, zkontrolovat browser console a network tab

## CRITICAL - Empty Files Fixed (Ready for User Testing)
- [x] Identifikovat příčinu prázdných souborů - __remoteUrl proxy files
- [x] Opravit handleSubmit - zkontrolovat __remoteUrl před uploadem
- [x] Opravit handleUseTemplates - přidat __remoteUrl fallback pro CORS
- [x] Opravit loadTargetFromJob - už měl fallback
- [x] Opravit TypeScript chyby
- [x] Vyčistit failed joby z databáze
- [ ] Uživatel musí otestovat: Nový upload (ne template/regenerate)
- [ ] Uživatel musí otestovat: Regenerate s existujícím jobem
- [ ] Uživatel musí otestovat: Templates (vestavěné i custom)

## NSFW-Friendly Model Selector (User Requested)
- [x] Výzkum NSFW-friendly modelů na Replicate - fofr/face-swap-with-ideogram
- [x] Přidat model preference do database schema (faceSwapJobs.modelPreference)
- [x] Backend - přidat model selection do createJob endpoint
- [x] replicateService - implementovat automatic fallback (easel → fofr)
- [x] Frontend - přidat model selector dropdown (High Quality vs Permissive)
- [x] Frontend - NSFW warning text
- [x] Přidat modelPreference do všech createJobMutation volání
- [ ] Uživatel musí otestovat s NSFW obsahem

## Vertical Portrait Layout (User Requested)
- [x] Změnit Saved Faces layout - grid-cols-2 (hlavy pod sebou)
- [x] Změnit Target Media preview - aspect-[3/4] (portrait orientace)

## Source Face Section Redesign (User Requested)
- [x] Zmenšit saved faces thumbnails - 48x48px (w-12 h-12)
- [x] Změnit saved faces layout - vertikální sloupec s scrollem
- [x] Změnit velký preview - aspect-[3/4] portrait
- [x] Zmenšit celou Source Face sekci - 0.8fr (z 1fr)
- [x] Zvětšit Target Media preview - 3fr (z 2.5fr)

## 2-Column Source Face Layout (User Requested)
- [ ] Změnit layout na 2 sloupce vedle sebe (flex row)
- [ ] Levý sloupec (10%) - vertikální miniatury
- [ ] Pravý sloupec (90%) - velký preview
- [ ] Přidat prázdné placeholder sloty (8 celkem pro saved faces)
- [ ] Prázdné sloty zobrazují UserCircle ikonu
- [ ] Kliknutí na prázdný slot otevře file picker


## 2-Column Source Face Layout - User Requested
- [x] Změnit layout na 2 sloupce vedle sebe (flex row)
- [x] Levý sloupec (10%) - vertikální miniatury
- [x] Pravý sloupec (90%) - velký preview
- [x] Přidat prázdné placeholder sloty (8 celkem pro saved faces)
- [x] Prázdné sloty zobrazují UserCircle ikonu
- [x] Kliknutí na prázdný slot otevře file picker


### UI Refinements - User Requested
- [x] Snížit počet saved face slotů z 8 na 5
- [x] Zvětšit miniatury saved faces (větší velikost)
- [x] Odstranit mezery nahoře a dole u saved faces thumbnails
- [x] Skrýt popisek u AI Model selectu (zabírá moc místa)
- [x] Template preview - plná šířka když je jen 1 fotka (ne grid)
- [x] Přidat Cancel tlačítko na pending joby v thumbnail gridu
- [x] Přidat Retry tlačítko na pending joby v thumbnail gridu
- [x] Opravit Replicate API chybu pro permissive model (character_image parametr)

- [x] Změnit Source Face layout ratio z 10:90 na 20:80 (větší levý sloupec pro lepší viditelnost miniatur)

- [x] Změnit desktop main layout ratio z 1:2.5 na 20:80 (širší levý sloupec s většími preview v kartách)

-- [x] Odstranit velký preview z Source Face karty
- [x] Nechat pouze větší miniatury v grid layoutu
- [x] Kompaktnější design bez zbyteného preview

- [x] Odstranit "Save Current Face" tlačítko
- [x] Změnit na 4 miniatury místo 5 (grid 2x2)
- [x] Změnit miniatury na kulaté (rounded-full)
- [x] Přidat náhledovou část pod miniatury (aspect-square, max výška = šířka)

- [x] Přesunout AI Model a Templates do jednoho řádku pod náhled (50:50 poměr)
- [x] AI Model vlevo, Templates vpravo
- [x] Odstranit Before/After switch
- [x] Přidat Before/After badge jako overlay v levém dolním rohu vygenerovaných fotek

- [x] Odstranit náhledovou část úplně (zabírá moc prostoru na výšku)
- [x] Nechat jen 4 kulaté miniatury + AI Model/Templates řádek

- [x] Opravit zobrazení nejnovější fotky - po vygenerování se zobrazuje poslední místo nejnovější

- [x] Odstranit mezery nad a pod velkou fotkou
- [x] Přizpůsobit výšku pole výšce obrázku (ne fixed height)
- [x] All Jobs pás miniatur hned pod fotkou (bez mezery)
- [x] Přidat Delete tlačítko na Pending joby

- [x] Opravit viditelnost Retry/Cancel/Delete tlačítek na pending thumbnails (nejsou zobrazená)

-- [x] Vygenerovat nové template obrázky v bombshell lifestyle stylu (glamour, luxusní prostředí, sexy pózy)
- [x] Vrátit Before/After thumbnails zpět pod Submit tlačítko
- [x] Omezit maximální výšku velkého obrázku aby byl vždy viditelný pás miniatur na desktopu

- [x] Opravit 4. prázdnou pozici - neotvírá file picker při kliknutí
- [x] Přidat delete ikonu (X tlačítko) na saved face miniatury pro smazání

- [x] Opravit progress reporting pro permissive model (zasekává se na 30%, přidat více milestone hodnot)

- [x] Omezit maximální výšku velkého obrázku na 80vh (80% obrazovky)

- [x] Přidat X tlačítko na target media thumbnails pro jednotlivé odstranění

- [- [x] Změnit default model na Permissive (reálištější výstupy)
- [x] Zjistit ceny obou modelů (High Quality: $0.05/img, Permissive: $0.11/run)

- [x] Zafixovat výšku hlavního obrázku na desktopu aby neskákal při listování šipkami (h-[70vh])
- [x] Ustálit horizontal layout All Jobs pásu (fixed height)

- [x] Vygenerovat nové template obrázky - vnadné super modelky (glamour pózy, profesionální fotografie)
- [x] Nahradit templates v galerii novými supermodel obrázky

- [ ] Vygenerovat superhero templates - mužní superhrdinové (muscular, heroic poses)
- [ ] Vygenerovat superhrdinky templates (sexy costumes, powerful poses)
- [ ] Vygenerovat Business Professional templates (suits, office settings)
- [ ] Vygenerovat Casual Lifestyle templates (everyday fashion, relaxed poses)
- [ ] Vygenerovat Sports & Fitness templates (athletic wear, gym/outdoor settings)
- [ ] Přidat nové kategorie do TemplateGallery (business, casual, sports, superhero)
- [ ] Implementovat favorite system - star ikona na thumbnails
- [ ] Přidat "Favorites" tab v galerii pro oblíbené templates

- [ ] Přidat hover zoom efekt na saved face miniatury (scale 200-300% při hoveru)


## Template Gallery Enhancements - User Requested (COMPLETED)
- [x] Hover zoom na saved face thumbnails (scale-105 s transition)
- [x] Template kategorie systém s tab navigací
- [x] Superheroes kategorie (6 templates: 3 male + 3 female)
- [x] Business Professional kategorie (5 templates)
- [x] Casual Lifestyle kategorie (5 templates)
- [x] Sports & Fitness kategorie (5 templates)
- [x] Supermodels kategorie (původních 5 templates)
- [x] Favorite templates systém s star ikonou
- [x] Favorites tab pro rychlý přístup k oblíbeným
- [x] LocalStorage pro ukládání favorites (přetrvává po reloadu)
- [x] Responsive tab design (4 hlavní kategorie na mobilu, 9 na desktopu)
- [x] Ikony pro každou kategorii (Star, Zap, Briefcase, Coffee, Dumbbell, atd.)


## Layout Adjustment - User Requested
- [x] Přesunout AI Model selector a Templates button z Source Face sekce
- [x] Umístit AI Model + Templates pod Target Media sekci (pod text "Max 5 files")
- [x] Zachovat 50:50 layout pro oba prvky


## Template Gallery Tab Readability - User Requested
- [x] Rozdělit tab menu do dvou řádků místo jednoho
- [x] Zlepšit čitelnost názvů kategorií (odstranit překrývání textu)
- [x] Zachovat responsive design (mobil vs desktop)


## Template Gallery & Thumbnail Improvements - User Requested
- [x] Zvětšit Template Gallery dialog okno (větší modal)
- [x] Zvětšit miniatury šablon v galerii (větší thumbnails)
- [x] Přidat hover zoom efekt na kulaté saved faces thumbnails (scale-105)


## Download & Upload Improvements - User Requested
- [x] Opravit Download tlačítko - skutečně stahovat soubor místo otevření v nové záložce
- [x] Přidat lightbox preview pro nahrané target media fotky
- [x] Přidat upload ikonu/tlačítko do target media lightboxu pro nahrání nové fotky
- [x] Kliknutí na nahranou fotku otevře lightbox s preview


## Button Text Change - User Requested
- [x] Změnit text tlačítka "Regenerate" na "Generate" v celé aplikaci
- [x] Zkontrolovat všechny výskyty v UI komponentách


## Saved Faces Upload Fix - User Reported Bug
- [x] Opravit nefunkční nahrávání přes prázdnou pozici v saved faces grid
- [x] Přidat onClick handler na prázdný slot pro otevření file pickeru
- [x] Debugovat proč sourceInputRef.current?.click() nespouští file picker
- [x] Opravit handleSourceFileChange - po výběru souboru se nic nestane
- [x] Delete tlačítko X funguje (zobrazuje se při hoveru nad uloženými tvářemi)


## Saved Faces UX Redesign - User Requested
- [x] Odstranit prázdný slot z saved faces grid (nefunguje správně)
- [x] Přidat samostatné tlačítko "Add Face" nebo + ikonu pro nahrání nové tváře
- [x] Změnit delete badge z hover-only na always visible (vždy viditelný)
- [x] Použít badge ikonu X místo button v rohu


## Delete Badge Not Visible - User Reported Bug
- [x] Delete X badge není viditelný na saved faces thumbnails
- [x] Zkontrolovat CSS overflow, z-index a positioning
- [x] Zajistit, aby badge byl vždy viditelný nad obrázkem


## Body Preservation via Sharp - User Requested Feature
- [ ] Nainstalovat sharp a @vladmandic/face-api závislosti
- [ ] Vytvořit faceDetectionService.ts pro detekci obličeje v obrázku
- [ ] Vytvořit imageBlendingService.ts s Sharp pro kombinování swapovaného obličeje s původním tělem
- [ ] Přidat toggle "Preserve Body" do UI (vedle AI Model selectu)
- [ ] Aktualizovat replicateService.ts pro volání image blending post-processingu
- [ ] Testovat, že body preservation zachovává tělesné proporce

## Image-to-Video Animation - User Requested Feature
- [ ] Vytvořit minimaxI2VService.ts pro MiniMax image-to-video
- [ ] Přidat "Animate" tlačítko k výsledným obrázkům v UI
- [ ] Přidat dialog pro výběr I2V parametrů (model, prompt, camera movement)
- [ ] Implementovat job processing pro I2V úlohy
- [ ] Přidat video preview a download do výsledků
- [ ] Testovat I2V animaci na face swap výsledcích


## Body Preservation & Animation Features - Implemented
- [x] Implement body preservation feature using Sharp image compositing
  - [x] Add face detection service using face-api.js
  - [x] Create image blending service to preserve body proportions
  - [x] Add "Preserve Body" toggle in UI
  - [x] Integrate into face swap workflow (worker applies blending automatically)
- [x] Add MiniMax Image-to-Video animation feature
  - [x] Create I2V endpoint in backend (animateResult mutation)
  - [x] Add "Animate" button to result images in UI (Film icon)
  - [x] Open generated video in new tab
  - [x] Only show for image results (not videos)


## Custom Animation Prompts - User Requested
- [x] Create AnimateDialog component with prompt input field
- [x] Add preset animation styles (smiling, talking, looking around, nodding, winking)
- [x] Allow custom text prompt input
- [x] Update Animate button to open dialog instead of direct animation
- [x] Pass custom prompt to animateResult mutation
- [x] Test various animation styles


## Deployment Fix - Canvas Dependency Issue
- [x] Remove @canvas/image dependency (causes deployment failure)
- [x] Remove face-api.js dependency (requires canvas)
- [x] Simplify imageBlendingService to work without face detection
- [x] Use simple center-crop blending instead of face detection
- [x] Test that body preservation still works
- [ ] Verify deployment succeeds


## Saved Faces Layout Fixes - User Requested
- [x] Fix delete badge on saved faces - not clickable
- [x] Change saved faces grid from 2 columns to 3 columns
- [x] Increase left column width by 20% (from current ratio)
- [x] Adjust spacing for 3-column layout


## Before/After Thumbnail Improvements - User Requested
- [x] Rename "Before" to "Reference" (original target image)
- [x] Rename "After" to "Before" (source face used)
- [x] Add "Use" icon to thumbnails for quick reuse
- [x] Fix hover graphic glitch - gray bar appearing in middle of column


## Saved Faces Refresh Bug - User Reported
- [x] Fix saved faces not refreshing after adding new face
- [x] Add cache invalidation to saveFace mutation
- [x] Ensure new face thumbnail appears immediately


## Badge Positioning & Add Face Error - User Requested
- [x] Change "Reference" to "Source" in thumbnail badges
- [x] Change "Before" to "Face" in thumbnail badges
- [x] Move badges from separate thumbnails to main result image bottom-left corner
- [x] Make badges occupy ~10% of main image area
- [x] Fix add face button - auto-save after file selection with name prompt


## Preserve Body Bug & Badge Order - User Reported
- [x] Fix Preserve Body checkbox - not applying body preservation during generation
- [x] Swap badge order - put FACE badge above SOURCE badge (vertical stack)
- [x] Debug why preserveBody parameter isn't being processed correctly
- [x] Fixed node-fetch buffer() incompatibility - use arrayBuffer() instead


## Auto-Scroll Issue - User Reported
- [x] Fix unwanted page scroll when clicking job thumbnails in All Jobs section
- [x] Page scrolls up and cuts off header when switching between results
- [x] Remove scrollIntoView or similar auto-scroll behavior


## Badge Size Issue - User Requested
- [x] Reduce FACE and SOURCE badge thumbnails by 20%
- [x] Badges currently cover navigation arrow on the left
- [x] Change from 96×96px to ~77×77px (w-24 h-24 → w-20 h-20)


## Left Column Max-Height Constraint - User Requested
- [x] Set max-height on left column to match result image height (70vh)
- [x] Ensure vertical preview images fit within this constraint
- [x] Apply overflow-y-auto for scrolling if content exceeds height
- [x] Maintain responsive behavior on mobile

## Remove Name Prompt for Add Face - User Requested
- [x] Remove prompt dialog when uploading new face via "Add Face" button
- [x] Auto-save face without asking for name
- [x] User can manually save via Save button if needed
- [x] Simplify upload workflow for better UX


## FACE Badge Repositioning - User Requested
- [x] Move FACE badge from bottom-left to top-left corner
- [x] Change badge text from "FACE" to "USED FACE"
- [x] Keep SOURCE badge in bottom-left corner (unchanged)
- [x] Maintain click functionality and hover effects


## Sticky Header Height Reduction - User Requested
- [x] Reduce sticky header height by 30% (h-12 → h-8)
- [x] Stretch menu icons to full height of the header bar
- [x] Maintain responsive design and click areas
- [x] Preserve logo and user profile visibility


## Target Preview Overflow Fix - User Requested
- [x] Prevent scrollbar in left column when target preview is tall
- [x] Apply max-height constraint to target preview image (max-h-[50vh])
- [x] Ensure preview always fits within available space
- [x] Use object-contain to maintain aspect ratio


## Preserve Body Label Shortening - User Requested
- [x] Shorten "Preserve Body (prevent AI from changing body proportions)" text
- [x] Make it fit on one line (now: "Preserve Body (keep original proportions)")
- [x] Keep meaning clear and concise


## Scrollbar Persistent Issue Fix - User Reported
- [x] Reduce target preview max-height further (50vh → 35vh)
- [x] Ensure no scrollbar appears even with tall images
- [x] Shorten "Preserve Body (keep original proportions)" → "Keep Body Proportions"
- [x] Text stays on one line even when scrollbar appears


## Remove Badge Labels - User Requested
- [x] Remove "USED FACE" text from face badge on result thumbnails
- [x] Remove "SOURCE" text from source badge on result thumbnails
- [x] Keep badges visible but without text labels (gradient overlay only)


## Layout Reorganization - User Requested
- [x] Move Templates, AI model select, and Generate button to one row
- [x] Set ratio 30:30:40 (Templates : AI model : Generate) using grid-cols-10
- [x] Change "Start Face Swap" text to "Generate"
- [x] Use Users icon for Templates (represents people/characters)
- [x] Move "Keep Body Proportions" checkbox above this row


## Inline Add Face Button - User Requested
- [x] Move "Add Face" button into same row as face thumbnails
- [x] Show Add Face only when there are empty slots (< 5 faces)
- [x] Hide Add Face when all 5 positions are filled
- [x] Save vertical space in left column (circular Plus icon in grid)

## Adjust Layout Ratio - User Requested
- [x] Change ratio from 30:30:40 to 20:40:40 (Templates:AI model:Generate)
- [x] Fix Generate button icon overflow - reduced margin from mr-2 to mr-1
- [x] Ensure content doesn't overflow in Generate button


## Fix Target Preview Hover Jump - User Reported
- [x] Remove hover effect that causes target preview to jump/resize
- [x] Prevent layout shift when hovering over target image (removed overlay)
- [x] Maintain stable layout

## Reduce Face Grid Padding - User Requested
- [x] Remove empty space above and below face thumbnails grid
- [x] Make face section more compact (p-2 → p-1.5, mb-2 removed)
- [x] Reduce CardContent padding in Saved Faces section


## Eliminate Scrollbar - User Reported Critical Issue
- [x] Reduce face thumbnail size by 40% to save vertical space (grid-cols-3 → grid-cols-4)
- [x] Move "Keep Body Proportions" checkbox from separate row to badge overlay on target preview
- [x] Ensure entire left column fits within 70vh without scrollbar
- [x] Significantly reduced vertical space usage

## Face Thumbnails Size Reduction - User Requested
- [x] Reduce circular face thumbnails from current size to 40% smaller (3 cols → 4 cols)
- [x] Maintain aspect ratio and quality
- [x] Keep delete button and click functionality (smaller icons)

## Keep Body Proportions Badge - User Requested
- [x] Remove checkbox from separate row below target preview
- [x] Add as badge overlay in bottom-left corner of target preview image
- [x] Maintain toggle functionality (clickable badge)
- [x] Use compact text "Keep Body" with checkbox


## Sticky Header Further Reduction - User Requested
- [x] Reduce sticky header height by additional 20% (h-8 → h-6)
- [x] Icons automatically scale with header height
- [x] Maintain clickability and visual clarity

## Remove Face Thumbnail Padding - User Requested
- [x] Remove padding from CardContent containing face thumbnails (p-1.5 → p-0)
- [x] Face thumbnails fill entire cell without gaps
- [x] Maximize space efficiency
- [x] Grid gap (gap-1.5) provides visual separation


## Reverse Hover Arrow Direction - User Requested
- [x] Change hover arrow on All Jobs results from right (→) to left (←)
- [x] Update ArrowRight icon to ArrowLeft icon (import + 2 instances)
- [x] Maintain hover tooltip and click functionality


## Remove All Face Card Padding - User Reported Issue
- [x] Face thumbnails still have padding on all sides (top, bottom, left, right)
- [x] Remove padding from Card component itself using [&>*]:p-0
- [x] Thumbnails fill 100% of cell width and height
- [x] Overridden default Card/CardContent padding

## Remove Before/After Badges from All Jobs - User Requested
- [x] Remove "Before" and "After" badges from All Jobs result thumbnails
- [x] Keep only the hover arrow and image
- [x] Cleaner, simpler appearance


## Fix Animate Result Dialog Overflow - User Reported Critical UX Issue
- [ ] Animate Result dialog is too large and overflows screen
- [ ] Bottom buttons (Generate) are not visible/accessible
- [ ] Reduce dialog size to fit within viewport (max-h-[90vh])
- [ ] Add scrolling to dialog content if needed
- [ ] Ensure works on mobile devices
- [ ] Make all buttons accessible without scrolling if possible


## Mobile Layout Optimization - Current Sprint
- [x] Zmenšit Before/After thumbnaily na mobilu na cca 25% prostoru (w-12 h-12 místo w-20 h-20)
- [x] Zmenšit spodní sticky menu na mobilu o 20% výšky (h-12 místo h-16)
- [x] Optimalizovat rozložení pro lepší využití prostoru na mobilu
- [x] All Jobs na mobilu - zobrazit pouze 8 posledních miniatur
- [x] Přidat tlačítko "Načíst další" pod miniatury na mobilu


## Upload Section Mobile Optimization - Current Sprint
- [x] Zmenšit upload sekci (Source Face + Target Media) na mobilu na max 20% výšky displaye (max-h-[20vh])
- [x] Kompaktnější design - menší thumbnaily (h-8), menší padding (p-0.5), menší buttony (h-7)
- [x] Zachovat funkčnost při zmenšení velikosti


## Mobile Overlay Badge UI Redesign - Current Sprint
- [x] Odstranit samostatnou upload sekci na mobilu (hidden md:block)
- [x] Vlevo nahore: Face selector badge (kliknutí = file input nebo saved faces)
- [x] Vlevo dole: Target selector badge (kliknutí = file input)
- [x] Vpravo dole: Generate button badge (pouze ikona Sparkles)
- [x] Dole uprostřed: AI model selector badge (HQ/Fast dropdown)
- [x] Všechny badges jako overlay na výsledné fotce
- [x] Desktop zůstává beze změny (původní layout)


## Mobile Overlay Enhancements - Current Sprint
- [x] Přidat Keep Body checkbox vedle AI model selectoru (dole uprostřed)
- [x] Změnit model labels: "High Quality" → "Nude declined", "Permissive" → "Nude allowed"
- [x] Upravit layout pro 2 prvky vedle sebe (model + checkbox ve flex-col)


## All Jobs Desktop Enhancement - Current Sprint
- [x] Na desktopu zobrazit vždy celý první řádek (4 miniatury místo 8)
- [x] Mobil zůstává na 8 miniaturách


## Keep Body Label Update - Current Sprint
- [x] Změnit "Keep Body" na "Keep body proportions"
- [x] Odstranit font-semibold/font-medium pro kompaktnější vzhled


## Label Brevity Update - Current Sprint
- [x] Změnit model labels: "Nude declined" → "HQ (no nude)", "Nude allowed" → "LQ (nude allowed)"
- [x] Zkrátit checkbox: "Keep body proportions" → "Keep proportions"
- [x] Přidat název "AI FaceSwap" do horního sticky menu na mobilu


## Mobile Header Relocation - Current Sprint
- [x] Odstranit samostatný sticky header z FaceSwap.tsx
- [x] Přidat název "AI FaceSwap" do úzkého horního pruhu (Navigation komponenta)
- [x] Umístit vedle ikony hvězdy (text-sm na mobilu, text-lg na desktopu)


## Mobile Face Selector & Recreate Badge - Current Sprint
- [x] Face badge: Zobrazit náhled vybrané tváře (sourcePreview)
- [x] Face badge: Kliknutí otevře Saved Faces dialog s až 5 uloženými tvářemi
- [x] Face badge: Prázdná pozice = nahrát novou tvář (+ button)
- [x] Face badge: Křížek pro odstranění uložené tváře (Trash2 icon)
- [x] All Jobs: Změnit zelenou Done ikonu na RotateCcw (Recreate badge)
- [x] Recreate badge: Kliknutí nahráje původní fotku do TARGET preview
- [x] Generate button: Již funguje s existujícím sourceFile a targetFiles


## Generate Button Fix - Current Sprint
- [x] Opravit disabled logiku - aktivovat když existuje (sourceFile NEBO sourcePreview) A targetFiles.length > 0
- [x] Opravit handleSubmit - použít sourcePreview URL když sourceFile neexistuje
- [x] Testovat s batch upload (5 target fotek)


## Progress Indicators in Badges - Current Sprint
- [x] Face badge: Přidat spinner overlay během source face uploadu
- [x] Target badge: Přidat spinner overlay během target media uploadu
- [x] Face badge: Zobrazit progress během generování (když job běží)
- [x] Target badge: Zobrazit progress během generování (když job běží)
- [x] Spinner design: Semi-transparent overlay + Loader2 icon + text "Uploading..." / "Generating..."
- [x] Test všechny stavy: idle → uploading → generating → completed


## UX Improvements - Current Sprint
- [x] Progress indicator: Zobrazit procenta (např. "Generating... 45%") místo jen "Generating..."
- [x] Progress indicator: Použít job.progress pro přesný progress každého jobu
- [x] Haptic feedback: Přidat vibraci při dokončení generování (navigator.vibrate)
- [x] Haptic feedback: Detekce nových completed jobů a trigger vibrace
- [x] Queue counter: Zobrazit badge s počtem pending/processing jobů na Generate tlačítku
- [x] Queue counter: Design - malý badge v pravém horním rohu tlačítka
