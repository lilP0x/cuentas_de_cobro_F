// Cliente simple para la API "hacha" (FastAPI)
// Uso:
// import api from '../api/api';
// api.setBaseUrl('http://localhost:8000');
// await api.getClients();

const DEFAULT_BASE = 'http://localhost:8000';

const api = {
    baseUrl: DEFAULT_BASE,
    token: null,

    setBaseUrl(url) {
        this.baseUrl = url.replace(/\/$/, '');
    },

    setToken(t) {
        this.token = t;
    },

    async request(path, options = {}) {
        const url = path.startsWith('http') ? path : `${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
        const headers = Object.assign({ 'Accept': 'application/json' }, options.headers || {});
        if (!(options.body instanceof FormData)) headers['Content-Type'] = headers['Content-Type'] || 'application/json';
        if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

        const opts = Object.assign({}, options, { headers });
        if (opts.body && typeof opts.body !== 'string' && !(opts.body instanceof FormData)) opts.body = JSON.stringify(opts.body);

        const res = await fetch(url, opts);
        const text = await res.text();
        let data = null;
        try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
        if (!res.ok) {
            const err = new Error(data && data.detail ? data.detail : `HTTP ${res.status}`);
            err.status = res.status;
            err.body = data;
            throw err;
        }
        return data;
    },

    // Clients
    getClients() { return this.request('/clients', { method: 'GET' }); },
    getClient(id) { return this.request(`/clients/${id}`, { method: 'GET' }); },
    createClient(client) { return this.request('/clients', { method: 'POST', body: client }); },
    updateClient(id, client) { return this.request(`/clients/${id}`, { method: 'PUT', body: client }); },
    deleteClient(id) { return this.request(`/clients/${id}`, { method: 'DELETE' }); },

    // Invoices (ejemplo)
    getInvoices() { return this.request('/invoices', { method: 'GET' }); },
    getInvoice(id) { return this.request(`/invoices/${id}`, { method: 'GET' }); },
    createInvoice(inv) { return this.request('/invoices', { method: 'POST', body: inv }); },

    // Utilidad para probar conexión
    async ping() {
        try {
            await this.request('/ping');
            return true;
        } catch (e) {
            return false;
        }
    }
};

export default api;

