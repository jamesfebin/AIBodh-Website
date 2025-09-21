# Design System

## Color Palette

### Primary Colors
- **Background**: `#ffffff` (Pure White)
- **Text**: `#2d3748` (Clean Dark Gray)
- **Brand**: `#805ad5` (Clean Purple)

### Secondary Colors
- **Muted Gray**: `#718096`
- **Light Gray**: `#e2e8f0`
- **Dark Gray**: `#4a5568`

### Code Block Colors
- **Background**: `#f1f5f9` (Distinct Light Blue-Gray)
- **Text**: `#2d3748` (Clean Dark Gray)
- **Inline Code**: `#805ad5` (Clean Purple)
- **Border**: `#e2e8f0` (Light Gray)

### Syntax Highlighting Colors
- **Keywords**: `#6f42c1` (Medium Purple)
- **Strings**: `#28a745` (Green)
- **Comments**: `#6c757d` (Gray)
- **Numbers**: `#e83e8c` (Pink)
- **Functions**: `#17a2b8` (Cyan)

## Typography

### Font Families
- **Body Text**: `Space Mono` (400, 700)
- **Code Blocks**: `JetBrains Mono` (400, 500, 700)
- **Comic Text**: `Architects Daughter` (400)

### Font Weights
- **Body Text**: 400 (Normal)
- **Code Blocks**: 400 (Normal)
- **Inline Code**: 500 (Medium)
- **Headings**: 700 (Bold)

## Components

### Navigation Bar
- **Background**: `#ffffff` (Pure White)
- **Text**: `#2d3748` (Clean Dark Gray)
- **No Border**: Seamless transition to page content
- **No Drop Shadow**: Clean, flat design

### Post Cards
- **Background**: `#ffffff` (Pure White)
- **Border**: `1px solid #e2e8f0` (Light Gray)
- **Border Radius**: `12px` (Rounded corners)
- **Box Shadow**: `0 2px 8px rgba(0, 0, 0, 0.05)`
- **Hover Shadow**: `0 4px 16px rgba(0, 0, 0, 0.1)`

### Featured Images
- **Aspect Ratio**: Maintained (no cropping)
- **Border Radius**: `12px` (Rounded corners)
- **Hover Effect**: `transform: scale(1.02)` (Subtle zoom)

### Code Blocks
- **Background**: `#f1f5f9` (Distinct Light Blue-Gray)
- **Border**: `1px solid #e2e8f0` (Light Gray)
- **Border Radius**: `8px` (Rounded corners)
- **Font**: `JetBrains Mono` (400 weight)
- **Padding**: `1rem`

### Inline Code
- **Background**: `#f1f5f9` (Distinct Light Blue-Gray)
- **Text Color**: `#805ad5` (Clean Purple)
- **Font Weight**: `500` (Medium)
- **Border Radius**: `8px` (Rounded corners)
- **Padding**: `1px 5px`

### Image Popup Modal
- **Overlay**: `rgba(0, 0, 0, 0.9)` (Dark semi-transparent)
- **Background**: `#ffffff` (Pure White)
- **Border**: `2px solid #e2e8f0` (Light Gray)
- **Border Radius**: `8px` (Rounded corners)
- **Box Shadow**: `0 8px 32px rgba(0, 0, 0, 0.3)`
- **Max Size**: `90vw x 90vh`

### D2 Diagrams (Popup)
- **Background**: `#ffffff` (Pure White)
- **Border**: `2px solid #e2e8f0` (Light Gray)
- **Padding**: `20px`
- **Transform**: `scale(1.2)` (20% larger)
- **Min Size**: `500px x 375px`
- **Max Size**: `80vw x 80vh`

### Comic Panels
- **Font**: `Architects Daughter` (400)
- **Text Color**: `#111111` (Black)
- **Background**: `#ffffff` (Pure White)
- **Border Radius**: `8px` (Rounded corners)
- **No Drop Shadow**: Clean appearance

## Layout

### Page Structure
- **Background**: `#ffffff` (Pure White)
- **Container**: Responsive with Bulma grid system
- **Sections**: Clean white backgrounds
- **Spacing**: Consistent 2rem margins

### Responsive Breakpoints
- **Mobile**: Full width
- **Tablet**: 10 columns
- **Desktop**: 8 columns

## Design Principles

### Clean & Modern
- Minimal use of shadows and borders
- Clean white backgrounds
- Subtle hover effects
- Consistent spacing and typography

### Accessibility
- High contrast text colors
- Clear visual hierarchy
- Readable font sizes
- Proper color contrast ratios

### Performance
- Web fonts loaded efficiently
- Optimized image handling
- Clean CSS with minimal redundancy
- Responsive design patterns

## Usage Guidelines

### Color Application
- Use primary colors for main content
- Use secondary colors for supporting elements
- Maintain consistent color relationships
- Ensure sufficient contrast for readability

### Typography
- Use Space Mono for body text
- Use JetBrains Mono for all code
- Use Architects Daughter for comic text
- Maintain consistent font weights

### Component Styling
- Apply consistent border radius (8px for small, 12px for large)
- Use subtle shadows sparingly
- Maintain clean, flat design principles
- Ensure responsive behavior

## File Structure

```
_sass/
├── minima.scss          # Main theme variables
├── _base.scss           # Base element styles
└── _syntax-highlighting.scss # Code highlighting

assets/
├── main.scss            # Custom styles and Bulma overrides
├── css/
│   └── syntax.css       # Rouge syntax highlighting
└── js/
    └── image-popup.js   # Image popup functionality
```

## Browser Support

- Modern browsers with CSS Grid support
- Web font loading support
- SVG support for diagrams and comics
- JavaScript ES6+ features for popup functionality

---

*This design system was developed iteratively through the blog customization process, focusing on clean aesthetics, readability, and user experience.*
