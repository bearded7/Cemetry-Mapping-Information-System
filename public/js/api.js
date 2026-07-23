// Thin fetch wrapper shared by every page.
// - Automatically attaches the CSRF token (fetched once, cached) to any
//   state-changing request.
// - Normalizes error handling so pages can just `catch` and show err.message.

const Api = (() => {
  async function getCsrfToken() {
    const res = await fetch('/api/csrf-token', { credentials: 'same-origin' });
    const data = await res.json();
    return data.csrfToken;
  }

  async function request(method, url, body, isFormData = false) {
    const headers = {};
    const opts = { method, credentials: 'same-origin', headers };

    if (!['GET', 'HEAD'].includes(method)) {
      headers['X-CSRF-Token'] = await getCsrfToken();
    }

    if (body !== undefined) {
      if (isFormData) {
        opts.body = body; // browser sets multipart content-type + boundary
      } else {
        headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
      }
    }

    const res = await fetch(url, opts);
    let data = null;
    try { data = await res.json(); } catch (_) { /* empty body */ }

    if (!res.ok) {
      const message = (data && data.error) || `Request failed (${res.status})`;
      const err = new Error(message);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  return {
    get: (url) => request('GET', url),
    post: (url, body, isFormData) => request('POST', url, body, isFormData),
    del: (url) => request('DELETE', url),
  };
})();
