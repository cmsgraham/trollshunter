const API_BASE = '/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchTrolls({ page = 1, perPage = 20, category, country, search, sortBy = 'upvotes' } = {}) {
  const params = new URLSearchParams({ page, per_page: perPage, sort_by: sortBy });
  if (category) params.set('category', category);
  if (country) params.set('country', country);
  if (search) params.set('search', search);

  const res = await fetch(`${API_BASE}/trolls?${params}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch trolls');
  return res.json();
}

export async function getTroll(id) {
  const res = await fetch(`${API_BASE}/trolls/${id}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Troll not found');
  return res.json();
}

export async function reportTroll(data) {
  const res = await fetch(`${API_BASE}/trolls`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to report troll');
  }
  return res.json();
}

export async function castVote(trollId, voteType) {
  const res = await fetch(`${API_BASE}/trolls/${trollId}/votes`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ vote_type: voteType }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to vote');
  }
  return res.json();
}

export async function getMe() {
  const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Not authenticated');
  return res.json();
}

export async function getLoginXUrl() {
  const res = await fetch(`${API_BASE}/auth/login-x`);
  if (!res.ok) throw new Error('Failed to get X login URL');
  return res.json();
}

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Login failed');
  }
  return res.json();
}

export async function register(username, email, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Registration failed');
  }
  return res.json();
}

export async function getStats() {
  const res = await fetch(`${API_BASE}/trolls/stats/summary`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function blockTroll(trollId) {
  const res = await fetch(`${API_BASE}/trolls/${trollId}/block`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to block');
  }
  return res.json();
}

export async function detectCountry() {
  const res = await fetch(`${API_BASE}/geo`);
  if (!res.ok) return { country_code: 'US', country_name: 'United States' };
  return res.json();
}

export async function fetchPending({ page = 1 } = {}) {
  const params = new URLSearchParams({ page, per_page: 20 });
  const res = await fetch(`${API_BASE}/admin/pending?${params}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch pending');
  return res.json();
}

export async function approveTroll(trollId) {
  const res = await fetch(`${API_BASE}/admin/${trollId}/approve`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to approve');
  }
  return res.json();
}

export async function rejectTroll(trollId) {
  const res = await fetch(`${API_BASE}/admin/${trollId}/reject`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to reject');
  }
  return res.json();
}

export async function fetchDisputed({ page = 1 } = {}) {
  const params = new URLSearchParams({ page, per_page: 20 });
  const res = await fetch(`${API_BASE}/admin/disputed?${params}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch disputed');
  return res.json();
}

export async function dismissDisputes(trollId) {
  const res = await fetch(`${API_BASE}/admin/${trollId}/dismiss`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to dismiss');
  }
  return res.json();
}

export async function removeTroll(trollId) {
  const res = await fetch(`${API_BASE}/admin/${trollId}/remove`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to remove');
  }
  return res.json();
}

export async function fetchReports({ page = 1 } = {}) {
  const params = new URLSearchParams({ page, per_page: 20 });
  const res = await fetch(`${API_BASE}/admin/reports?${params}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch reports');
  return res.json();
}
