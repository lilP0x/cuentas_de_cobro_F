import React, { useMemo, useState, useEffect } from 'react';
import api from '../api/api.js';
import '../styles/crearCuenta.css';

const initialItems = [

];

function formatMoney(value) {
  if (isNaN(value)) return '$0';
  return '$' + new Intl.NumberFormat('es-CO').format(value);
}

const CrearCuenta = () => {
  const [items, setItems] = useState(initialItems);
  const [client, setClient] = useState({ name: '', nit: '', phone: '', address: '' });
  const [invoice, setInvoice] = useState({ number: '', issueDate: '', dueDate: '', city: '' });
  const [hasDueDate, setHasDueDate] = useState(false);
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', nit: '', phone: '', address: '' });

  const subtotal = useMemo(() => items.reduce((s, it) => s + Number(it.qty || 0) * Number(it.price || 0), 0), [items]);
  const total = subtotal;

  const addItem = () => {
    const id = items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
    setItems([...items, { id, desc: '', qty: 1, price: 0 }]);
  };

  useEffect(() => {
    // cargar clientes desde el backend al montar
    let mounted = true;
    async function fetchClients() {
      setClientsLoading(true);
      try {
        const data = await api.getClients();
        if (mounted) setClients(data || []);
      } catch (err) {
        console.error(err);
        if (mounted) setClients([]);
      } finally {
        if (mounted) setClientsLoading(false);
      }
    }
    fetchClients();
    return () => { mounted = false };
  }, []);

  const handleSelectClient = (id) => {
    const c = clients.find(x => String(x.id) === String(id));
    if (c) setClient({ name: c.client_name || 'asdafsdf'});
  };

  const saveNewClient = async () => {
    try {
      const saved = await api.createClient(newClient);
      setClients(prev => [saved, ...prev]);
      setClient({ name: saved.name || '', nit: saved.nit || '', phone: saved.phone || '', address: saved.address || '' });
      setShowNewClientForm(false);
      setNewClient({ name: '', nit: '', phone: '', address: '' });
    } catch (err) {
      console.error(err);
      // si no hay backend, añadir localmente con id temporal
      const temp = { id: Date.now(), ...newClient };
      setClients(prev => [temp, ...prev]);
      setClient(newClient);
      setShowNewClientForm(false);
      setNewClient({ name: '', nit: '', phone: '', address: '' });
    }
  };

  const removeItem = (id) => setItems(items.filter(i => i.id !== id));

  const updateItem = (id, field, value) => {
    setItems(items.map(i => (i.id === id ? { ...i, [field]: field === 'desc' ? value : Number(value || 0) } : i)));
  };

  return (
    <div className="cc-page">


      <div className="cc-wrap">
        <div className="left-col">
          <h1>Crear Cuenta de Cobro</h1>
          <div className="left-content">
          <section className="card info-card">
            <div className="card-header">Información General</div>
            <div className="card-body grid-2">
              <label>
                Número de Cuenta
                <input value={invoice.number} onChange={e => setInvoice({ ...invoice, number: e.target.value })} />
              </label>
              <label>
                Fecha de Emisión
                <input type="date" value={invoice.issueDate} onChange={e => setInvoice({ ...invoice, issueDate: e.target.value })} />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={hasDueDate}
                  onChange={e => {
                    const checked = e.target.checked;
                    setHasDueDate(checked);
                    if (!checked) setInvoice({ ...invoice, dueDate: '' });
                  }}
                />
                Habilitar fecha de vencimiento
              </label>

              {hasDueDate && (
                <label>
                  Fecha de Vencimiento
                  <input type="date" value={invoice.dueDate} onChange={e => setInvoice({ ...invoice, dueDate: e.target.value })} />
                </label>
              )}
            </div>
          </section>

          <section className="card info-card">
            <div className="card-header">Datos del Cliente</div>
            <div className="card-body">
              {/* Selección de cliente existente o formulario para nuevo cliente */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <select className="client-select" onChange={e => handleSelectClient(e.target.value)} value={clients.find(c => c.client_name === client.name)?.id || ''}>
                  <option value="">-- Seleccionar cliente --</option>
                  {clientsLoading && <option> Cargando... </option>}
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.client_name}</option>
                  ))}
                </select>
                <button type="button" className="btn-outline" onClick={() => setShowNewClientForm(s => !s)}>{showNewClientForm ? 'Cancelar' : 'Nuevo cliente'}</button>
              </div>

              {showNewClientForm ? (
                <div className="new-client-form">
                  <label>
                    Nombre o Razón Social
                    <input value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} placeholder="Nombre cliente" />
                  </label>
                  <div className="grid-2">
                    <label>
                      NIT / Documento
                      <input value={newClient.nit} onChange={e => setNewClient({ ...newClient, nit: e.target.value })} />
                    </label>
                    <label>
                      Teléfono
                      <input value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} />
                    </label>
                  </div>
                  <label>
                    Dirección
                    <input value={newClient.address} onChange={e => setNewClient({ ...newClient, address: e.target.value })} />
                  </label>
                  <div style={{ marginTop: 8 }}>
                    <button type="button" className="btn-primary" onClick={saveNewClient}>Guardar cliente</button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Cuando no estamos creando un cliente nuevo, ocultamos inputs y mostramos la info seleccionada en solo lectura */}
                  {client.name ? (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontWeight: 700 }}>{client.name}</div>
                      <div style={{ color: '#bdbdbd' }}>{client.address}</div>
                    </div>
                  ) : (
                    <div style={{ color: '#bdbdbd', marginBottom: 8 }}>Selecciona un cliente existente o crea uno nuevo</div>
                  )}

                  <div className="grid-2">
                    <div>{client.nit ? <div><strong>NIT:</strong> {client.nit}</div> : null}</div>
                    <div>{client.phone ? <div><strong>Teléfono:</strong> {client.phone}</div> : null}</div>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="card concepts-card">
            <div className="card-header">
              <span>Conceptos / Servicios</span>
              <button className="btn-add" onClick={addItem}>+ Agregar Item</button>
            </div>
            <div className="card-body">
              <div className="items-list">
                {items.map(item => (
                  <div className="item-row" key={item.id}>
                    <input className="desc" value={item.desc} onChange={e => updateItem(item.id, 'desc', e.target.value)} placeholder="Descripción" />
                    <input className="qty" type="number" min="0" value={item.qty} onChange={e => updateItem(item.id, 'qty', e.target.value)} />
                    <input className="price" type="number" min="0" value={item.price} onChange={e => updateItem(item.id, 'price', e.target.value)} />
                    <button className="btn-remove" onClick={() => removeItem(item.id)}>Eliminar</button>
                  </div>
                ))}
              </div>

              <div className="calc">
                <div>Subtotal <strong>{formatMoney(subtotal)}</strong></div>
                <div className="grand">Total a Pagar <strong>{formatMoney(total)} COP</strong></div>
              </div>
            </div>
          </section>

          </div>
        </div>

        <aside className="right-col">
          <div className="preview-header">
            <div className="preview-label">Vista Previa</div>
          </div>

          <div className="preview">
            <div className="preview-top">
              <div className="preview-title">CUENTA DE COBRO</div>
              <div className="preview-meta">#{invoice.number}</div>
            </div>
            <div className="preview-client">
              <div className="p-left">
                <div className="client-name">{client.name || 'Cristetto'}</div>
                <div className="client-id">NIT: {client.nit || '901.234.567-8'}</div>
              </div>
              <div className="p-right">
                <div>Fecha Emisión: {invoice.issueDate || 'Jul 15, 2024'}</div>
                <div>Fecha Vencimiento: {invoice.dueDate || 'Jul 30, 2024'}</div>
              </div>
            </div>

            <table className="preview-table">
              <thead>
                <tr><th>DESCRIPCIÓN</th><th>CANT.</th><th>VALOR UNIT.</th><th>TOTAL</th></tr>
              </thead>
              <tbody>
                {items.map(it => (
                  <tr key={it.id}>
                    <td>{it.desc || '—'}</td>
                    <td>{it.qty}</td>
                    <td>{formatMoney(it.price)}</td>
                    <td>{formatMoney(it.qty * it.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>


          </div>
        </aside>
      </div>

      <footer className="cc-footer">
        <div className="footer-left">TOTAL CALCULADO <div className="footer-total">{formatMoney(total)} COP</div></div>
        <div className="footer-actions">
          <button className="btn-primary">Generar PDF</button>
        </div>
      </footer>
    </div>
  );
};

export default CrearCuenta;
