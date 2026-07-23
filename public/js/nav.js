(function () {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  const actions = document.getElementById('navActions');
  if (!actions) return;

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  Api.get('/api/auth/me')
    .then(({ user }) => {
      if (!user) {
        actions.innerHTML = `
          <a class="btn btn-ghost btn-sm" href="/login.html">Log in</a>
          <a class="btn btn-primary btn-sm" href="/register.html">Register</a>
        `;
        return;
      }

      const adminLink = user.role === 'admin'
        ? `<a class="btn btn-ghost btn-sm" href="/admin/dashboard.html">Admin review</a>`
        : '';

      actions.innerHTML = `
        <span class="muted" style="font-size:0.85rem;">Hi, ${escapeHtml(user.fullName.split(' ')[0])}</span>
        ${adminLink}
        <a class="btn btn-ghost btn-sm" href="/my-submissions.html">My submissions</a>
        <a class="btn btn-ghost btn-sm" href="/messages.html" id="messagesLink" style="position:relative;">Messages<span id="unreadDot" hidden style="position:absolute; top:2px; right:2px; width:8px; height:8px; border-radius:50%; background:#A23B33;"></span></a>
        <button class="btn btn-secondary btn-sm" id="logoutBtn" type="button">Log out</button>
      `;

      if (user.role !== 'admin') {
        Api.get('/api/messages/unread-count').then(({ unread }) => {
          if (unread > 0) document.getElementById('unreadDot').hidden = false;
        }).catch(() => {});
      }

      document.getElementById('logoutBtn').addEventListener('click', async () => {
        try {
          await Api.post('/api/auth/logout');
          window.location.href = '/';
        } catch (err) {
          alert('Could not log out: ' + err.message);
        }
      });
    })
    .catch(() => {
      actions.innerHTML = `<a class="btn btn-ghost btn-sm" href="/login.html">Log in</a>`;
    });
})();
