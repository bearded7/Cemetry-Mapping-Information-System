(function () {
  'use strict';

  let pendingFiles = [];

  function scrollToBottom() {
    const log = document.getElementById('chatLog');
    log.scrollTop = log.scrollHeight;
  }

  function renderMessages(messages) {
    const log = document.getElementById('chatLog');
    if (messages.length === 0) {
      log.innerHTML = `<div class="empty-state"><p>No messages yet — say hello below.</p></div>`;
      return;
    }
    log.innerHTML = messages.map((m) => `
      <div class="msg-bubble ${m.sender_role === 'user' ? 'msg-user' : 'msg-admin'}">
        <div>${ChatRender.renderBody(m.body || '')}</div>
        ${ChatRender.renderAttachments(m.attachments)}
        <div class="msg-meta">${m.sender_role === 'admin' ? 'Cemetery office' : 'You'} · ${new Date(m.created_at).toLocaleString()}</div>
      </div>
    `).join('');
    scrollToBottom();
  }

  async function loadConversation() {
    try {
      const { messages } = await Api.get('/api/messages/conversation');
      renderMessages(messages);
    } catch (err) {
      document.getElementById('chatLog').innerHTML = `<div class="alert alert-error">${ChatRender.escapeHtml(err.message)}</div>`;
    }
  }

  function renderAttachPreviews() {
    const wrap = document.getElementById('attachPreviews');
    wrap.innerHTML = pendingFiles.map((f, i) => `
      <span class="attach-chip" data-idx="${i}">${ChatRender.escapeHtml(f.name)} <button type="button" aria-label="Remove" style="border:none;background:none;cursor:pointer;">✕</button></span>
    `).join('');
    wrap.querySelectorAll('.attach-chip button').forEach((btn, i) => {
      btn.addEventListener('click', () => { pendingFiles.splice(i, 1); renderAttachPreviews(); });
    });
  }

  document.getElementById('attachBtn').addEventListener('click', () => document.getElementById('attachInput').click());
  document.getElementById('attachInput').addEventListener('change', (e) => {
    pendingFiles = pendingFiles.concat(Array.from(e.target.files)).slice(0, 4);
    renderAttachPreviews();
  });

  async function send() {
    const textarea = document.getElementById('messageBody');
    const body = textarea.value.trim();
    const alertBox = document.getElementById('composerAlert');
    alertBox.innerHTML = '';
    if (!body) { alertBox.innerHTML = `<div class="alert alert-error">Write a message first.</div>`; return; }

    const btn = document.getElementById('sendBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';

    const fd = new FormData();
    fd.append('body', body);
    pendingFiles.forEach((f) => fd.append('attachments', f));

    try {
      const { messages } = await Api.post('/api/messages/conversation/send', fd, true);
      renderMessages(messages);
      textarea.value = '';
      pendingFiles = [];
      renderAttachPreviews();
    } catch (err) {
      alertBox.innerHTML = `<div class="alert alert-error">${ChatRender.escapeHtml(err.message)}</div>`;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send';
    }
  }

  document.getElementById('sendBtn').addEventListener('click', send);
  document.getElementById('messageBody').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });

  (async function guard() {
    let user;
    try { ({ user } = await Api.get('/api/auth/me')); } catch (_) { user = null; }
    if (!user) { window.location.href = '/login.html?next=' + encodeURIComponent('/messages.html'); return; }
    loadConversation();
  })();
})();
