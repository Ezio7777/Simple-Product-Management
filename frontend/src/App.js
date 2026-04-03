import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import "./App.css";
import TaglineSection from "./TaglineSection";

const api = axios.create({ baseURL: "http://localhost:8000" });

function App() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ id: "", name: "", description: "", price: "", quantity: "" });
  const [editId, setEditId] = useState(null);
  const [status, setStatus] = useState({ msg: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState({ field: "id", dir: "asc" });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/products");
      setProducts(data);
    } catch (err) {
      showStatus("Failed to fetch products", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const showStatus = (msg, type = "success") => {
    setStatus({ msg, type });
    setTimeout(() => setStatus({ msg: "", type: "" }), 4000);
  };

  const handleSort = (field) => {
    setSort(prev => ({ field, dir: prev.field === field && prev.dir === "asc" ? "desc" : "asc" }));
  };

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => 
      [p.id, p.name, p.description].some(val => String(val).toLowerCase().includes(filter.toLowerCase()))
    );

    return result.sort((a, b) => {
      const aVal = a[sort.field], bVal = b[sort.field];
      const res = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sort.dir === "asc" ? res : -res;
    });
  }, [products, filter, sort]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Ensure ID is passed for POST, but we use editId for PUT
    const payload = { ...form, id: Number(form.id), price: Number(form.price), quantity: Number(form.quantity) };
    
    try {
      if (editId) {
        await api.put(`/products/${editId}`, payload);
        showStatus("Product updated!");
      } else {
        await api.post("/products", payload);
        showStatus("Product created!");
      }
      resetForm();
      fetchProducts();
    } catch (err) {
      showStatus(err.response?.data?.detail || "Action failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ id: "", name: "", description: "", price: "", quantity: "" });
    setEditId(null);
  };

  return (
    <div className="dashboard">
      <header className="navbar">
        <div className="nav-brand"><span>📦</span> Sunit Track</div>
        <div className="nav-search">
          <input 
            placeholder="Search inventory..." 
            value={filter} 
            onChange={e => setFilter(e.target.value)} 
          />
        </div>
        {/* Restored the "Refresh" button style */}
        <button className="btn btn-refresh" onClick={fetchProducts} disabled={loading}>
          Refresh List
        </button>
      </header>

      <main className="main-content">
        <aside className="sidebar">
          <div className="card form-card">
            <h3>{editId ? "Update Item" : "New Product"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                {/* ID is only editable for new products */}
                <input 
                  name="id" 
                  type="number" 
                  placeholder="ID" 
                  value={form.id} 
                  onChange={e => setForm({...form, id: e.target.value})} 
                  disabled={editId !== null} 
                  required 
                />
                <input name="name" placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
              <div className="input-group">
                <input name="price" type="number" step="0.01" placeholder="Price" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
                <input name="quantity" type="number" placeholder="Qty" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} required />
              </div>
              
              <button type="submit" className="btn-primary" disabled={loading}>
                {editId ? "Save Changes" : "Add to Stock"}
              </button>
              
              {editId && (
                <button type="button" className="btn-cancel" onClick={resetForm}>
                  Cancel Edit
                </button>
              )}
            </form>
            {status.msg && <div className={`alert ${status.type}`}>{status.msg}</div>}
          </div>
          <TaglineSection />
        </aside>

        {/* Scrollable Table Section */}
        <section className="table-wrapper card">
          <div className="table-scroll">
            <table className="modern-table">
              <thead>
                <tr>
                  {['id', 'name', 'price', 'quantity'].map(f => (
                    <th key={f} onClick={() => handleSort(f)} className="sortable">
                      {f.toUpperCase()} {sort.field === f ? (sort.dir === 'asc' ? '↑' : '↓') : ''}
                    </th>
                  ))}
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => (
                  <tr key={p.id}>
                    <td>#{p.id}</td>
                    <td><strong>{p.name}</strong><br/><small className="muted">{p.description}</small></td>
                    <td>${Number(p.price).toFixed(2)}</td>
                    <td><span className={`stock-tag ${p.quantity < 5 ? 'low' : ''}`}>{p.quantity}</span></td>
                    <td>
                      <button onClick={() => { setEditId(p.id); setForm(p); }} className="btn-icon">✏️</button>
                      <button onClick={async () => { if(window.confirm('Delete?')) { await api.delete(`/products/${p.id}`); fetchProducts(); }}} className="btn-icon">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;