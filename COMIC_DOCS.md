# Comic Panel Integration Documentation

This document provides comprehensive documentation for the comic panel system integrated into Jekyll, which automatically converts comic markdown to SVG panels during build time.

## Overview

The comic system allows you to create dialogue-based comic panels directly in markdown using a simple syntax. Each comic panel features two characters (left and right) with various expressions and emotions.

## Basic Usage

### Comic Block

````markdown
```comic
left_guy_smile: Ready for the briefing?
right_girl_angry: Only if you finally updated the sprites.
left_guy_smile: All polished. Let's deploy.
```
````

## Token Structure

Each dialogue line follows this pattern:

```
side_persona_expression: Dialogue text goes here
```

### 1. Side Tokens

Controls which side of the panel the character appears on:

- **Left side:** `left` or `l`
- **Right side:** `right` or `r`

### 2. Persona Tokens

Determines which character sprite set to use:

#### Male Characters
- `guy` (primary alias)
- `male`
- `man`
- `boy`
- `dude`
- `bro`

#### Female Characters  
- `girl` (primary alias)
- `female`
- `woman`
- `lady`
- `gal`

### 3. Expression Tokens

Available expressions for each character type:

#### Male Expressions
- `angry` - Angry/frustrated expression
- `anxious` - Worried/nervous expression  
- `laugh` - Laughing/happy expression
- `more_angry` - Very angry expression
- `more_sand` - [Custom expression]
- `sad` - Sad/disappointed expression
- `smile` - Smiling/content expression
- `surprised` - Shocked/surprised expression

#### Female Expressions
- `angry` - Angry/frustrated expression
- `anxious` - Worried/nervous expression
- `laugh` - Laughing/happy expression
- `sad` - Sad/disappointed expression
- `smile` - Smiling/content expression
- `surprised` - Shocked/surprised expression

## Examples

### Emotional Conversation

````markdown
```comic
left_guy_angry: This is getting frustrating!
right_girl_anxious: Maybe we should take a break?
left_guy_sad: You're right, I'm sorry.
right_girl_smile: No worries, let's continue!
```
````

### Technical Discussion

````markdown
```comic
left_guy_smile: How's the new feature looking?
right_girl_surprised: Wait, did you see the test results?
left_guy_anxious: Oh no, what happened?
right_girl_laugh: They're all passing! Great job!
```
````

### Multiple Expression Changes

````markdown
```comic
left_guy_smile: Everything is going perfectly.
left_guy_surprised: Wait, what's that error message?
left_guy_anxious: This doesn't look good...
right_girl_laugh: Don't worry, I'll fix it!
right_girl_smile: There, all done!
```
````

## Advanced Usage

### Panel Configuration

You can override default settings within a comic block:

````markdown
```comic
background = #f0f8ff
fontSize = 32
spriteScale = 1.0
left_guy_smile: This panel has custom settings!
right_girl_laugh: The background is blue!
```
````

### Available Panel Settings

- `background` - Panel background color (hex code, default: #ffffff)
- `fontSize` - Text size in pixels (default: 36)
- `spriteScale` - Character size multiplier (default: 0.92)
- `margin` - Panel margin in pixels (default: 48)
- `dialogueAreaHeight` - Height of text area (default: 240)
- `panelWidth` - Panel width in pixels (default: 1024)
- `panelHeight` - Panel height in pixels (default: 768)

### Expression Aliases

You can use underscores, hyphens, or spaces in expression names:

```
left_guy_more-angry: All equivalent
left_guy_more_angry: All equivalent  
left_guy_more angry: All equivalent
```

## Complete Token Reference

### Male Character Combinations

```
left_guy_angry          left_male_angry         left_man_angry
left_guy_anxious        left_male_anxious       left_man_anxious  
left_guy_laugh          left_male_laugh         left_man_laugh
left_guy_more_angry     left_male_more_angry    left_man_more_angry
left_guy_more_sand      left_male_more_sand     left_man_more_sand
left_guy_sad            left_male_sad           left_man_sad
left_guy_smile          left_male_smile         left_man_smile
left_guy_surprised      left_male_surprised     left_man_surprised

right_guy_angry         right_boy_angry         right_dude_angry
right_guy_anxious       right_boy_anxious       right_dude_anxious
right_guy_laugh         right_boy_laugh         right_dude_laugh
right_guy_more_angry    right_boy_more_angry    right_dude_more_angry
right_guy_more_sand     right_boy_more_sand     right_dude_more_sand
right_guy_sad           right_boy_sad           right_dude_sad
right_guy_smile         right_boy_smile         right_dude_smile
right_guy_surprised     right_boy_surprised     right_dude_surprised
```

### Female Character Combinations

```
left_girl_angry         left_female_angry       left_woman_angry
left_girl_anxious       left_female_anxious     left_woman_anxious
left_girl_laugh         left_female_laugh       left_woman_laugh
left_girl_sad           left_female_sad         left_woman_sad
left_girl_smile         left_female_smile       left_woman_smile
left_girl_surprised     left_female_surprised   left_woman_surprised

right_girl_angry        right_lady_angry        right_gal_angry
right_girl_anxious      right_lady_anxious      right_gal_anxious
right_girl_laugh        right_lady_laugh        right_gal_laugh
right_girl_sad          right_lady_sad          right_gal_sad
right_girl_smile        right_lady_smile        right_gal_smile
right_girl_surprised    right_lady_surprised    right_gal_surprised
```

## Technical Details

### Build Process

1. Jekyll plugin scans for ```` ```comic ```` code blocks
2. Extracts dialogue content and optional title
3. Generates temporary markdown file with global defaults
4. Calls Node.js comic CLI to generate SVG
5. Copies generated SVG to `assets/generated/comic/`
6. Replaces code block with HTML img tag

### File Structure

```
custom/comic/
├── comic-panel-cli.js           # Node.js generator
├── output/
│   ├── male/                    # Male character sprites
│   │   ├── male_angry.png
│   │   ├── male_smile.png
│   │   └── ...
│   └── female/                  # Female character sprites
│       ├── female_angry.png
│       ├── female_smile.png
│       └── ...
└── README.md

assets/generated/comic/          # Auto-generated SVGs
├── comic_[hash1].svg
├── comic_[hash2].svg
└── ...
```

### Caching

- SVGs are cached based on content hash (MD5)
- Only regenerates when comic content changes
- Improves build performance for unchanged comics

### Styling

Generated comics use these CSS classes:

```css
.comic-panel {
  text-align: center;
  margin: 30px 0;
  background-color: #ffffff;
}

.comic-title {
  font-family: 'Space Mono', monospace;
  font-size: 1.2em;
  font-weight: bold;
  margin: 0 0 15px 0;
  color: #333;
}

.comic-image {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  background-color: #ffffff;
}
```

## Troubleshooting

### Common Issues

1. **Unknown persona error**
   - Check spelling of persona token (guy/girl, male/female, etc.)
   - Ensure using supported persona aliases

2. **Unknown expression error**
   - Verify expression exists for that character type
   - Check available expressions list above

3. **Comic not rendering**
   - Ensure Node.js is available in build environment
   - Check that sprite files exist in `custom/comic/output/`

### Error Messages

The system provides helpful error messages:

```
Error: Panel "Title" line 1: unknown persona "person". Choose from guy/girl (or male/female).
Error: Panel "Title" line 2: unknown expression "happy" for male. Available: angry, anxious, laugh, more_angry, more_sand, sad, smile, surprised.
```

## Best Practices

1. **Consistency**: Use consistent persona aliases throughout your comics
2. **Expressions**: Choose expressions that match the dialogue tone
3. **Titles**: Use descriptive titles for multi-panel stories
4. **Length**: Keep dialogue concise for better readability
5. **Flow**: Use expression changes to show character development

## Integration with Other Systems

The comic system works alongside:

- **D2 Diagrams**: Both use similar markdown → SVG conversion
- **Space Mono Font**: Shared font system for consistency
- **GitHub Actions**: Both deploy automatically to production
- **Jekyll Build**: Integrated into the same build pipeline

This documentation should help you create engaging comic panels that enhance your blog content! 🎨
