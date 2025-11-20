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
