export default function Toast({ msg, type }) {
  const icon = type === "error" ? "✕" : "✓";
  return (
    <div className={`toast ${type}`}>
      <span className="toast-icon">{icon}</span>
      {msg}
    </div>
  );
}
