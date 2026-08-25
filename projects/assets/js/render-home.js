(function () {
  const grid = document.getElementById('projects-grid');

  if (!grid) return;

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

      if (!merged.title) merged.title = slug;
      if (!merged.tagline) merged.tagline = 'Project details coming soon.';
      if (!merged.mainImage) merged.mainImage = 'assets/images/placeholder.svg';
      if (!merged.github) merged.github = '#';
      return merged;
    } catch (error) {
      console.warn(`Project metadata unavailable for ${slug}.`, error);
      return merged;
    }
  }

  function renderProject(project) {
    const card = document.createElement('a');
    card.className = 'project-card';
    card.href = `./${project.slug}/index.html`;
    card.setAttribute('aria-label', `Open ${project.title}`);

    const image = document.createElement('img');
    image.className = 'project-card__image';
    image.alt = project.title;
    const imageSrc = project.mainImage && project.mainImage.startsWith('http')
      ? project.mainImage
      : `./${project.slug}/${project.mainImage}`;

    image.src = imageSrc;
    image.onerror = () => {
      image.classList.add('project-card__image--placeholder');
      image.replaceWith(createPlaceholder(project.title));
    };

    const body = document.createElement('div');
    body.className = 'project-card__body';
    body.innerHTML = `
      <h2 class="project-card__title">${project.title}</h2>
      <p class="project-card__tagline">${project.tagline}</p>
    `;

    card.append(image, body);
    grid.appendChild(card);
  }

  function createPlaceholder(label) {
    const placeholder = document.createElement('div');
    placeholder.className = 'project-card__image project-card__image--placeholder';
    placeholder.textContent = label;
    return placeholder;
  }

  async function init() {
    const manifest = await loadManifest();
    const projects = manifest.projects || [];

    if (!projects.length) {
      grid.innerHTML = '<div class="empty-state">No projects are currently listed.</div>';
      return;
    }

    const results = await Promise.all(projects.map(loadProject));
    results.forEach(renderProject);
  }

  init();
})();
