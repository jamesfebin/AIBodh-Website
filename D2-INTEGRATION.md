# D2 Diagram Integration for Jekyll

This document explains the D2 diagram integration setup for this Jekyll blog, which automatically converts D2 code blocks to SVG during build time.

## Overview

The integration uses a custom Jekyll plugin that:
- Processes D2 code blocks in markdown files during build
- Converts them to SVG using the D2 CLI
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
│   └── d2_converter.rb          # Jekyll plugin for D2 conversion
├── assets/
│   ├── fonts/                   # Space Mono font files
│   │   ├── SpaceMono-Regular.ttf
│   │   ├── SpaceMono-Bold.ttf
│   │   ├── SpaceMono-Italic.ttf
│   │   └── SpaceMono-BoldItalic.ttf
│   ├── generated/
│   │   └── d2/                  # Generated SVG files (auto-created)
│   │       ├── d2_[hash1].svg
│   │       ├── d2_[hash2].svg
│   │       └── ...
│   └── main.scss                # CSS with D2 diagram styling
└── [markdown files]             # Your posts/pages with D2 code blocks
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
For GitHub Pages deployment, you'll need to either:
1. Use GitHub Actions to build the site with the custom plugin, or
2. Build locally and push the `_site` directory to a `gh-pages` branch

The `github-pages` gem doesn't support custom plugins for security reasons.

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
