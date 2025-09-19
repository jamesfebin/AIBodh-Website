# Deployment Guide for Jekyll Blog with D2 Integration

This blog uses custom Jekyll plugins (specifically the D2 converter), which means it cannot be deployed directly using GitHub Pages' default Jekyll processing. Here are the deployment options:

## Option 1: GitHub Actions (Recommended)

### Setup Steps:

1. **Enable GitHub Pages from Actions**:
   - Go to your repository on GitHub
   - Navigate to Settings → Pages
   - Under "Source", select "GitHub Actions"

2. **Push the workflow file**:
   The `.github/workflows/deploy.yml` file is already configured to:
   - Install D2 CLI
   - Build Jekyll with custom plugins
   - Deploy to GitHub Pages

3. **Branch Configuration**:
   - Make sure your main branch is `main` (or update the workflow file to match your default branch)
   - The workflow triggers on pushes to the main branch

### How it works:

```yaml
# The workflow:
1. Installs D2 CLI on Ubuntu runner
2. Sets up Ruby and installs gems
3. Builds Jekyll site with custom plugins
4. Deploys to GitHub Pages
```

## Option 2: Manual Build & Deploy

If you prefer manual control:

1. **Build locally**:
   ```bash
   bundle exec jekyll build
   ```

2. **Deploy the `_site` folder**:
   - Push `_site` contents to `gh-pages` branch, or
   - Use a service like Netlify/Vercel

## Option 3: Alternative Hosting

### Netlify:
- Connect your repository
- Build command: `bundle exec jekyll build`
- Publish directory: `_site`
- Will automatically install D2 and build with plugins

### Vercel:
- Similar setup to Netlify
- Supports Ruby and custom build processes

## Important Notes

### Font Files
The Space Mono fonts in `assets/fonts/` need to be included in your repository for D2 to use them during build.

### Environment Variables
The D2 plugin works in both development and production environments.

### Build Dependencies
The GitHub Actions workflow automatically installs:
- D2 CLI
- Ruby gems
- Jekyll and plugins

## Troubleshooting

### Build Fails in GitHub Actions
- Check the Actions tab for detailed error logs
- Ensure D2 CLI installed successfully
- Verify font files are present in repository

### D2 Diagrams Not Rendering
- Check that the Jekyll build completed successfully
- Verify SVG files were generated in `assets/generated/d2/`
- Ensure D2 CLI version compatibility

### Local vs Production Differences
- Local development uses `bundle exec jekyll serve`
- Production uses `bundle exec jekyll build`
- Both should produce identical D2 diagrams

## Repository Structure for Deployment

```
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Actions workflow
├── _plugins/
│   └── d2_converter.rb          # Custom D2 plugin
├── assets/
│   ├── fonts/                   # Space Mono fonts (must be in repo)
│   └── generated/d2/            # Generated SVGs (auto-created)
├── _site/                       # Build output (git-ignored)
├── Gemfile                      # Ruby dependencies
└── [content files]
```

## First-Time Setup Checklist

- [ ] Repository connected to GitHub Pages
- [ ] GitHub Pages source set to "GitHub Actions"
- [ ] Workflow file in `.github/workflows/deploy.yml`
- [ ] Font files committed to repository
- [ ] Push to main branch triggers deployment
- [ ] Check Actions tab for successful build

## Monitoring Deployments

- **GitHub Actions**: Check the Actions tab for build status
- **Build Logs**: Review logs if builds fail
- **Site Updates**: Changes should appear within a few minutes

This setup ensures your D2 diagrams with Space Mono fonts work perfectly in production! 🚀
