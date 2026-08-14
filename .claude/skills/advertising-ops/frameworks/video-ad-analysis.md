# Video Ad Analysis Framework

How Advertising Ops actually "watches" a video ad from the Meta Ad Library.

## Purpose
When the user audits video ads, the pipeline must look inside the video, not just read its copy. This framework covers downloading the creative and turning it into something an LLM can actually review.

## Core Concepts

### The hard constraint
An LLM cannot watch a video natively. The only way to review a video ad is to sample it into still frames and read those frames as images, plus transcribe the audio for the spoken script. Frames + transcript IS the audit.

### Step 1 — Get the video file
The actor returns a CDN media URL per ad when `resolveSnapshotUrls: true`. Download it:
```bash
curl -L "{cdn_video_url}" -o "{videos-dir}/ad-{n}.mp4"
```
If a direct URL is blocked, fall back to `yt-dlp "{snapshot_url}" -o "{videos-dir}/ad-{n}.%(ext)s"`.

### Step 2 — Extract frames with ffmpeg
ffmpeg is required. Check it first (`ffmpeg -version`); if missing, tell the user `brew install ffmpeg`.

Two sampling modes:
- **Scene-change (preferred for hook/structure analysis)** — grab only the cuts:
  ```bash
  ffmpeg -i "ad-{n}.mp4" -vf "select='gt(scene,0.4)',showinfo" -vsync vfr "frames/ad-{n}-scene-%03d.png"
  ```
- **Fixed interval (simple, even coverage)** — one frame per second:
  ```bash
  ffmpeg -i "ad-{n}.mp4" -vf fps=1 "frames/ad-{n}-%03d.png"
  ```
Always also grab the first 2 seconds densely (the hook): `-t 2 -vf fps=4`.

### Step 3 — Transcribe the audio (the script)
Most of a video ad's persuasion is spoken. Pull the audio and transcribe:
```bash
ffmpeg -i "ad-{n}.mp4" -vn -acodec mp3 "audio/ad-{n}.mp3"
```
Then transcribe with whatever is available (local Whisper, an API, or yt-dlp auto-captions if present). Capture the voiceover verbatim where possible.

### Step 4 — Review
Read the extracted frames as images and the transcript as text. For each video ad capture: the hook (first 3 seconds), the visual structure (cuts, pacing, pattern interrupts), on-screen text, the spoken script, and the CTA. These insights feed the research report and the CMO brief.

### Alternative — Higgsfield video analysis
For a faster, model-driven read instead of manual frame review, use the Higgsfield MCP:
- `mcp__higgsfield__video_analysis_create` then `mcp__higgsfield__video_analysis_status` — upload the video, get an analysis.
- `mcp__higgsfield__virality_predictor` — score hook strength, attention, and retention risk.
Use this as a complement, not a replacement; frame extraction stays the precise default.

## Examples
- A 30s video ad → scene-change extraction yields ~8 cut frames + a 4fps hook burst + an mp3 transcript. Review reveals: hook is a pattern-interrupt question, three testimonial cuts, CTA card at 0:27.

## Anti-Patterns
- "Reviewing" a video from its copy alone (you are blind to the actual creative).
- Extracting one frame and calling it a review (misses the hook and the arc).
- Skipping the transcript (the script carries the offer).
- Forgetting the ffmpeg check before extraction.
