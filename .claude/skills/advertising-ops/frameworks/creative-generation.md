# Creative Generation Framework

How to produce aligned copy + image/video variations through Higgsfield.

## Purpose
Generate at least five ad variations where the text copy and the visual reinforce each other, sized to the chosen format, ready to drop into per-variation folders.

## Core Concepts

### Connecting Higgsfield
Generation runs through the Higgsfield MCP (`mcp__higgsfield__*`). If it is not connected, give the user:
- Install link: https://higgsfield.ai/s/higgsfield-mcp-ig-charlieautomates-dBaWAw
- Setup help video: https://www.youtube.com/watch?v=SY8kQ6qe4YQ

Nano Banana is deprecated; never fall back to it.

### Aspect ratio / format
Ask once: "1:1, 4:5, or a video?"
- 1:1 (1080x1080) — feed square
- 4:5 (1080x1350) — feed portrait, more real estate
- Video — short-form vertical or square clip
Carry the chosen ratio into every Higgsfield generation call.

### Copy-to-creative alignment (the core rule)
Each variation is a pair: a piece of text copy AND a generation prompt that depicts the same promise. The subject, mood, and scene in the image or video must match what the copy claims. Mismatched pairs are rejected.

Per variation, produce step by step:
1. The ad text copy (hook, body, the single CTA from the brief)
2. The image or video prompt whose subject and tone match that copy

### Variation count
Default five, minimum five. The user may ask for more.

### Output handling
- Append every variation (copy + prompt) to the bottom of the research report.
- When building folders, generate the actual creative and rename the file to a descriptive `{purpose}-{detail}.{png|mp4}`, never the auto-generated name.

## Examples
- Copy promises "answer every lead in 60 seconds" → prompt depicts a phone lighting up with an instant reply, not a generic office stock scene.

## Anti-Patterns
- Generic visuals disconnected from the copy claim.
- One shared prompt reused across all five variations.
- Leaving auto-generated Higgsfield filenames in the folder.
- Falling back to Nano Banana.
