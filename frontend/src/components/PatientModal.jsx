import { useState, useEffect } from "react";

const EMPTY = {
  full_name:   "",
  dob:         "",
  email:       "",
  glucose:     "",
  haemoglobin: "",
  cholesterol: "",
};

// Client-side validation mirrors backend
function validate(form) {
  const errs = {};
  if (!form.full_name.trim())
    errs.full_name = "Full name is required.";
  else if (form.full_name.trim().length < 2)
    errs.full_name = "At least 2 characters.";

  if (!form.dob)
    errs.dob = "Date of birth is required.";
  else if (new Date(form.dob) >= new Date())
    errs.dob = "DOB cannot be today or future.";

  if (!form.email.trim())
    errs.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errs.email = "Invalid email format.";

  for (const [key, label, lo, hi] of [
    ["glucose",     "Glucose",     0, 1000],
    ["haemoglobin", "Haemoglobin", 0, 30  ],
    ["cholesterol", "Cholesterol", 0, 1000],
  ]) {
    if (form[key] === "")
      errs[key] = `${label} is required.`;
    else if (isNaN(Number(form[key])))
      errs[key] = `${label} must be numeric.`;
    else if (Number(form[key]) < lo || Number(form[key]) > hi)
      errs[key] = `${label} must be ${lo}–${hi}.`;
  }

  return errs;
}

export default function PatientModal({ patient, onSave, onClose }) {
  const isEdit = !!patient;
  const [form, setForm]     = useState(EMPTY);
  const [errs, setErrs]     = useState({});
  const [apiErrs, setApiErrs] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (patient) {
      setForm({
        full_name:   patient.full_name   || "",
        dob:         patient.dob         || "",
        email:       patient.email       || "",
        glucose:     String(patient.glucose     ?? ""),
        haemoglobin: String(patient.haemoglobin ?? ""),
        cholesterol: String(patient.cholesterol ?? ""),
      });
    } else {
      setForm(EMPTY);
    }
  }, [patient]);

  const set = (key) => (e) => {
    setForm(f => ({ ...f, [key]: e.target.value }));
    setErrs(e => ({ ...e, [key]: undefined }));
    setApiErrs([]);
  };

  const handleSubmit = async () => {
    const clientErrs = validate(form);
    if (Object.keys(clientErrs).length) {
      setErrs(clientErrs);
      return;
    }

    setSaving(true);
    const serverErrs = await onSave(form, patient?.id || null);
    setSaving(false);

    if (serverErrs) setApiErrs(serverErrs);
  };

  // Today's date string for max date constraint
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">
            <h2>{isEdit ? "Edit Patient" : "Add New Patient"}</h2>
            <p>{isEdit ? "Update patient information and re-generate AI health assessment." : "Enter patient details to generate an AI health assessment."}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {apiErrs.length > 0 && (
            <div className="error-banner">
              <ul>
                {apiErrs.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          <p className="section-label">Personal Information</p>

          <div className="form-row">
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                placeholder="Jane Doe"
                value={form.full_name}
                onChange={set("full_name")}
                className={errs.full_name ? "error" : ""}
              />
              {errs.full_name && <p className="field-error">{errs.full_name}</p>}
            </div>
            <div className="form-group">
              <label>Date of Birth *</label>
              <input
                type="date"
                max={today}
                value={form.dob}
                onChange={set("dob")}
                className={errs.dob ? "error" : ""}
              />
              {errs.dob && <p className="field-error">{errs.dob}</p>}
            </div>
          </div>

          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              placeholder="patient@example.com"
              value={form.email}
              onChange={set("email")}
              className={errs.email ? "error" : ""}
            />
            {errs.email && <p className="field-error">{errs.email}</p>}
          </div>

          <p className="section-label">Blood Test Results</p>

          <div className="form-row">
            <div className="form-group">
              <label>Glucose (mg/dL) *</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 95.5"
                value={form.glucose}
                onChange={set("glucose")}
                className={errs.glucose ? "error" : ""}
              />
              <p className="form-hint">Normal fasting: 70–99 mg/dL</p>
              {errs.glucose && <p className="field-error">{errs.glucose}</p>}
            </div>
            <div className="form-group">
              <label>Haemoglobin (g/dL) *</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 14.0"
                value={form.haemoglobin}
                onChange={set("haemoglobin")}
                className={errs.haemoglobin ? "error" : ""}
              />
              <p className="form-hint">Normal: 12–17.5 g/dL</p>
              {errs.haemoglobin && <p className="field-error">{errs.haemoglobin}</p>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Cholesterol (mg/dL) *</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 180.0"
                value={form.cholesterol}
                onChange={set("cholesterol")}
                className={errs.cholesterol ? "error" : ""}
              />
              <p className="form-hint">Desirable: &lt;200 mg/dL</p>
              {errs.cholesterol && <p className="field-error">{errs.cholesterol}</p>}
            </div>
          </div>

          <p style={{ fontSize: "0.75rem", color: "var(--text-3)", marginTop: "0.5rem" }}>
            ⚕ An AI health assessment will be automatically generated from these values.
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          {saving && (
            <div className="saving-indicator">
              <span className="mini-spinner" />
              Generating AI assessment…
            </div>
          )}
          <button className="btn-save" onClick={handleSubmit} disabled={saving}>
            {isEdit ? "Save Changes" : "Add Patient"}
          </button>
        </div>
      </div>
    </div>
  );
}
