# Project TODO

## CORS Fix for Face Detection - COMPLETED
- [x] Update detectFaces() to use proxy endpoint for CloudFront URLs
- [x] Test face detection with existing results from All Jobs grid
- [ ] Verify Protect mode works after clicking thumbnails (waiting for user test)

## Face Detection Improvements - Current Session
- [x] Fix MediaPipe model loading error (404) - changed to short-range model
- [x] Fix CORS error when loading images from CloudFront URLs
- [x] Add proxy endpoint usage for remote image URLs
- [ ] Test with real nude images to verify Protect mode bypasses content filter

## Previous Sessions (All Completed)
See git history for complete feature list.

## Lightbox Favorite Icon - Current Session
- [ ] Add Favorite star icon to lightbox toolbar (top-right area)
- [ ] Implement toggle favorite functionality in lightbox
- [ ] Update favorite status in database when clicked
- [ ] Show filled/unfilled star based on current favorite status
- [ ] Test favorite toggle from lightbox view

## Blob URL Timing Fix - Current Session
- [ ] Fix blob URL being revoked before Image element loads it
- [ ] Move URL.revokeObjectURL to after MediaPipe detection completes
- [ ] Test face detection works with CloudFront URLs

## TypeScript Errors - Current Session
- [x] Fix favoriteCategory property missing in job type
- [x] Fix removeFavorite mutation - needs category parameter or make it optional
- [ ] Test favorite toggle in lightbox after fixes

## Lightbox Index Sync - Current
- [x] Fix lightbox opening with wrong image when clicking large result photo
- [x] Sync currentResultIndex with completedJobs index for lightbox
- [x] Use completedJobs array consistently for lightbox navigation

## Tablet Responsive Layout - Current
- [x] Fix generated photo overflowing viewport on tablet (768px-1024px)
- [x] Change from 2-column to single column layout on tablet
- [x] Add max-width constraint to result preview image
- [ ] Test on tablet breakpoint (768px-1024px)
