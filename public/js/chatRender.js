// Shared between the user messages page and the admin conversation view.
const ChatRender = (() => {
  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  // Escapes first, then turns bare URLs into safe, explicit links.
  // Only http(s) links are ever linkified.
  function linkify(escapedText) {
    const urlPattern = /((https?:\/\/)[^\s<]+)/g;
    return escapedText.replace(urlPattern, (url) => {
      const clean = url.replace(/[),.;!?]+$/, '');
      return `<a href="${clean}" target="_blank" rel="noopener noreferrer nofollow ugc">${clean}</a>`;
    });
  }

  function renderBody(text) {
    return linkify(escapeHtml(text)).replace(/\n/g, '<br>');
  }

  function formatSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function renderAttachments(attachments) {
    if (!attachments || attachments.length === 0) return '';
    const parts = attachments.map((a) => {
      if (a.kind === 'image') {
        return `<a href="${a.url}" target="_blank" rel="noopener noreferrer"><img src="${a.url}" alt="${escapeHtml(a.name || 'attachment')}"></a>`;
      }
      return `<a class="msg-file-link" href="${a.url}" target="_blank" rel="noopener noreferrer" download>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        ${escapeHtml(a.name || 'file')} <span style="opacity:0.6;">(${formatSize(a.size)})</span>
      </a>`;
    });
    return `<div class="msg-attachments">${parts.join('')}</div>`;
  }

  return { escapeHtml, renderBody, renderAttachments, formatSize };
})();
