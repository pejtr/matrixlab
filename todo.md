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
