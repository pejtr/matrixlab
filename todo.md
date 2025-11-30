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

## Fix Model Labels and All Jobs Grid - Current Session
- [x] Fix swapped model labels (HQ should be slower/better quality/no nude, LQ should be fast/nude allowed)
- [x] Add Load More button to All Jobs grid in Detail View (both Detail and Grid views)
- [x] Test that more thumbnails load when clicking Load More

## Fix Model Labels Again and Action Buttons - Current Session
- [x] Swap model labels back (HQ = fast/no nude, LQ = slower/better quality/nude allowed)
- [x] Swap model badge icons back to match correct labels (HQ=⚡, LQ=🛡️)
- [x] Move action buttons (Download, Regenerate, Crop, etc.) to bottom-center on desktop and tablet
- [x] Fix Download button functionality with proper CORS handling and timeout
- [x] Test all fixes

## Fix Target Preview State After Job Deletion - Current Session
- [x] Clear target files and previews when deleting the last/only result
- [x] Prevent stale target previews from previous batch uploads
- [x] Test with batch upload (multiple targets) → delete all results → verify clean state

## Add Favorite Count Badge to Favorites Tab - Current Session
- [x] Add red badge with favorite count to Favorites tab (⭐ icon)
- [x] Match styling of other category badges
- [ ] Test badge updates when adding/removing favorites

## Fix Lightbox Vertical Centering - Current Session
- [x] Center lightbox image vertically in viewport
- [x] Make image fill maximum viewport height (max-h-screen)
- [x] Test with different image aspect ratios

## Fix Target Preview Navigation and Label - Current Session
- [x] Fix target preview not updating when using arrow buttons to navigate
- [x] Add automatic target preview sync when currentResultIndex changes
- [x] Change "Keep proportions" label to "Protect" to save space
- [x] Test arrow navigation updates target preview correctly

## All Jobs Grid - Single Row Horizontal Scroll - Current Session
- [x] Change All Jobs grid from multi-row to single-row layout on desktop
- [x] Add horizontal scrolling (overflow-x-auto)
- [x] Limit viewport height to one row of thumbnails
- [x] Fix infinite scroll - show all jobs by default (999 initial count)
- [x] Ensure all jobs are accessible via horizontal scroll
- [x] Remove Load More button (not needed with horizontal scroll)

## Mobile UI Fixes - Current Session
- [x] Add TARGET badge back to mobile overlay (bottom-left position)
- [x] Move action buttons from bottom-center to top-right of result image on desktop/tablet
- [x] Ensure TARGET badge opens file picker for target upload
- [x] Keep action buttons at bottom-center on mobile for better thumb reach

## Action Buttons Redesign - Current Session
- [x] Move all 7 action icons from bottom-center to top of result image
- [x] Add Upload target icon as first button (before Download)
- [x] Ensure Upload button opens file picker for target media
- [x] Keep all buttons visible and accessible on mobile
- [x] Test icon arrangement and functionality

## Mobile UI Improvements - Current Session
- [x] Move badge icons (Upload, Download, Crop, etc.) ABOVE main image instead of overlaying it
- [x] Stretch main result image to full height without gaps top/bottom
- [x] Reduce AI model selector width by 50%
- [ ] Fix NotFoundError on page refresh (removeChild error in routing/navigation)

## Mobile Bug Fixes - Current Session
- [x] Fix mobile layout overflow (wider than viewport)
- [x] Add TARGET badge thumbnail to main result image (missing on mobile)
- [x] Add Generate button to mobile overlay (bottom-right corner missing)

## Checkbox Visibility Bug - Current Session
- [x] Fix checkbox visibility - checkboxes should only appear after clicking "Select All" button (Export mode)
- [x] Hide delete icons when Export mode is active (prevent conflicts with checkboxes)

## Mobile Display Bug - Current Session
- [x] Fix main result image not displaying on mobile devices (added explicit height to relative parent)
- [x] Debug why image container has height but image is not visible (parent div lacked height)
- [x] Add h-[60vh] md:h-full to relative container wrapping the image
- [x] Verify object-cover and positioning classes work on mobile

## Mobile Navigation Overflow - Current Session
- [x] Fix action buttons row exceeding viewport width on mobile
- [x] Make button container responsive (prevent horizontal scroll)
- [x] Reduce button sizes (h-7 w-7 on mobile, h-8 w-8 on desktop) and gaps (gap-1 on mobile)
- [x] Test that all buttons remain accessible and visible

## Lightbox Mobile Fullscreen - Current Session
- [x] Make lightbox image fill entire viewport on mobile (100vw × 100vh)
- [x] Remove max-width/max-height constraints on mobile (px-0 py-0 on mobile)
- [x] Use object-cover to fill screen completely (w-full h-full object-cover on mobile)
- [x] Keep desktop centered with padding (md:px-24 md:py-20 md:object-contain)

## Mobile UI Overflow Fixes - Current Session
- [x] Fix lightbox image sizing - too stretched on mobile (adjusted to max-h-[85vh])
- [x] Fix download button not working (added CORS proxy endpoint)
- [x] Fix TARGET badge upload on mobile - added input reset after file selection
- [x] Reduce Favorites tabs to icon-only display (removed text labels, show only Bookmark icons)
- [x] Reduce number of Favorites categories to 3 (was 5, now 3)
- [x] Move AI model selector from bottom-20 to bottom-2 (near bottom of image)
- [x] Make AI model selector 50% narrower (w-1/2 class)
- [x] Test on mobile Chrome to verify all fixes work

## Desktop Layout Fixes (URGENT) - Current Session

- [x] Fix left column not showing on desktop (hidden by mobile changes)
- [x] Restore two-column layout on desktop (left: controls, right: results)
- [x] Fix slow loading and empty layout on page refresh
- [ ] Verify responsive breakpoints work correctly (mobile vs desktop)
- [ ] Test on desktop Chrome to ensure all controls visible

## Desktop Main Image Zoom Fix - Current Session

- [x] Fix main result image extremely zoomed on desktop (should match left column height)
- [x] Change object-cover to object-contain for proper aspect ratio
- [x] Set max-height to match left column (70vh)
- [x] Ensure image doesn't overflow viewport

## Performance Optimization - Slow Refresh Fix - Current Session

- [x] Reduce polling interval from 5s to 10s (or disable when no active jobs)
- [x] Add staleTime to tRPC queries to enable caching
- [ ] Limit initial jobs query to last 50 results (pagination)
- [x] Disable refetchOnMount for completed jobs
- [ ] Add loading skeleton instead of blank screen during auth check
- [x] Optimize saved faces query with proper caching

## Desktop Grid Layout Fix - Current Session

- [x] Fix grid proportions - right column too wide, image not visible
- [x] Change grid from 1.2fr_3.8fr to balanced ratio (320px_1fr)
- [x] Ensure result image displays properly in right column
- [ ] Add background color to right column container for visibility

## Desktop Layout Critical Fixes - Current Session

- [x] Fix main result image not displaying in right column (empty blue space)
- [x] Fix horizontal scrollbar - page wider than viewport
- [x] Add overflow-x-hidden to prevent horizontal scroll
- [x] Ensure right column displays result image properly
- [x] Debug why result image container is empty

## Main Image Display Fix - Critical - Current Session

- [x] Show target image (before) when job is pending/processing
- [x] Show result image (after) when job is completed
- [x] Fix "No Results Yet" showing when jobs exist
- [x] Change completedJobs filter to include all jobs (not just completed)
- [x] Display target preview for pending jobs in main view
- [x] Ensure clicking thumbnails updates main image display


## Thumbnail Click Handler Fix - Current Session

- [x] Investigate why clicking All Jobs thumbnails doesn't update main image
- [x] Fix onClick handler to properly update currentResultIndex
- [x] Ensure clicked thumbnail's job is displayed in main view
- [x] Test navigation with arrow buttons after thumbnail click


## Target Preview Revert Bug - Current Session

- [x] Investigate why target preview reverts to original after 2 seconds when uploading new target
- [x] Find useEffect or state sync causing the automatic revert
- [x] Fix state management to persist user-uploaded target preview
- [x] Test target upload and verify preview stays updated


## Main Result Image Not Displaying - Current Session

- [x] Investigate why main result image is empty when clicking thumbnails
- [x] Check if previous target preview fix broke main image rendering
- [x] Fix main result image display logic
- [x] Test clicking thumbnails shows correct result in main view


## Main Result Image Empty on Page Load - Current Session

- [x] Investigate why main result image is empty when page loads with existing jobs
- [x] Check if currentResultIndex=0 points to wrong job (pending instead of completed)
- [x] Fix initial state to show first completed job by default
- [x] Test page load displays first result correctly


## Protect Feature Enhancement - Face-Only Processing with Multi-Face Support

- [x] Integrate MediaPipe Face Detection in frontend (browser-based)
- [x] Detect up to 2 faces in target image before upload
- [x] Send face coordinates array to backend with image
- [x] Backend: Crop each detected face with 150% margin
- [x] Backend: Send each cropped face to Replicate API separately
- [x] Backend: Composite all swapped faces back to original positions
- [x] Test with single face photos (nude + normal)
- [x] Test with 2-face photos (group shots)
- [x] Update UI to show face count detection ("1 face detected", "2 faces detected")

## Face Upload Bug Fix - Current Session
- [x] Fix Add Face button not showing for new users with no saved faces
- [x] Show 5 empty slots with Plus icon when user has 0 saved faces
- [x] Ensure clicking empty slot triggers file picker for face upload
- [x] Fix grid layout to always show available upload slots

## Download Icon on Thumbnails - Current Session
- [x] Add download icon to All Jobs grid thumbnails
- [x] Show download icon on hover over completed job thumbnails
- [x] Implement click handler to download result directly from thumbnail
- [x] Test download functionality on both desktop and mobile

## Large Monitor Grid Width Fix - Current Session
- [x] Add max-width constraint to All Jobs grid container (prevent thumbnails from being too wide)
- [x] Limit thumbnail size to reasonable dimensions on 2K/4K monitors
- [x] Test responsive behavior on different screen sizes

## Main Result Image Not Displaying After Thumbnail Click - Current Session
- [x] Debug why main result image is empty when clicking All Jobs thumbnails
- [x] Fix currentJob and displayJobs index synchronization
- [x] Ensure resultMediaUrl is properly loaded and displayed
- [ ] Test thumbnail click on both desktop and mobile

## Current Issue - Face Upload Not Working
- [x] Debug why uploaded face appears briefly then disappears (auto-save was removed)
- [x] Fix face upload handler to save face properly (added S3 upload + DB save)
- [x] Ensure uploaded face shows in left grid thumbnails (invalidate cache after save)
- [ ] Test face upload end-to-end

## Current Issue - Generate Uses Wrong Target
- [ ] Debug why Generate button uses old target instead of newly selected one
- [ ] Fix Generate button to use correct target from current state
- [ ] Test that clicking thumbnail + Generate uses that target

## Current Issue - Missing Bookmark Icon
- [ ] Add bookmark icon back to thumbnail images in bottom gallery
- [ ] Ensure bookmark icon is visible and clickable

## Current Issue - Video Preview Shows Spinner
- [x] Fix video preview - show video thumbnail instead of spinner when video is uploaded as target
- [x] Generate video thumbnail from first frame
- [x] Display thumbnail in target preview area

## Video Upload Error - Current Session
- [x] Fix "Unexpected token '<', "<!doctype "... is not valid JSON" error when uploading videos
- [x] Added better error handling to show exact error message
- [x] Added content-type validation before parsing JSON
- [x] Verified upload endpoint exists and is properly routed
- [ ] Test video upload end-to-end with user
- [ ] Debug actual error from console logs

## Batch Upload Limit Increase - Current Session
- [x] Increase batch upload limit from 5 to 50 files
- [x] Update validation in handleSubmit
- [x] Update validation in processTargetFiles
- [x] Update UI text "Max 5 files" to "Max 50 files"
- [x] Update file counter display to show "/50" instead of "/5"

## Protect Mode Fix & Multi-Face Swap - Current Session
- [x] Analyze current Protect implementation (imageBlendingService.ts)
- [x] Implement MediaPipe face detection in browser for precise face cropping
- [x] Update worker to crop only face regions (with margin) before sending to API
- [x] Implement multi-face processing (detect up to 5 faces)
- [x] Process each face separately via Replicate API
- [x] Composite all swapped faces back to original positions
- [ ] Test with nude photos to verify body is NOT sent to API
- [ ] Test with multi-face photos (group photos)
- [ ] Verify no desexualization occurs with Protect enabled

## Large Monitor Layout Fix - Current Session
- [x] Change main result image max-height from 70vh to 80vh
- [ ] Test on large monitors to verify no overflow

## 4K Monitor Portrait Image Fix - Current Session
- [x] Change object-cover to object-contain for proper aspect ratio (already using object-contain)
- [x] Add max-height constraint (max-h-screen) to prevent portrait images from overflowing
- [ ] Test on 4K monitor to verify entire image fits in viewport

## Remove Empty Space Around Result Image - Current Session
- [x] Change object-contain to object-cover for result images
- [x] Ensure image fills entire container without gaps
- [ ] Test on different aspect ratios


## Reduce Result Image Height to 60vh - Current Session
- [x] Change main result image height from h-[80vh] to h-[60vh] on desktop
- [x] Ensure All Jobs grid below image remains visible
- [x] Verify no vertical scrollbar appears
- [x] Test that image takes maximum 80% of page height


## Face Detection Error Fix - Current Session
- [x] Fix error handling in useFaceDetection.ts (img.onerror returns Event, not Error)
- [x] Improve error logging to show readable error messages
- [x] Verify lightbox click handler is present on main result image (already working)


## Download Failed Error - Current Session
- [x] Analyze download handler in FaceSwap.tsx line 1624
- [x] Check CORS configuration for S3 URLs
- [x] Fix fetch error with proper error handling
- [x] Test download functionality with completed jobs
