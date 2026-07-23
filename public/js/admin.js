(function () {
  'use strict';

  function esc(s) { return ChatRender.escapeHtml(s); }

  function years(g) {
    const b = g.date_of_birth ? g.date_of_birth.slice(0, 4) : '?';
    const d = g.date_of_death ? g.date_of_death.slice(0, 4) : '?';
    return (b === '?' && d === '?') ? '' : `${b} – ${d}`;
  }

  // ---- Stats -------------------------------------------------------------
  async function loadStats() {
    try {
      const { graves, userCount, cemeteryCount } = await Api.get('/api/admin/stats');
      document.getElementById('statRow').innerHTML = `
        <div class="stat-card"><div class="num">${graves.pending}</div><div class="label">Pending review</div></div>
        <div class="stat-card"><div class="num">${graves.approved}</div><div class="label">Approved</div></div>
        <div class="stat-card"><div class="num">${userCount}</div><div class="label">Registered users</div></div>
        <div class="stat-card"><div class="num">${cemeteryCount}</div><div class="label">Cemeteries</div></div>
      `;
    } catch (_) { /* non-fatal */ }
  }

  // ---- Review queue --------------------------------------------------------
  async function loadReviewList(status) {
    const pane = document.getElementById('reviewPane');
    pane.innerHTML = `<p class="muted">Loading…</p>`;
    try {
      const { graves } = await Api.get(`/api/admin/graves?status=${status}`);
      if (graves.length === 0) {
        pane.innerHTML = `<div class="empty-state"><p>No ${status} submissions.</p></div>`;
        return;
      }
      pane.innerHTML = graves.map((g) => `
        <div class="card review-card" style="margin-bottom:14px;" data-id="${g.id}">
          <img class="review-photo" src="${g.photos[0] ? g.photos[0].url : ''}" onerror="this.style.visibility='hidden'" alt="">
          <div>
            <h3 style="margin-bottom:4px;">${esc(g.first_name)} ${esc(g.last_name)}${g.maiden_name ? ` <span class="muted" style="font-weight:400;">(née ${esc(g.maiden_name)})</span>` : ''}</h3>
            <p class="muted" style="margin-bottom:4px;">${esc(years(g))} ${g.plot_reference ? '· ' + esc(g.plot_reference) : ''}</p>
            <p class="muted" style="font-size:0.85rem; margin-bottom:4px;">Submitted by ${esc(g.submitter_name || 'Unknown')} (${esc(g.submitter_email || '—')})</p>
            <p class="mono muted" style="font-size:0.8rem; margin-bottom:4px;">${g.latitude.toFixed(5)}, ${g.longitude.toFixed(5)}</p>
            ${g.submitter_note ? `<p style="font-size:0.85rem; background:var(--brass-100); padding:6px 10px; border-radius:6px;">Note: ${esc(g.submitter_note)}</p>` : ''}
            ${g.status === 'rejected' && g.rejection_reason ? `<p style="font-size:0.85rem; color:var(--danger-600);">Rejected: ${esc(g.rejection_reason)}</p>` : ''}
          </div>
          <div class="review-actions">
            ${status === 'pending' ? `
              <button class="btn btn-primary btn-sm" data-approve="${g.id}">Approve</button>
              <button class="btn btn-danger btn-sm" data-reject="${g.id}">Reject</button>
            ` : ''}
            <a class="btn btn-ghost btn-sm" href="/grave.html?id=${g.id}" target="_blank">Preview</a>
          </div>
        </div>
      `).join('');

      pane.querySelectorAll('[data-approve]').forEach((btn) => {
        btn.addEventListener('click', () => approve(btn.dataset.approve, status));
      });
      pane.querySelectorAll('[data-reject]').forEach((btn) => {
        btn.addEventListener('click', () => reject(btn.dataset.reject, status));
      });
    } catch (err) {
      pane.innerHTML = `<div class="alert alert-error">${esc(err.message)}</div>`;
    }
  }

  async function approve(id, status) {
    try {
      await Api.post(`/api/admin/graves/${id}/approve`, {});
      loadReviewList(status);
      loadStats();
    } catch (err) { alert(err.message); }
  }

  async function reject(id, status) {
    const reason = prompt('Reason for rejecting this submission (shown to the submitter):');
    if (!reason || !reason.trim()) return;
    try {
      await Api.post(`/api/admin/graves/${id}/reject`, { reason: reason.trim() });
      loadReviewList(status);
      loadStats();
    } catch (err) { alert(err.message); }
  }

  // ---- Messaging -----------------------------------------------------------
  let activeConvId = null;
  let pendingFiles = [];

  async function loadConversations() {
    const list = document.getElementById('convList');
    try {
      const { conversations } = await Api.get('/api/admin/conversations');
      if (conversations.length === 0) {
        list.innerHTML = `<p class="muted" style="padding:8px;">No messages yet.</p>`;
      } else {
        list.innerHTML = conversations.map((c) => `
          <div class="conv-row ${c.id === activeConvId ? 'active' : ''}" data-id="${c.id}">
            <div style="overflow:hidden;">
              <div style="font-weight:600;">${esc(c.user_name)}</div>
              <div class="muted" style="font-size:0.8rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(c.last_body || '')}</div>
            </div>
            ${c.admin_unread_count > 0 ? `<span class="conv-unread">${c.admin_unread_count}</span>` : ''}
          </div>
        `).join('');
        list.querySelectorAll('.conv-row').forEach((row) => {
          row.addEventListener('click', () => openConversation(Number(row.dataset.id)));
        });
      }
      const totalUnread = conversations.reduce((s, c) => s + c.admin_unread_count, 0);
      const badge = document.getElementById('convUnreadBadge');
      if (totalUnread > 0) { badge.hidden = false; badge.textContent = totalUnread; } else { badge.hidden = true; }
    } catch (err) {
      list.innerHTML = `<div class="alert alert-error">${esc(err.message)}</div>`;
    }
  }

  function renderChat(messages) {
    return messages.map((m) => `
      <div class="msg-bubble ${m.sender_role === 'admin' ? 'msg-admin' : 'msg-user'}">
        <div>${ChatRender.renderBody(m.body || '')}</div>
        ${ChatRender.renderAttachments(m.attachments)}
        <div class="msg-meta">${esc(m.sender_role === 'admin' ? (m.sender_name || 'Admin') : m.sender_name)} · ${new Date(m.created_at).toLocaleString()}</div>
      </div>
    `).join('');
  }

  async function openConversation(id) {
    activeConvId = id;
    pendingFiles = [];
    document.querySelectorAll('.conv-row').forEach((r) => r.classList.toggle('active', Number(r.dataset.id) === id));
    const detail = document.getElementById('convDetail');
    detail.innerHTML = `<p class="muted">Loading…</p>`;
    try {
      const { conversation, messages } = await Api.get(`/api/admin/conversations/${id}`);
      detail.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div><strong>${esc(conversation.user_name)}</strong> <span class="muted">(${esc(conversation.user_email)})</span></div>
          <button class="btn btn-ghost btn-sm" id="toggleStatusBtn">${conversation.status === 'open' ? 'Close thread' : 'Reopen thread'}</button>
        </div>
        <div class="chat-log" id="adminChatLog">${renderChat(messages)}</div>
        <div id="adminComposerAlert" style="margin-top:10px;"></div>
        <div class="photo-previews" id="adminAttachPreviews" style="margin-top:8px;"></div>
        <div style="display:flex; gap:8px; margin-top:10px;">
          <button class="btn btn-ghost btn-sm" id="adminAttachBtn" type="button">📎</button>
          <input type="file" id="adminAttachInput" class="visually-hidden" multiple accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document">
          <textarea id="adminReplyBody" placeholder="Type a reply…" style="flex:1; min-height:44px;"></textarea>
          <button class="btn btn-primary btn-sm" id="adminSendBtn">Send</button>
        </div>
      `;
      document.getElementById('adminChatLog').scrollTop = document.getElementById('adminChatLog').scrollHeight;

      document.getElementById('toggleStatusBtn').addEventListener('click', async () => {
        const newStatus = conversation.status === 'open' ? 'closed' : 'open';
        try { await Api.post(`/api/admin/conversations/${id}/status`, { status: newStatus }); openConversation(id); loadConversations(); }
        catch (err) { alert(err.message); }
      });

      document.getElementById('adminAttachBtn').addEventListener('click', () => document.getElementById('adminAttachInput').click());
      document.getElementById('adminAttachInput').addEventListener('change', (e) => {
        pendingFiles = Array.from(e.target.files).slice(0, 4);
        document.getElementById('adminAttachPreviews').innerHTML = pendingFiles.map((f) => `<span class="muted" style="font-size:0.78rem;">${esc(f.name)}</span>`).join(', ');
      });

      document.getElementById('adminSendBtn').addEventListener('click', () => sendReply(id));
      document.getElementById('adminReplyBody').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(id); }
      });

      loadConversations(); // refresh unread badges
    } catch (err) {
      detail.innerHTML = `<div class="alert alert-error">${esc(err.message)}</div>`;
    }
  }

  async function sendReply(id) {
    const textarea = document.getElementById('adminReplyBody');
    const body = textarea.value.trim();
    const alertBox = document.getElementById('adminComposerAlert');
    if (!body) { alertBox.innerHTML = `<div class="alert alert-error">Write a reply first.</div>`; return; }
    alertBox.innerHTML = '';

    const fd = new FormData();
    fd.append('body', body);
    pendingFiles.forEach((f) => fd.append('attachments', f));

    try {
      const { messages } = await Api.post(`/api/admin/conversations/${id}/send`, fd, true);
      document.getElementById('adminChatLog').innerHTML = renderChat(messages);
      document.getElementById('adminChatLog').scrollTop = document.getElementById('adminChatLog').scrollHeight;
      textarea.value = '';
      pendingFiles = [];
      document.getElementById('adminAttachPreviews').innerHTML = '';
    } catch (err) {
      alertBox.innerHTML = `<div class="alert alert-error">${esc(err.message)}</div>`;
    }
  }

  // ---- Tabs ------------------------------------------------------------
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const key = tab.dataset.tab;
      const reviewPane = document.getElementById('reviewPane');
      const messagesPane = document.getElementById('messagesPane');
      if (key === 'messages') {
        reviewPane.hidden = true;
        messagesPane.hidden = false;
        loadConversations();
      } else {
        reviewPane.hidden = false;
        messagesPane.hidden = true;
        loadReviewList(key);
      }
    });
  });

  // ---- Guard + init ------------------------------------------------------
  (async function init() {
    let user;
    try { ({ user } = await Api.get('/api/auth/me')); } catch (_) { user = null; }
    if (!user || user.role !== 'admin') {
      window.location.href = '/login.html?next=' + encodeURIComponent('/admin/dashboard.html');
      return;
    }
    loadStats();
    loadReviewList('pending');
  })();
})();
