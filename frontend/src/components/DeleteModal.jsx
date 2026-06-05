export default function DeleteModal({ patient, onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal delete-modal">
        <div className="modal-body">
          <span className="delete-icon">⚠️</span>
          <h2>Delete Patient Record</h2>
          <p>
            Are you sure you want to delete <strong>{patient.full_name}</strong>?
            <br />This action cannot be undone.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

export function Toast({ msg, type }) {
  const icon = type === "error" ? "✕" : "✓";
  return (
    <div className={`toast ${type}`}>
      <span className="toast-icon">{icon}</span>
      {msg}
    </div>
  );
}
