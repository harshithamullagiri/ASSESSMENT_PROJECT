# ⚕ VitalCheck — Patient Health Prediction System

A full-stack web application for managing patient blood-test records with **AI-powered health predictions** using the Claude API.

---

## ✨ Features

- **CRUD Operations** — Create, Read, Update, Delete patient records
- **AI Health Assessment** — Powered by Claude (Anthropic) to analyse blood test values and generate clinical remarks
- **Rule-based Fallback** — Works offline if no API key is configured
- **Real-time Search** — Filter patients by name or email
- **Input Validation** — Client-side + server-side (email format, future-date guard, numeric ranges)
- **Color-coded values** — Green/yellow/red indicators for each blood metric
- **Persistent Storage** — SQLite database (zero-config)
- **Clean UI** — Dark clinical theme built with React + Vite

---

## 🛠 Tech Stack

| Layer     | Technology               | Why                                                        |
|-----------|--------------------------|------------------------------------------------------------|
| Backend   | Python + Flask           | Lightweight REST API, rapid development                    |
| Database  | SQLite                   | Zero-config persistent storage, perfect for local/demo use |
| AI/ML API | Anthropic Claude API     | State-of-the-art LLM for clinical language generation      |
| Frontend  | React 18 + Vite          | Fast, component-based, modern DX                           |
| Styling   | Pure CSS (custom design) | Full control, no framework overhead                        |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com) *(optional — app works without it)*

---

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/vitalcheck.git
cd vitalcheck
```

---

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure API key
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Start the server
python app.py
```

Backend runs at **http://localhost:5000**

---

### 3. Frontend Setup

```bash
cd frontend

npm install
npm run dev
```

Frontend runs at **http://localhost:3000**

---

## 📡 API Endpoints

| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| GET    | `/api/patients`       | List all patients (supports `?q=search`) |
| GET    | `/api/patients/:id`   | Get single patient       |
| POST   | `/api/patients`       | Create patient + AI remarks |
| PUT    | `/api/patients/:id`   | Update patient + regenerate AI remarks |
| DELETE | `/api/patients/:id`   | Delete patient           |
| GET    | `/api/health`         | API health check         |

---

## 🧠 AI Integration

On every Create or Update operation, the backend:

1. Sends the patient's age + blood values to the **Claude Sonnet** model
2. Requests a concise 2–3 sentence clinical assessment
3. Stores the result in the `remarks` column
4. Falls back to rule-based logic if the API key is absent

**Fallback rules cover:**
- Glucose ≥ 126 → Diabetes risk
- Glucose 100–125 → Pre-diabetes
- Haemoglobin < 12 → Anaemia
- Cholesterol ≥ 240 → High cardiovascular risk
- Cholesterol 200–239 → Borderline high

---

## ✅ Validation Rules

| Field       | Rule                                        |
|-------------|---------------------------------------------|
| Full Name   | Required, min 2 chars                       |
| Date of Birth | Required, must be in the past             |
| Email       | Required, valid format, unique              |
| Glucose     | Required, numeric, 0–1000 mg/dL             |
| Haemoglobin | Required, numeric, 0–30 g/dL               |
| Cholesterol | Required, numeric, 0–1000 mg/dL            |

---

## 📁 Project Structure

```
vitalcheck/
├── backend/
│   ├── app.py              # Flask app — routes, validation, AI integration
│   ├── requirements.txt    # Python dependencies
│   ├── .env.example        # Environment template (copy to .env)
│   └── patients.db         # Auto-created SQLite database (git-ignored)
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Root component + state management
│   │   ├── App.css         # Design system + all styles
│   │   ├── main.jsx        # React entry point
│   │   └── components/
│   │       ├── PatientTable.jsx  # Data table with colour-coded values
│   │       ├── PatientModal.jsx  # Create/Edit form with validation
│   │       ├── DeleteModal.jsx   # Confirmation dialog
│   │       └── Toast.jsx         # Notification component
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── .gitignore
└── README.md
```

---

## 🔒 Security Notes

- API keys are stored in `.env` (git-ignored) — never committed
- The `.env.example` file contains only placeholder values
- Emails are normalised to lowercase and checked for uniqueness
- All inputs are validated server-side regardless of client validation

---

## 📝 License

MIT — free to use and modify.
