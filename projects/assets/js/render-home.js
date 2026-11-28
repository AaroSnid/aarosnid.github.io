(function () {
  const listing = document.getElementById('projects-grid');

  if (!listing) return;

  async function loadManifest() {
    try {
      const response = await fetch('manifest.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to load manifest');
      return response.json();
    } catch (error) {
      console.warn('Projects manifest failed to load.', error);
      return { projects: [] };
    }
  }

  async function loadProject(projectEntry) {
    const slug = projectEntry.slug;
    const base = `./${slug}/`;
    const merged = { ...projectEntry };

    try {
      const response = await fetch(`${base}project.json`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Missing project metadata for ${slug}`);
      const data = await response.json();

      Object.keys(data).forEach((key) => {
        if (!(key in merged)) {
          merged[key] = data[key];
        }
      });
    } catch (error) {
      console.warn(`Project metadata unavailable for ${slug}.`, error);
    }

    if (!merged.title) merged.title = slug;
    if (!merged.tagline) merged.tagline = 'Project details coming soon.';
    return merged;
  }

  function span(className, text) {
    const el = document.createElement('span');
    el.className = className;
    el.textContent = text;
    return el;
  }

  // One terminal-style listing row: slug, status tag, tagline.
  function renderProject(project) {
    const entry = document.createElement('a');
    entry.className = 'entry';
    entry.href = `./${project.slug}/index.html`;
    entry.setAttribute('aria-label', `Open ${project.title}`);

    entry.appendChild(span('name', project.slug));

    const tag = [project.status, project.version].filter(Boolean).join(' · ').toLowerCase();
    if (tag) {
      entry.appendChild(document.createTextNode(' '));
      entry.appendChild(span('tag', tag));
    }

    entry.appendChild(span('desc', project.tagline));
    listing.appendChild(entry);
  }

  async function init() {
    const manifest = await loadManifest();
    const projects = manifest.projects || [];

    if (!projects.length) {
      listing.innerHTML = '<div class="empty-state">No projects are currently listed.</div>';
      return;
    }

    const results = await Promise.all(projects.map(loadProject));
    results.forEach(renderProject);
  }

  init();
})();
