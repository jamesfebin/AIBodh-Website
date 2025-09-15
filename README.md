# Jekyll Blog with Space Mono Font

A clean, modern Jekyll blog using the Space Mono monospace font, ready for deployment on GitHub Pages.

## Features

- Clean, minimal design with Space Mono monospace font
- Responsive layout that works on all devices
- GitHub Pages ready with automated deployment
- SEO optimized with jekyll-seo-tag
- RSS feed support
- Syntax highlighting for code blocks
- Easy to customize and extend

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Ruby** (version 2.7.0 or higher)
  - On macOS: `brew install ruby`
  - On Ubuntu: `sudo apt-get install ruby-full`
  - On Windows: Use [RubyInstaller](https://rubyinstaller.org/)
- **Bundler**: `gem install bundler`
- **Git**: [Download Git](https://git-scm.com/downloads)

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/your-blog-repo.git
cd your-blog-repo
```

### 2. Install Dependencies

```bash
bundle install
```

### 3. Configure Your Site

Edit `_config.yml` to customize your blog:

```yaml
title: Your Blog Title
email: your-email@example.com
description: >-
  Write an awesome description for your new site here.
baseurl: "" # Leave empty for root domain
url: "https://yourusername.github.io" # Your GitHub Pages URL
github_username: yourusername
twitter_username: yourusername
```

### 4. Run Locally

Start the development server:

```bash
bundle exec jekyll serve
```

Your site will be available at `http://localhost:4000`. The server will automatically rebuild when you make changes to your files.

### 5. Create Your First Post

Create a new file in the `_posts` directory with the naming convention:
`YYYY-MM-DD-title.markdown`

Example: `_posts/2025-09-15-my-first-post.markdown`

```markdown
---
layout: post
title: "My First Post"
date: 2025-09-15 12:00:00 -0700
categories: blog
---

This is my first blog post! You can write content here using Markdown.

## Code Examples

The Space Mono font looks great for code:

```ruby
def hello_world
  puts "Hello, World!"
end
```
```

## GitHub Pages Deployment

### Option 1: Automatic Deployment (Recommended)

This repository includes a GitHub Actions workflow that automatically builds and deploys your site when you push to the main branch.

1. **Create a GitHub Repository**
   ```bash
   # Initialize git if not already done
   git init
   git add .
   git commit -m "Initial commit"
   
   # Add your GitHub repository as origin
   git remote add origin https://github.com/yourusername/your-blog-repo.git
   git branch -M main
   git push -u origin main
   ```

2. **Enable GitHub Pages**
   - Go to your repository on GitHub
   - Click on **Settings** tab
   - Scroll down to **Pages** section
   - Under **Source**, select **GitHub Actions**
   - The workflow will automatically run and deploy your site

3. **Access Your Site**
   Your site will be available at: `https://yourusername.github.io/your-blog-repo`

### Option 2: Manual Deployment

If you prefer to build the site manually:

1. **Enable GitHub Pages**
   - Go to repository **Settings** → **Pages**
   - Under **Source**, select **Deploy from a branch**
   - Choose **main** branch and **/ (root)** folder

2. **Push Your Code**
   ```bash
   git add .
   git commit -m "Add Jekyll blog"
   git push origin main
   ```

## Customization

### Changing Colors and Fonts

Edit `_sass/minima.scss` to customize:

```scss
// Brand colors
$brand-color: #2a7ae4 !default;
$text-color: #111 !default;
$background-color: #fdfdfd !default;

// You can also add custom CSS here
```

### Adding New Pages

Create `.markdown` files in the root directory:

```markdown
---
layout: page
title: Contact
permalink: /contact/
---

# Contact Me

Your contact information here.
```

### Customizing the Navigation

Edit `_config.yml` to control which pages appear in navigation:

```yaml
header_pages:
  - about.markdown
  - contact.markdown
```

## Writing Posts

### Front Matter

All posts need front matter at the top:

```yaml
---
layout: post
title: "Your Post Title"
date: 2025-09-15 12:00:00 -0700
categories: category1 category2
tags: tag1 tag2
author: Your Name
---
```

### Markdown Features

- **Headers**: Use `#`, `##`, `###` etc.
- **Links**: `[Link text](URL)`
- **Images**: `![Alt text](image-url)`
- **Code blocks**: Use triple backticks with language
- **Lists**: Use `-` or `1.` for bullets/numbers

### Syntax Highlighting

Code blocks with language specification are automatically highlighted:

```javascript
function greet(name) {
    console.log(`Hello, ${name}!`);
}
```

## Troubleshooting

### Common Issues

1. **Ruby Version Errors**
   - Ensure you're using Ruby 2.7.0+: `ruby --version`
   - Consider using rbenv or RVM for version management

2. **Bundle Install Fails**
   ```bash
   gem update --system
   bundle install
   ```

3. **Site Not Updating on GitHub Pages**
   - Check the Actions tab for build errors
   - Ensure all files are committed and pushed
   - GitHub Pages can take a few minutes to update

4. **Local Server Won't Start**
   ```bash
   bundle update
   bundle exec jekyll clean
   bundle exec jekyll serve
   ```

### Getting Help

- [Jekyll Documentation](https://jekyllrb.com/docs/)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Jekyll Themes](https://jekyllrb.com/docs/themes/)

## Project Structure

```
.
├── _config.yml          # Site configuration
├── _includes/           # Reusable template parts
├── _layouts/            # Page layouts
├── _posts/              # Blog posts
├── _sass/               # Sass stylesheets
├── assets/              # CSS, JS, images
├── .github/workflows/   # GitHub Actions
├── Gemfile              # Ruby dependencies
└── index.markdown       # Homepage
```

## License

This project is open source and available under the [MIT License](LICENSE).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

---

Happy blogging! 🚀
