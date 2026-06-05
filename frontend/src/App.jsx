import { useState, useEffect, useCallback } from "react";
import PatientTable from "./components/PatientTable";
import PatientModal from "./components/PatientModal";
import DeleteModal from "./components/DeleteModal";
import Toast from "./components/Toast";
import "./App.css";

const API = "http://localhost:5000/api";

export default function App() {
  const [patients, setPatients]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [modalOpen, setModalOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast]           = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchPatients = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/patients${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      const data = await res.json();
      setPatients(data);
    } catch {
      showToast("Failed to load patients.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchPatients(search), 300);
    return () => clearTimeout(t);
  }, [search, fetchPatients]);

  const handleCreate = () => { setEditTarget(null); setModalOpen(true); };
  const handleEdit   = (p)  => { setEditTarget(p);   setModalOpen(true); };

  const handleSave = async (formData, pid) => {
    const isEdit = !!pid;
    const url    = isEdit ? `${API}/patients/${pid}` : `${API}/patients`;
    const method = isEdit ? "PUT" : "POST";

    const res  = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await res.json();

    if (!res.ok) {
      return data.errors || [data.error || "Unknown error"];
    }

    setModalOpen(false);
    fetchPatients(search);
    showToast(isEdit ? "Patient updated successfully." : "Patient added successfully.");
    return null;
  };

  const handleDeleteConfirm = async () => {
    try {
      const res = await fetch(`${API}/patients/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteTarget(null);
        fetchPatients(search);
        showToast("Patient deleted.");
      } else {
        showToast("Failed to delete patient.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">⚕</span>
            <div>
              <h1>VitalCheck</h1>
              <p>Patient Health Prediction System</p>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat">
              <span className="stat-num">{patients.length}</span>
              <span className="stat-label">Records</span>
            </div>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-wrap">
          <span className="search-icon">⌕</span>
          <input
            className="search-input"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch("")}>✕</button>
          )}
        </div>
        <button className="btn-primary" onClick={handleCreate}>
          <span>＋</span> Add Patient
        </button>
      </div>

      {/* Table */}
      <main className="main-content">
        <PatientTable
          patients={patients}
          loading={loading}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
        />
      </main>

      {/* Modals */}
      {modalOpen && (
        <PatientModal
          patient={editTarget}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          patient={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
