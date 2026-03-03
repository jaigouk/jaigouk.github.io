import type { CollectionEntry } from 'astro:content';

/**
 * Check if any projects have categories
 */
export function hasProjectCategories(projects: CollectionEntry<'projects'>[]): boolean {
  return projects.some(project => 
    project.data.categories && 
    project.data.categories.length > 0
  );
}

/**
 * Check if any docs have categories
 */
export function hasDocCategories(docs: CollectionEntry<'docs'>[]): boolean {
  return docs.some(doc => 
    doc.data.category && 
    doc.data.category.trim() !== '' &&
    doc.data.category !== 'General'
  );
}

/**
 * Get all unique project categories
 */
export function getProjectCategories(projects: CollectionEntry<'projects'>[]): string[] {
  const categories = new Set<string>();
  
  projects.forEach(project => {
    if (project.data.categories && project.data.categories.length > 0) {
      project.data.categories.forEach(category => {
        if (category && category.trim() !== '') {
          categories.add(category.trim());
        }
      });
    }
  });
  
  return Array.from(categories).sort();
}

/**
 * Get all unique doc categories, including "Unsorted" for docs without categories
 */
export function getDocCategories(docs: CollectionEntry<'docs'>[]): string[] {
  const categories = new Set<string>();
  let hasUnsorted = false;
  
  docs.forEach(doc => {
    if (doc.data.category && doc.data.category.trim() !== '' && doc.data.category !== 'General') {
      categories.add(doc.data.category.trim());
    } else {
      hasUnsorted = true;
    }
  });
  
  if (hasUnsorted) {
    categories.add('Unsorted');
  }
  
  return Array.from(categories).sort();
}

/**
 * Group docs by category, with "Unsorted" category for docs without categories
 */
export function groupDocsByCategory(docs: CollectionEntry<'docs'>[]): Record<string, CollectionEntry<'docs'>[]> {
  const grouped: Record<string, CollectionEntry<'docs'>[]> = {};
  
  docs.forEach(doc => {
    let category = doc.data.category;
    
    // If no category, empty string, null, undefined, or "General", put in "Unsorted"
    if (!category || category.trim() === '' || category === 'General') {
      category = 'Unsorted';
    }
    
    if (!grouped[category]) {
      grouped[category] = [];
    }
    
    grouped[category].push(doc);
  });
  
  // Sort docs within each category by order, then by title
  Object.keys(grouped).forEach(category => {
    grouped[category].sort((a, b) => {
      if (a.data.order !== b.data.order) {
        return a.data.order - b.data.order;
      }
      return a.data.title.localeCompare(b.data.title);
    });
  });
  
  return grouped;
}
