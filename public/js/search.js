(function () {
  'use strict';

  let currentQuery = '';
  let currentPage = 1;

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function years(g) {
    const b = g.date_of_birth ? g.date_of_birth.slice(0, 4) : '?';
    const d = g.date_of_death ? g.date_of_death.slice(0, 4) : '?';
    if (b === '?' && d === '?') return 'Dates unknown';
    return `${b} – ${d}`;
  }

  async function search(page) {
    const resultsEl = document.getElementById('results');
    resultsEl.innerHTML = `<p class="muted">Searching…</p>`;
    try {
      const { graves, hasMore } = await Api.get(`/api/graves/search?q=${encodeURIComponent(currentQuery)}&page=${page}`);
      currentPage = page;

      if (graves.length === 0) {
        resultsEl.innerHTML = `
          <div class="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.6"/><path d="M21 21l-4.3-4.3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            <p>No approved records match “${escapeHtml(currentQuery)}”. Check the spelling, or the grave may not have been added yet.</p>
            <a class="btn btn-secondary btn-sm" href="/submit-grave.html">Add this grave</a>
          </div>`;
        document.getElementById('pager').hidden = true;
        return;
      }

      resultsEl.innerHTML = `<div class="grid-2">${graves.map((g) => `
        <div class="card">
          <h3 style="margin-bottom:4px;">${escapeHtml(g.first_name)} ${escapeHtml(g.last_name)}</h3>
          <p class="muted" style="margin-bottom:4px;">${escapeHtml(years(g))}</p>
          ${g.plot_reference ? `<p class="mono" style="font-size:0.82rem; color:var(--brass); margin-bottom:10px;">${escapeHtml(g.plot_reference)}</p>` : ''}
          <a class="btn btn-primary btn-sm" href="/map.html?graveId=${g.id}">View on map</a>
        </div>
      `).join('')}</div>`;

      document.getElementById('pager').hidden = false;
      document.getElementById('pageLabel').textContent = `Page ${page}`;
      document.getElementById('prevPage').disabled = page <= 1;
      document.getElementById('nextPage').disabled = !hasMore;
    } catch (err) {
      resultsEl.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
    }
  }

  document.getElementById('searchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    currentQuery = document.getElementById('q').value;
    if (!currentQuery.trim()) return;
    search(1);
  });
  document.getElementById('prevPage').addEventListener('click', () => search(Math.max(1, currentPage - 1)));
  document.getElementById('nextPage').addEventListener('click', () => search(currentPage + 1));

  const params = new URLSearchParams(window.location.search);
  const initialQ = params.get('q');
  if (initialQ) {
    document.getElementById('q').value = initialQ;
    currentQuery = initialQ;
    search(1);
  }
})();
