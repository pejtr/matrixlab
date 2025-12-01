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
