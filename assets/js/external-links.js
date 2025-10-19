/**
 * External Links Handler
 * Automatically adds target="_blank" to external links for better UX
 */
document.addEventListener('DOMContentLoaded', function() {
  // Get all links in the post content
  const postContent = document.querySelector('.post-content');
  if (!postContent) return;

  const links = postContent.querySelectorAll('a[href]');
  
  links.forEach(function(link) {
    const href = link.getAttribute('href');
    
    // Skip if already has target attribute
    if (link.hasAttribute('target')) return;
    
    // Skip if it's an anchor link (starts with #)
    if (href.startsWith('#')) return;
    
    // Skip if it's a relative link (doesn't start with http:// or https://)
    if (!href.startsWith('http://') && !href.startsWith('https://')) return;
    
    // Skip if it's a link to the same domain
    try {
      const linkUrl = new URL(href);
      const currentUrl = new URL(window.location.href);
      
      // If same hostname, skip (internal link)
      if (linkUrl.hostname === currentUrl.hostname) return;
    } catch (e) {
      // If URL parsing fails, skip this link
      return;
    }
    
    // Add target="_blank" and rel="noopener noreferrer" for security
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    
    // Optional: Add a visual indicator for external links
    // You can uncomment the next line if you want a small icon
    // link.innerHTML += ' <span style="font-size: 0.8em; color: #666;">↗</span>';
  });
});
