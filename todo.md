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
