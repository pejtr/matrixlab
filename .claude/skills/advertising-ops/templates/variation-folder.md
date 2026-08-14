# Variation Folder Template

Per-variation creative folder built in the final step. One folder per variation, housing the generated creative and its aligned copy.

Output location: `{creatives-root}/variation-{n}/` at the user-specified path.

```template
{creatives-root}/
├── variation-1/
│   ├── {purpose}-{detail}.{png|mp4}
│   └── copy.md
├── variation-2/
│   ├── {purpose}-{detail}.{png|mp4}
│   └── copy.md
└── ... (one folder per requested variation)
```

## copy.md contents

```template
# Variation {n} — {business-name}

- Format: {aspect-ratio}
- CTA: {single-cta}

## Ad Copy
{ad-text-copy}

## Creative Prompt
{generation-prompt}

## Asset
{creative-filename}
```

## Field Documentation

| Field | Meaning |
|-------|---------|
| `creatives-root` | The folder the user chose to house creatives |
| `variation-{n}` | One subfolder per variation, numbered |
| `purpose-detail` | Descriptive creative filename, never the auto-generated name |
| `aspect-ratio` | 1:1, 4:5, or video, matching what was generated |
| `creative-filename` | The renamed image/video file in this folder |

## Section Specifications
- One folder per variation, numbered to match the report's Generated Variations.
- Each folder contains exactly one creative (image or video) and one `copy.md`.
- The creative is generated via the Higgsfield MCP and renamed descriptively before placing.
- `copy.md` text copy must match the creative in that same folder.
