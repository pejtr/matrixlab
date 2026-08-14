<purpose>
Run the full Advertising Ops pipeline: scope the business, scrape long-running winning ads from the Meta Ad Library via Apify, rank and template the top performers into a research report, run a CMO creative brief, then generate aligned copy + image/video variations and house each in its own creative folder. This is the only task; the entry point routes here on every invocation.
</purpose>

<user-story>
As a business owner or marketer, I want to find ads that have been running long enough to be proven winners and turn them into new launch-ready creative, so that I template what already works instead of guessing.
</user-story>

<when-to-use>
- Every time the user runs `/advertising-ops`
- The pipeline is sequential — do not skip steps, and wait for the user at every question group
</when-to-use>

<steps>

<step name="scope_brand" priority="first">
Establish the business scope before anything else.

1. Look for an existing brand kit, in this order:
   - `context/brand-scope.md` inside this skill (a prior run)
   - Project `.claude/brand-context-*.md` files
   - Project root `CLAUDE.md` or a brand-kit / brand-guide file
   - Output from the `brand-kit` skill if present

2. **If a brand kit or scope is found:** read it, summarize back the business, keywords, and ICP you extracted, and ask: "Is this still accurate, and is there anything to add for this campaign?"

3. **If nothing is found:** interview the user, one question at a time, waiting for each answer:
   - "What kind of business are you running?"
   - "What are some keywords for your business?" (these seed the ad search)
   - "Who is your ICP (ideal customer profile)?"

4. Write or update `context/brand-scope.md` using the captured answers. This is the scope of record for the rest of the run.

**Wait for the user to confirm scope before continuing.**
</step>

<step name="connect_apify">
Make sure the Apify MCP and the scraper actor are available.

Load @frameworks/apify-ad-scraping.md.

1. Check whether the Apify MCP is connected (tools named `mcp__apify__*` are available).

2. **If NOT connected**, direct the user:
   - "Go to Apify and connect the same MCP we use: `@apify/actors-mcp-server` (https://github.com/apify/actors-mcp-server). Register it in `.mcp.json` as a stdio server (`npx -y @apify/actors-mcp-server`) with your `APIFY_TOKEN`. Grab the token at https://console.apify.com/settings/integrations (Personal API tokens)."
   - Have them connect it, then re-check before continuing.

3. Confirm the actor we will use: `brilliant_gum/facebook-ads-library-scraper` (it computes each ad's run time and supports a date filter, which is what makes the long-runner detection clean).

**Wait until the MCP is connected before continuing.**
</step>

<step name="configure_search">
Agree on the search parameters with the user. Ask as one grouped set, confirm each.

1. **Keywords / search terms** — propose terms from the brand scope and ask the user to confirm or edit. These become `searchTerms`.

2. **Interview style** — confirm how interactive they want the rest of the run (quick defaults vs. confirm every step).

3. **Minimum run time** — recommend a minimum of 2 months, ideally 3, because longevity plus active status is the winner signal. Ask them to agree on a number, with a floor of 2 months. Convert to the actor filter:
   - `endDate` = today minus (months * ~30) days, formatted YYYY-MM-DD (started on or before that date)
   - `adActiveStatus` = "ACTIVE" (still running now)
   - Started long ago AND still active = has run that long.

4. **Media type** — ask: "Are we reviewing image ads or video ads?" Set the filter accordingly. If **video**, the ads will be downloaded and frame-audited in a later step, so also ask where to store the downloaded videos and extracted frames (default: a `video-audit/` folder next to the report).

5. **How many ads** — ask: "Do you want a list of 10, 15, 20, 25, or 30?" Default 10. We will keep the most engagement among the long-runners.

6. **Report file** — first read `context/output-paths.md`. If a **Report path** is already saved there, reuse it (a quick "still dropping the report here?" confirm is enough, do not force them to re-specify). If it is `[Not yet set]`, ask where to place the markdown report, then **write that path back into `context/output-paths.md`** under "Report path" so every future run reuses it automatically.

**Wait for confirmation of all parameters before scraping.**
</step>

<step name="scrape_and_rank">
Run the scrape and build the winners list.

1. Call the actor `brilliant_gum/facebook-ads-library-scraper` with the agreed input. Always `fetch-actor-details` first if you need the exact schema. Example input shape:
   ```json
   {
     "searchTerms": ["{keyword-1}", "{keyword-2}"],
     "countries": ["US"],
     "adActiveStatus": "ACTIVE",
     "endDate": "{today-minus-months}",
     "maxAds": {N-plus-buffer},
     "resolveSnapshotUrls": true
   }
   ```
   Pull a buffer larger than the requested count so filtering still leaves enough.

2. From the results: keep only the requested media type, then select the requested number of ads with the **most engagement**. Sort the final list by run duration from **least to longest** (shortest-running winner first, longest last), as specified.

3. Capture for each ad, including full source attribution so every winner is traceable back to who ran it:
   - **Advertiser / page name** (the brand running the ad)
   - **Page link** (the advertiser's Facebook/Instagram page URL)
   - **Ad Library link** (the ad's snapshot/permalink) and the **ad archive ID**
   - Run duration, engagement signal, media type
   - **The full ad copy, verbatim** — primary/body text, headline, link description, and the CTA button label. This is mandatory: every winner in the report carries its exact ad text, never a paraphrase or summary. For video ads, the on-screen and spoken copy from the teardown is captured in addition to this written ad copy.
   - The creative URL (image or video CDN link, returned because `resolveSnapshotUrls: true`)
   - The landing page URL
   The actor returns URLs and metadata, never the binary files.

4. **See the creatives.** The scrape alone does not let you view the ad; download what you need:
   - **Image ads** — download each image creative to the report folder (`curl -L "{image_url}" -o "{report-dir}/creatives-pulled/ad-{n}.jpg"`) and Read it so the teardown reflects the actual visual (layout, hook text, offer, brand cues), not just the copy.
   - **Video ads** — handled in the next step (download + ffmpeg frames + transcript).

5. Build the research report using @templates/ad-research-report.md and write it to the path from the previous step. The winners table plus pulled copy and a one-line read of each pulled creative goes in the top section.

Present the report path and a one-line summary of what was found.
</step>

<step name="audit_video_creatives" condition="media type is video">
Only run when the user chose video ads. Skip entirely for image ads. Load @frameworks/video-ad-analysis.md.

An LLM cannot watch a video; it must read sampled frames and the transcript. For each kept video ad:

1. Confirm ffmpeg is installed (`ffmpeg -version`). If missing, tell the user `brew install ffmpeg` and wait.

2. Download the video from the ad's CDN media URL (from the actor, with `resolveSnapshotUrls: true`) into the video-audit folder:
   ```bash
   curl -L "{cdn_video_url}" -o "{videos-dir}/ad-{n}.mp4"
   ```
   Fall back to `yt-dlp` on the snapshot URL if the direct download is blocked.

3. Extract frames with ffmpeg — scene-change cuts plus a dense first-2-seconds hook burst — into a frames folder.

4. Extract and transcribe the audio to capture the spoken script (voiceover is where the offer lives).

5. Read the frames as images and the transcript as text. For each video capture: the hook (first 3 seconds), visual structure and pacing, on-screen text, the spoken script, and the CTA.

6. Append a "Video Creative Teardown" subsection per ad to the research report, and carry the patterns into the CMO brief.

**Wait for the user to review the teardowns before the brief if they want to weigh in.**
</step>

<step name="cmo_brief">
Run the CMO creative brief as a conversation. Load @frameworks/cmo-brief.md.

Acting as the CMO, discuss and capture, one topic at a time:
- **What kind of ads** they want to create (format, tone, angle drawn from the winners)
- **The CTA** (one primary action)
- **What the offer does exactly** (the concrete outcome the customer gets)

Push back on a vague offer or a weak CTA before moving on. Append a "Creative Brief" section to the report capturing the agreed answers.

**Wait for the user to confirm the brief before generating.**
</step>

<step name="generate_variations">
Generate the aligned copy + creative variations. Load @frameworks/creative-generation.md.

1. Ask the creative format / size: "1:1, 4:5, or a video?" Record it.

2. Ask how many variations (default 5, minimum 5).

3. For each variation produce, step by step:
   - Ad **text copy** aligned to the offer and CTA from the brief
   - A matching **image or video generation prompt** whose subject and mood align with that exact copy (copy and creative must reinforce each other)

4. Ensure Higgsfield is connected for generation. **If the Higgsfield MCP is not connected**, give the user:
   - Install link: https://higgsfield.ai/s/higgsfield-mcp-ig-charlieautomates-dBaWAw
   - Setup help video: https://www.youtube.com/watch?v=SY8kQ6qe4YQ
   Wait until it is connected.

5. Append all variations (copy + prompt) to the **bottom** of the research report MD.

**Wait for the user to approve the variations before building folders.**
</step>

<step name="build_creative_folders">
House each variation as its own folder with creative + copy.

1. First read `context/output-paths.md`. If a **Creatives path** is already saved, reuse it (quick confirm only, no re-ask). If it is `[Not yet set]`, ask where to house the creatives and copy, then **write that path back into `context/output-paths.md`** under "Creatives path" so every future run reuses it automatically. Also stamp the "Last updated" line whenever you save a path.

2. For each approved variation, using @templates/variation-folder.md:
   - Create a subfolder `variation-{n}/`
   - Generate the image or video via the Higgsfield MCP from that variation's prompt and the chosen aspect ratio
   - Rename the output to a descriptive `{purpose}-{detail}.{png|mp4}` filename and place it in the folder
   - Write a `copy.md` in the same folder holding that variation's text copy

3. Repeat for however many variations the user requested.

Report the full tree created and the report path.
</step>

</steps>

<output>
- One research report markdown file: winners table + pulled ad copy, a CMO creative brief section, and 5+ copy/prompt variations at the bottom.
- One creative folder per variation, each containing a generated image or video plus a `copy.md` with its aligned text copy.
</output>

<acceptance-criteria>
- [ ] Brand scope captured or confirmed (from brand kit or interview) and saved to context/brand-scope.md
- [ ] Apify MCP connected and brilliant_gum actor used
- [ ] Search params agreed: keywords, run time (min 2 months), media type, count (10/15/20/25/30)
- [ ] Winners filtered by engagement, sorted least-to-longest run duration, copy pulled
- [ ] If video ads: each kept video downloaded, frames extracted via ffmpeg, audio transcribed, and a teardown written
- [ ] Research report written to the user-specified path
- [ ] CMO brief covered ad type, CTA, and exact offer
- [ ] At least 5 aligned copy + creative variations appended to the report
- [ ] Higgsfield connected (or user directed to the install + video links)
- [ ] One folder per variation created, each with a generated creative and a copy.md
- [ ] User approved the final variations and folder location
</acceptance-criteria>
