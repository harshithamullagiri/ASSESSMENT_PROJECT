from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
import re
from datetime import datetime, date
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

app = Flask(__name__)
CORS(app)

DB_PATH = os.path.join(os.path.dirname(__file__), "patients.db")

# ── Database Setup ─────────────────────────────────────────────────────────────

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS patients (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name   TEXT    NOT NULL,
                dob         TEXT    NOT NULL,
                email       TEXT    NOT NULL UNIQUE,
                glucose     REAL    NOT NULL,
                haemoglobin REAL    NOT NULL,
                cholesterol REAL    NOT NULL,
                remarks     TEXT    DEFAULT '',
                created_at  TEXT    DEFAULT (datetime('now')),
                updated_at  TEXT    DEFAULT (datetime('now'))
            )
        """)
        conn.commit()

init_db()

# ── Validation ─────────────────────────────────────────────────────────────────

def validate_patient(data, is_update=False):
    errors = []

    name = data.get("full_name", "").strip()
    if not name:
        errors.append("Full name is required.")
    elif len(name) < 2:
        errors.append("Full name must be at least 2 characters.")

    dob_str = data.get("dob", "")
    if not dob_str:
        errors.append("Date of birth is required.")
    else:
        try:
            dob = datetime.strptime(dob_str, "%Y-%m-%d").date()
            if dob >= date.today():
                errors.append("Date of birth cannot be today or a future date.")
        except ValueError:
            errors.append("Invalid date format. Use YYYY-MM-DD.")

    email = data.get("email", "").strip().lower()
    if not email:
        errors.append("Email address is required.")
    elif not re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", email):
        errors.append("Invalid email address format.")

    for field, label, lo, hi in [
        ("glucose",     "Glucose",     0,   1000),
        ("haemoglobin", "Haemoglobin", 0,   30),
        ("cholesterol", "Cholesterol", 0,   1000),
    ]:
        val = data.get(field)
        if val is None or str(val).strip() == "":
            errors.append(f"{label} is required.")
        else:
            try:
                fval = float(val)
                if fval < lo or fval > hi:
                    errors.append(f"{label} must be between {lo} and {hi}.")
            except (ValueError, TypeError):
                errors.append(f"{label} must be a numeric value.")

    return errors

# ── Helper ─────────────────────────────────────────────────────────────────────

def calculate_age(dob_str: str) -> int:
    dob = datetime.strptime(dob_str, "%Y-%m-%d").date()
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

# ── Layer 1: Gemini AI Prediction ─────────────────────────────────────────────

def generate_remarks_with_gemini(patient: dict) -> str:
    """
    Calls Google Gemini 1.5 Flash to predict possible health conditions
    based on patient blood test results.
    Free tier: 1,500 requests/day — https://aistudio.google.com
    """
    gemini_key = os.environ.get("GEMINI_API_KEY", "")
    if not gemini_key:
        return None

    age = calculate_age(patient["dob"])

    prompt = f"""You are a clinical decision-support assistant. 
Analyze the following patient blood test results and predict possible health conditions or disease risks.
Write a clear, professional assessment in 2-3 sentences.
Mention specific conditions if values are abnormal, and advise if the patient should seek medical attention.

Patient Details:
- Age: {age} years
- Glucose: {patient['glucose']} mg/dL
- Haemoglobin: {patient['haemoglobin']} g/dL
- Cholesterol: {patient['cholesterol']} mg/dL

Respond with the health assessment only. No headers, no bullet points, no extra explanation."""

    try:
        genai.configure(api_key=gemini_key)
        model    = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        print("Remarks generated via Gemini AI")
        return response.text.strip()
    except Exception as e:
        print(f"Gemini API error: {e}")
        return None

# ── Layer 2: Rule-based Fallback ──────────────────────────────────────────────

def generate_rule_based_remarks(patient: dict) -> str:
    """Fallback when Gemini API is unavailable or not configured."""
    issues  = []
    glucose = float(patient["glucose"])
    hgb     = float(patient["haemoglobin"])
    chol    = float(patient["cholesterol"])

    if glucose >= 126:
        issues.append("elevated glucose suggesting possible diabetes")
    elif glucose >= 100:
        issues.append("slightly elevated glucose indicating pre-diabetes risk")

    if hgb < 12:
        issues.append("low haemoglobin indicating possible anaemia")
    elif hgb > 17.5:
        issues.append("elevated haemoglobin which may warrant further investigation")

    if chol >= 240:
        issues.append("high cholesterol increasing cardiovascular disease risk")
    elif chol >= 200:
        issues.append("borderline-high cholesterol requiring dietary attention")

    if not issues:
        return ("All blood markers are within normal ranges. "
                "Patient appears to be in good health. "
                "Routine annual check-up is recommended.")

    return (f"Blood results indicate {', and '.join(issues)}. "
            "Medical consultation is recommended for further evaluation and appropriate management.")

# ── Main Orchestrator ─────────────────────────────────────────────────────────

def generate_health_remarks(patient: dict) -> str:
    """
    2-layer pipeline:
      1. Google Gemini 1.5 Flash  → AI health prediction (free)
      2. Rule-based fallback      → works with no API key
    """
    remarks = generate_remarks_with_gemini(patient)
    if remarks:
        return remarks

    print("Falling back to rule-based assessment")
    return generate_rule_based_remarks(patient)

# ── REST Routes ────────────────────────────────────────────────────────────────

@app.route("/api/patients", methods=["GET"])
def list_patients():
    search = request.args.get("q", "").strip()
    with get_db() as conn:
        if search:
            rows = conn.execute(
                "SELECT * FROM patients WHERE full_name LIKE ? OR email LIKE ? ORDER BY created_at DESC",
                (f"%{search}%", f"%{search}%")
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM patients ORDER BY created_at DESC").fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/api/patients/<int:pid>", methods=["GET"])
def get_patient(pid):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM patients WHERE id = ?", (pid,)).fetchone()
    if not row:
        return jsonify({"error": "Patient not found"}), 404
    return jsonify(dict(row))


@app.route("/api/patients", methods=["POST"])
def create_patient():
    data = request.get_json(force=True)
    errors = validate_patient(data)
    if errors:
        return jsonify({"errors": errors}), 400

    with get_db() as conn:
        existing = conn.execute(
            "SELECT id FROM patients WHERE email = ?", (data["email"].strip().lower(),)
        ).fetchone()
        if existing:
            return jsonify({"errors": ["A patient with this email already exists."]}), 400

    remarks = generate_health_remarks(data)

    with get_db() as conn:
        cur = conn.execute(
            """INSERT INTO patients (full_name, dob, email, glucose, haemoglobin, cholesterol, remarks)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                data["full_name"].strip(),
                data["dob"],
                data["email"].strip().lower(),
                float(data["glucose"]),
                float(data["haemoglobin"]),
                float(data["cholesterol"]),
                remarks,
            )
        )
        conn.commit()
        new_id = cur.lastrowid

    with get_db() as conn:
        row = conn.execute("SELECT * FROM patients WHERE id = ?", (new_id,)).fetchone()
    return jsonify(dict(row)), 201


@app.route("/api/patients/<int:pid>", methods=["PUT"])
def update_patient(pid):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM patients WHERE id = ?", (pid,)).fetchone()
    if not existing:
        return jsonify({"error": "Patient not found"}), 404

    data = request.get_json(force=True)
    errors = validate_patient(data, is_update=True)
    if errors:
        return jsonify({"errors": errors}), 400

    with get_db() as conn:
        dup = conn.execute(
            "SELECT id FROM patients WHERE email = ? AND id != ?",
            (data["email"].strip().lower(), pid)
        ).fetchone()
        if dup:
            return jsonify({"errors": ["Another patient with this email already exists."]}), 400

    remarks = generate_health_remarks(data)

    with get_db() as conn:
        conn.execute(
            """UPDATE patients
               SET full_name=?, dob=?, email=?, glucose=?, haemoglobin=?, cholesterol=?,
                   remarks=?, updated_at=datetime('now')
               WHERE id=?""",
            (
                data["full_name"].strip(),
                data["dob"],
                data["email"].strip().lower(),
                float(data["glucose"]),
                float(data["haemoglobin"]),
                float(data["cholesterol"]),
                remarks,
                pid,
            )
        )
        conn.commit()

    with get_db() as conn:
        row = conn.execute("SELECT * FROM patients WHERE id = ?", (pid,)).fetchone()
    return jsonify(dict(row))


@app.route("/api/patients/<int:pid>", methods=["DELETE"])
def delete_patient(pid):
    with get_db() as conn:
        existing = conn.execute("SELECT id FROM patients WHERE id = ?", (pid,)).fetchone()
        if not existing:
            return jsonify({"error": "Patient not found"}), 404
        conn.execute("DELETE FROM patients WHERE id = ?", (pid,))
        conn.commit()
    return jsonify({"message": "Patient deleted successfully"})


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "timestamp": datetime.utcnow().isoformat()})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
