 VitalCheck — Patient Health Prediction System

A full-stack web application for managing patient blood-test records with **AI-powered health predictions** using the Claude API.


Features

- **CRUD Operations** — Create, Read, Update, Delete patient records
- **AI Health Assessment** — Powered by Claude (Anthropic) to analyse blood test values and generate clinical remarks
- **Rule-based Fallback** — Works offline if no API key is configured
- **Real-time Search** — Filter patients by name or email
- **Input Validation** — Client-side + server-side (email format, future-date guard, numeric ranges)
- **Color-coded values** — Green/yellow/red indicators for each blood metric
- **Persistent Storage** — SQLite database (zero-config)
- **Clean UI** — Dark clinical theme built with React + Vite

