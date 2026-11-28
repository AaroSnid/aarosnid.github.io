(function () {
  const titleEl = document.getElementById('project-title');
  const statusEl = document.getElementById('project-status');
  const versionEl = document.getElementById('project-version');
  const heroEl = document.getElementById('project-hero');
  const descriptionEl = document.getElementById('project-description');
  const githubLinkEl = document.getElementById('project-github-link');

  async function init() {
    try {
      const response = await fetch('./project.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('project.json not found');
      const project = await response.json();

      if (titleEl && project.title) titleEl.textContent = project.title;
      // #project-eyebrow (category, e.g. "Embedded project") stays as authored
      // in the HTML; status and version come from project.json.
      if (statusEl && project.status) statusEl.textContent = project.status;
      if (versionEl && project.version) versionEl.textContent = project.version;
      if (descriptionEl && project.description) descriptionEl.textContent = project.description;
      if (githubLinkEl && project.github) githubLinkEl.href = project.github;
      if (heroEl && project.mainImage) {
        const imagePath = project.mainImage.startsWith('http') ? project.mainImage : `./${project.mainImage}`;
        heroEl.src = imagePath;
        if (!heroEl.alt) heroEl.alt = project.title || 'Project hero image';
      }
      if (project.title) {
        document.title = project.title;
      }
    } catch (error) {
      console.warn('Project page metadata could not be loaded.', error);
    }
  }

  init();
})();
