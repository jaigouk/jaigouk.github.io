/**
 * Category Filtering Script for Projects Page
 * Handles clickable category pills to filter project cards
 */

function initializeCategoryFiltering() {
  const categoryItems = document.querySelectorAll('.category-item');
  const projectCards = document.querySelectorAll('[data-project-categories]');
  let currentActiveCategory = null;

  if (categoryItems.length === 0) {
    return;
  }

  // Remove existing event listeners and add new ones
  categoryItems.forEach((item, index) => {
    // Clone the element to remove all event listeners
    const newItem = item.cloneNode(true);
    item.parentNode?.replaceChild(newItem, item);
    
    newItem.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const category = newItem.getAttribute('data-category');
      
      // Visual feedback
      newItem.style.transform = 'scale(0.95)';
      setTimeout(() => {
        newItem.style.transform = '';
      }, 150);
      
      if (!category) return;
      
      // Check if this category is already active
      const isCurrentlyActive = currentActiveCategory === category;
      
      // Reset all buttons to inactive state
      categoryItems.forEach(btn => {
        btn.classList.remove('bg-highlight-100', 'dark:bg-highlight-900/40', 'text-highlight-800', 'dark:text-highlight-200', 'ring-1', 'ring-highlight-300', 'dark:ring-highlight-700');
        btn.classList.add('bg-primary-100', 'dark:bg-primary-800', 'text-primary-700', 'dark:text-primary-300');
      });
      
      if (isCurrentlyActive) {
        // If clicking the same category, show all projects
        projectCards.forEach(card => {
          card.style.display = 'block';
        });
        currentActiveCategory = null;
      } else {
        // Filter projects by category
        projectCards.forEach((card, cardIndex) => {
          const cardCategories = card.getAttribute('data-project-categories') || '';
          
          if (cardCategories.includes(category)) {
            card.style.display = 'block';
          } else {
            card.style.display = 'none';
          }
        });
        
        // Make clicked button active
        newItem.classList.remove('bg-primary-100', 'dark:bg-primary-800', 'text-primary-700', 'dark:text-primary-300');
        newItem.classList.add('bg-highlight-100', 'dark:bg-highlight-900/40', 'text-highlight-800', 'dark:text-highlight-200', 'ring-1', 'ring-highlight-300', 'dark:ring-highlight-700');
        currentActiveCategory = category;
      }

      // Dispatch custom event for analytics
      window.dispatchEvent(new CustomEvent('categoryClicked', {
        detail: { category, isActive: currentActiveCategory === category }
      }));
    });
  });
}

// Initialize with multiple strategies to ensure it works
function tryInitialize() {
  initializeCategoryFiltering();
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', tryInitialize);

// Re-initialize after Swup page transitions
document.addEventListener('swup:contentReplaced', tryInitialize);

// Also try to initialize immediately in case DOM is already ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', tryInitialize);
} else {
  // Use setTimeout to ensure DOM is fully ready
  setTimeout(tryInitialize, 100);
}

// Fallback: try again after a short delay
setTimeout(tryInitialize, 500);

// Export for manual initialization if needed
window.initializeCategoryFiltering = initializeCategoryFiltering;
