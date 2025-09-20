/**
 * Image Popup Modal
 * Adds click-to-expand functionality for images in blog posts
 */
(function() {
    'use strict';
    
    let popup = null;
    let popupImage = null;
    
    function createPopupModal() {
        // Create popup overlay
        popup = document.createElement('div');
        popup.className = 'image-popup-overlay';
        popup.id = 'image-popup';
        
        // Create popup content container
        const content = document.createElement('div');
        content.className = 'image-popup-content';
        
        // Create popup image
        popupImage = document.createElement('img');
        popupImage.className = 'image-popup-image';
        popupImage.alt = 'Popup image';
        
        // Assemble popup
        content.appendChild(popupImage);
        popup.appendChild(content);
        
        // Add to page
        document.body.appendChild(popup);
        
        // Event listeners
        popup.addEventListener('click', function(e) {
            if (e.target === popup) {
                closePopup();
            }
        });
        
        // Prevent content clicks from closing popup
        content.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    
    function openPopup(img) {
        if (!popup) createPopupModal();
        
        // Get the original image source (remove any size constraints)
        let originalSrc = img.src;
        
        // If it's a Jekyll processed image, try to get the original
        if (img.dataset && img.dataset.originalSrc) {
            originalSrc = img.dataset.originalSrc;
        }
        
        // Set image source and alt text
        popupImage.src = originalSrc;
        popupImage.alt = img.alt || 'Blog image';
        
        // Reset image styles to ensure full size display
        popupImage.style.maxWidth = '90vw';
        popupImage.style.maxHeight = '90vh';
        popupImage.style.width = 'auto';
        popupImage.style.height = 'auto';
        
        // Special handling for D2 images
        if (img.classList.contains('d2-svg')) {
            popupImage.style.minWidth = '500px';
            popupImage.style.minHeight = '375px';
            popupImage.style.maxWidth = '80vw';
            popupImage.style.maxHeight = '80vh';
            popupImage.style.padding = '20px';
            popupImage.style.backgroundColor = '#ffffff';
            popupImage.style.border = '2px solid #e2e8f0';
            popupImage.style.borderRadius = '8px';
            popupImage.style.transform = 'scale(1.2)';
        }
        
        // Show popup
        popup.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Add keyboard listeners
        document.addEventListener('keydown', handleKeydown);
    }
    
    function closePopup() {
        if (popup) {
            popup.style.display = 'none';
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleKeydown);
        }
    }
    
    function handleKeydown(e) {
        if (e.key === 'Escape') {
            closePopup();
        }
    }
    
    function initializeImagePopup() {
        // Find all images in post content
        const postContent = document.querySelector('.post-content');
        if (!postContent) return;
        
        const postImages = postContent.querySelectorAll('img');
        
        // Add click listeners to images
        postImages.forEach((img) => {
            img.addEventListener('click', function() {
                openPopup(img);
            });
            
            // Add loading error handling
            img.addEventListener('error', function() {
                console.warn('Failed to load image:', img.src);
            });
        });
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeImagePopup);
    } else {
        initializeImagePopup();
    }
    
    // Re-initialize if content is dynamically loaded
    window.reinitializeImagePopup = initializeImagePopup;
    
})();
