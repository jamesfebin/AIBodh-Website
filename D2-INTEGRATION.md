# D2 Diagram & Comic Integration for Jekyll

This document explains the D2 diagram and Comic panel integration setup for this Jekyll blog, which automatically converts D2 and Comic code blocks to SVG during build time.

## Overview

The integration uses custom Jekyll plugins that:

### D2 Diagrams:
- Processes D2 code blocks in markdown files during build
- Converts them to SVG using the D2 CLI
- Replaces the code blocks with HTML img tags pointing to the generated SVGs
- Caches generated SVGs to avoid regeneration on subsequent builds

### Comic Panels:
- Processes Comic code blocks in markdown files during build
- Converts them to SVG using the custom comic CLI (Node.js)
- Replaces the code blocks with HTML img tags pointing to the generated SVGs
- Caches generated SVGs to avoid regeneration on subsequent builds

## Requirements

### 1. D2 CLI Installation

The D2 CLI must be installed on your system. Install it using:

```bash
curl -fsSL https://d2lang.com/install.sh | sh
```

Verify installation:
```bash
d2 --version
```

### 2. Jekyll Configuration

For local development, the `Gemfile` has been modified to use Jekyll directly instead of the `github-pages` gem, which doesn't allow custom plugins:

```ruby
# Use Jekyll directly for local development with custom plugins
gem "jekyll", "~> 3.9"
gem "minima", "~> 2.5"

# Plugins
group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.12"
  gem "jekyll-sitemap"
  gem "jekyll-seo-tag"
  gem "kramdown-parser-gfm"
end
```

## Usage

### D2 Diagrams

Simply add D2 code blocks to your markdown files:

````markdown
```d2
Client -> Server: Request
Server -> Database: Query
Database -> Server: Result
Server -> Client: Response
```
````

During build, this will be automatically converted to:

```html
<div class="d2-diagram">
  <img src="/assets/generated/d2/d2_[hash].svg" alt="D2 Diagram" class="d2-svg" />
</div>
```

### Comic Panels

Add comic code blocks to your markdown files:

````markdown
```comic Briefing
left_guy_smile: Ready for the briefing?
right_girl_angry: Only if you finally updated the sprites.
left_guy_smile: All polished. Let's deploy.
```
````

During build, this will be automatically converted to:

```html
<div class="comic-panel">
  <h4 class="comic-title">Briefing</h4>
  <img src="/assets/generated/comic/comic_[hash].svg" alt="Comic Panel: Briefing" class="comic-image" />
</div>
```

**Available expressions:**
- **Male:** angry, anxious, laugh, more_angry, more_sand, sad, smile, surprised
- **Female:** angry, anxious, laugh, sad, smile, surprised

**Usage pattern:** `side_persona_expression: dialogue`
- `side`: left/right (or l/r)
- `persona`: guy/male/man/boy/dude/bro (male) or girl/female/woman/lady/gal (female)
- `expression`: one of the available expressions above

## How It Works

### 1. Jekyll Plugin (`_plugins/d2_converter.rb`)

The plugin registers a pre-render hook that:
- Scans markdown content for D2 code blocks using regex pattern `/```d2\s*\n(.*?)\n```/m`
- Generates unique filenames based on content hash (MD5)
- Creates temporary D2 files and calls D2 CLI to generate SVGs
- Stores generated SVGs in `assets/generated/d2/`
- Replaces D2 code blocks with HTML img tags

### 2. D2 CLI Execution

The plugin executes D2 CLI with these parameters:
```bash
d2 --theme=3 \
   --font-regular=assets/fonts/SpaceMono-Regular.ttf \
   --font-bold=assets/fonts/SpaceMono-Bold.ttf \
   --font-italic=assets/fonts/SpaceMono-Italic.ttf \
   [temp_file].d2 [output].svg
```

### 3. CSS Styling

The generated diagrams are styled with CSS classes in `assets/main.scss`:

```scss
.d2-diagram {
  text-align: center;
  margin: 20px 0;
  background-color: #ffffff;
}

.d2-svg {
  max-width: 100%;
  height: auto;
  background-color: #ffffff;
}
```

## File Structure

```
├── _plugins/
│   ├── d2_converter.rb          # Jekyll plugin for D2 conversion
│   └── comic_converter.rb       # Jekyll plugin for Comic conversion
├── custom/
│   └── comic/                   # Comic generation system
│       ├── comic-panel-cli.js   # Node.js CLI for generating comic panels
│       ├── output/              # Sprite assets
│       │   ├── male/           # Male character sprites
│       │   └── female/         # Female character sprites
│       └── README.md
├── assets/
│   ├── fonts/                   # Space Mono font files
│   │   ├── SpaceMono-Regular.ttf
│   │   ├── SpaceMono-Bold.ttf
│   │   ├── SpaceMono-Italic.ttf
│   │   └── SpaceMono-BoldItalic.ttf
│   ├── generated/
│   │   ├── d2/                  # Generated D2 SVG files (auto-created)
│   │   │   ├── d2_[hash1].svg
│   │   │   └── ...
│   │   └── comic/               # Generated Comic SVG files (auto-created)
│   │       ├── comic_[hash1].svg
│   │       └── ...
│   └── main.scss                # CSS with D2 & Comic styling
└── [markdown files]             # Your posts/pages with D2/Comic code blocks
```

## Benefits

1. **Build-time Conversion**: Diagrams are generated during build, not runtime
2. **Source Preservation**: Original markdown remains unchanged
3. **Caching**: SVGs are cached and only regenerated when content changes
4. **Performance**: Static SVG files load faster than client-side rendering
5. **SEO-friendly**: Diagrams are actual SVG elements, not dynamic content
6. **Custom Typography**: Uses Space Mono font for consistent, modern appearance

## Development vs Production

### Local Development
- Uses Jekyll directly with custom plugins enabled
- Run: `bundle exec jekyll serve`

### GitHub Pages Deployment
**Important**: GitHub Pages doesn't support custom plugins in safe mode.

**Solution**: Use the included GitHub Actions workflow (`.github/workflows/deploy.yml`):
1. Go to Repository Settings → Pages
2. Set Source to "GitHub Actions"
3. Push to main branch - the workflow will:
   - Install D2 CLI
   - Build Jekyll with custom plugins
   - Deploy to GitHub Pages

See `DEPLOYMENT.md` for detailed deployment instructions.

### Alternative Hosting
- **Netlify/Vercel**: Support custom Jekyll plugins and D2 CLI
- **Manual Deploy**: Build locally and upload `_site` folder

## Troubleshooting

### D2 CLI Not Found
Ensure D2 CLI is installed and available in PATH:
```bash
which d2
d2 --version
```

### Plugin Not Loading
Check that you're not using the `github-pages` gem in development:
```ruby
# Comment this out for local development
# gem "github-pages", group: :jekyll_plugins
```

### SVG Generation Errors
The plugin creates fallback error SVGs if D2 conversion fails. Check the generated SVG content if diagrams appear as error messages.

## Examples

### Simple Flow
````markdown
```d2
Frontend -> Backend: API Call
Backend -> Database: Query
Database -> Backend: Data
Backend -> Frontend: Response
```
````

### System Architecture
````markdown
```d2
Frontend: {
  React App
  Redux Store
}

Backend: {
  Express Server
  Authentication
}

Database: {
  PostgreSQL
  Redis Cache
}

Frontend.React App -> Backend.Express Server
Backend.Express Server -> Database.PostgreSQL
Backend.Express Server -> Database.Redis Cache
```
````

## Credits

This integration was built using:
- [D2](https://d2lang.com/) - Modern diagram scripting language
- [Jekyll](https://jekyllrb.com/) - Static site generator
- Custom Ruby plugin for seamless integration
