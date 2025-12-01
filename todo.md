# Project TODO

## Protect Mode - Oval Face Crop - COMPLETED
- [x] Reduce crop margin from 25% to 15% (just face + ears + hair)
- [x] Change crop shape from rectangle to oval/ellipse
- [x] Add feathering to oval edges for smooth blending (radial gradient 85-100%)
- [ ] Test with nude photos to verify body is completely hidden (waiting for user test)

## CORS Fix for Face Detection - COMPLETED
- [x] Update detectFaces() to use proxy endpoint for CloudFront URLs
- [x] Test face detection with existing results from All Jobs grid
- [x] Verify Protect mode works after clicking thumbnails

## Face Detection Improvements - COMPLETED
- [x] Fix MediaPipe model loading error (404) - changed to short-range model
- [x] Fix CORS error when loading images from CloudFront URLs
- [x] Add proxy endpoint usage for remote image URLs
- [x] Test with real nude images to verify Protect mode bypasses content filter

## Lightbox & TypeScript - COMPLETED
- [x] Fix favoriteCategory property missing in job type
- [x] Fix removeFavorite mutation - needs category parameter or make it optional
- [x] Fix lightbox opening with wrong image when clicking large result photo
- [x] Sync currentResultIndex with completedJobs index for lightbox

## Tablet Responsive Layout - COMPLETED
- [x] Fix generated photo overflowing viewport on tablet (768px-1024px)
- [x] Change from 2-column to single column layout on tablet
- [x] Add max-width constraint to result preview image

## Grid Layout Fix - TODO
- [ ] Change 2-row grid to fill by rows (left-to-right) instead of columns (top-to-bottom)
- [ ] Newest jobs should appear in top-left, not bottom-left
- [ ] Use grid-flow-row instead of grid-flow-col

## Processing Timeout Investigation - TODO
- [ ] Check why jobs freeze at "Processing" even for non-nude images
- [ ] Review Replicate API timeout settings
- [ ] Check webhook delivery logs
- [ ] Add timeout recovery mechanism
- [ ] Investigate if Protect mode causes additional delays

## Result Preview Layout - Desktop - COMPLETED
- [x] Change large photo height to 80vh (80% of viewport)
- [x] Change thumbnail grid to 20vh (20% of viewport)
- [x] Change grid from 2 rows to 3 rows
- [x] Re-enable scrollbar for thumbnail grid overflow (removed overflow-y-hidden)
- [x] Ensure first row of thumbnails is visible below large photo

## All Jobs Grid - Show Processing & Completed - COMPLETED
- [x] Filter displayJobs to show only completed jobs
- [x] Fix: Show processing jobs (with progress), hide only pending jobs
- [x] Keep completed jobs visible with thumbnails

## Protect Mode Content Warning - COMPLETED
- [x] Investigate why API still blocks content even with face-only crop
- [x] Check if face detection is working correctly
- [x] Verify only face region is being sent to API
- [x] Root cause: Oval mask uses transparency (opacity:0), API sees body under mask
- [x] Fix: Changed oval mask to use black background with flatten() - body completely hidden

## Result Preview Layout Fix - COMPLETED
- [x] Fix large photo height to be exactly 80vh (80% of viewport)
- [x] Fix thumbnail grid height to be exactly 20vh (20% of viewport)
- [x] Ensure proper spacing and no overflow
- [x] Fix image to fill full height of container (changed object-contain to object-cover)

## Layout Height Adjustment - COMPLETED
- [x] Reduce large photo height from 80vh to 75vh to prevent thumbnail grid cutoff

## Face Selection Bug Fix - COMPLETED
- [x] Fix face reverting to original when clicking job then selecting new face
- [x] Prevent useEffect from overriding user-selected source face
- [x] Add condition to skip sync when user manually selects face (only sync if !sourceFile && !sourcePreview)

## Auto-Cleanup Feature
- [x] Create cleanup function in db.ts to delete pending/processing jobs older than 1 hour
- [x] Add scheduled cleanup job (every 15 minutes)
- [x] Add cleanup on server startup
- [ ] Test cleanup functionality

## Protect Mode HQ Model Bug - COMPLETED
- [x] Investigate why Protect mode fails with HQ (Fast) model
- [x] Root cause: Multi-face processing was called AFTER API call, so nude content hit NSFW filter first
- [x] Move multi-face processing BEFORE API call (Step 3.5 instead of Step 6.5)
- [x] When Protect enabled: crop face → swap → composite → upload → complete (skip normal API call)
- [x] Remove old multi-face processing code after API call
- [x] Write test to verify Protect mode bypasses NSFW filter (replicateWorker.protect.test.ts)
- [x] All 3 tests passed: Protect mode enabled, fallback on failure, skip when disabled
- [ ] Test with real nude content to confirm fix works (requires user testing)
- [ ] ❌ USER TESTING FAILED: Nude photo + Protect + HQ → still got "Content Warning"
- [ ] Debug: Check if faceBoxes is being saved to database when Protect is enabled
- [ ] Debug: Check if worker detects faceBoxes and triggers multi-face processing path
- [ ] Debug: Add detailed logging to trace execution flow in worker
- [ ] Fix: Ensure frontend sends faceBoxes array when creating job with Protect enabled

## 4K Monitor Thumbnail Grid Fix - COMPLETED
- [x] Increase padding-top in thumbnail grid container to prevent first row cutoff on 4K displays
- [x] Increase max-height from 40vh to 45vh for better visibility

## Progress Bar Improvement - COMPLETED
- [x] Current issue: Progress freezes at 50% and 60%, looks stuck
- [x] Analyze worker progress update points (currently: 10%, 30%, 40-60%, 70%, 80%, 85%, 90%, 100%)
- [x] Implement smoother progress updates with smaller increments (every 5-10%)
- [x] Add simulated progress during long API calls to show activity
- [x] Ensure full 0-100% range is utilized (5% → 15% → 20% → 25-65% → 70% → 75% → 82% → 88% → 100%)
- [x] Changed interval from 10s to 3s for more frequent updates
- [x] Added progress callbacks to Protect mode face processing
- [ ] Test with real job to verify smooth visual feedback (waiting for user test)

## Progress Preview Enhancements - TODO
- [x] Add mini progress bar to All Jobs thumbnails (show percentage during processing)
- [x] Implement batch progress counter above grid (e.g., "Processing 3/10 images")
- [x] Show progress percentage on thumbnail overlay
- [x] Add visual distinction between pending (no progress) and processing (with progress)
- [ ] Test with single and batch uploads

## Progress Race Condition Bug - COMPLETED
- [x] Fix progress jumping backwards (60% → 30%) due to race condition
- [x] Ensure progress updates are monotonic (only increase, never decrease)
- [x] Add progress validation in db.ts (skip update if new value < current value)
- [x] Simulated progress loop already stops when API completes (clearInterval in finally block)
- [ ] Test with multiple concurrent jobs (waiting for user test)

## Protect Mode Face Swap Failure - COMPLETED
- [x] Face swap not working in Protect mode - shows original face instead of swapped
- [x] Issue: Cropped face region too small for API to detect/swap properly (15% margin)
- [x] Solution: Increased crop margin from 15% to 60% for better face detection context
- [ ] Test with real nude content to verify fix works (waiting for user test)
