// Helper: classify blood values
function glucoseClass(v)     { if (v >= 126) return "danger"; if (v >= 100) return "warning"; return "normal"; }
function haemoglobinClass(v) { if (v < 11 || v > 18) return "danger"; if (v < 12 || v > 17.5) return "warning"; return "normal"; }
function cholesterolClass(v) { if (v >= 240) return "danger"; if (v >= 200) return "warning"; return "normal"; }

function formatDob(dob) {
  if (!dob) return "—";
  const [y, m, d] = dob.split("-");
  return `${d}/${m}/${y}`;
}

export default function PatientTable({ patients, loading, onEdit, onDelete }) {
  if (loading) {
    return (
      <div className="table-wrap">
        <div className="table-empty">
          <div className="spinner" />
          <p style={{ marginTop: "1rem" }}>Loading patients…</p>
        </div>
      </div>
    );
  }

  if (!patients.length) {
    return (
      <div className="table-wrap">
        <div className="table-empty">
          <div className="table-empty-icon">🩺</div>
          <h3>No patients found</h3>
          <p>Add a new patient to get started, or try a different search.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Full Name</th>
            <th>Date of Birth</th>
            <th>Email</th>
            <th>Glucose (mg/dL)</th>
            <th>Haemoglobin (g/dL)</th>
            <th>Cholesterol (mg/dL)</th>
            <th>Remarks</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((p, i) => (
            <tr key={p.id}>
              <td style={{ color: "var(--text-3)", fontFamily: "var(--mono)", fontSize: "0.78rem" }}>
                {String(i + 1).padStart(2, "0")}
              </td>
              <td className="td-name">{p.full_name}</td>
              <td className="td-dob">{formatDob(p.dob)}</td>
              <td className="td-email">{p.email}</td>
              <td>
                <span className={`bio-value ${glucoseClass(p.glucose)}`}>
                  {p.glucose}
                </span>
              </td>
              <td>
                <span className={`bio-value ${haemoglobinClass(p.haemoglobin)}`}>
                  {p.haemoglobin}
                </span>
              </td>
              <td>
                <span className={`bio-value ${cholesterolClass(p.cholesterol)}`}>
                  {p.cholesterol}
                </span>
              </td>
              <td className="remarks-cell">
                {p.remarks ? (
                  <>
                    <span className="remarks-badge">AI Assessment</span>
                    <div>{p.remarks}</div>
                  </>
                ) : (
                  <span style={{ color: "var(--text-3)" }}>—</span>
                )}
              </td>
              <td>
                <div className="actions">
                  <button className="btn-icon" title="Edit" onClick={() => onEdit(p)}>✏️</button>
                  <button className="btn-icon danger" title="Delete" onClick={() => onDelete(p)}>🗑</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
