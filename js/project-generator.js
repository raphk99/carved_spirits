
/**
 * Generates the HTML for a single tag link.
 * @param {string} tag - The tag text.
 * @returns {string} - The HTML string for the tag link.
 */
export function generateTagHtml(tag) {
  const processedTag = tag.trim().toLowerCase().replace(/\s+/g, '_');
  // Using globe-test.html as the target based on existing file, but keeping the user's requested query param format
  return `<a href="globe-test.html?tag=${processedTag}"><span class="tag">${tag}</span></a>`;
}

/**
 * Generates the HTML for a project card.
 * @param {Object} project - The project object from objects.json.
 * @returns {string} - The HTML string for the project card.
 */
export function generateProjectCardHtml(project) {
  const tagsHtml = project.tags.map(generateTagHtml).join('\n              ');
  
  // Ensure description is safe (basic escaping could be added if needed, but assuming trusted JSON source)
  const description = project.description || '';
  
  return `
        <article class="project-card" data-project="${project.id}" data-scroll-animate>
          <div class="project-number">${project.number}</div>
          <div class="project-content">
            <h3 class="project-title">${project.title}</h3>
            <p class="project-description">${description}</p>
            <div class="project-tags">
              ${tagsHtml}
            </div>
          </div>
          <div class="project-3d-container" data-3d-target="${project.id}">
            <canvas class="project-canvas" id="canvas-${project.id}"></canvas>
          </div>
          <button class="project-expand" aria-label="Expand project">
            <span class="expand-icon">+</span>
          </button>
        </article>`;
}

/**
 * Fetches the objects data and generates the grid HTML.
 * @param {string} url - The URL to objects.json.
 * @returns {Promise<string>} - A promise that resolves to the full HTML grid string.
 */
export async function generateProjectsGrid(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch objects.json: ${response.statusText}`);
    }
    const objects = await response.json();
    return {
        html: objects.map(generateProjectCardHtml).join('\n'),
        objects: objects
    };
  } catch (error) {
    console.error('Error generating projects grid:', error);
    return { html: '<p>Error loading projects.</p>', objects: [] };
  }
}
