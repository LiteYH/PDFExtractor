import "./ResultPanel.css";

interface ResultPanelProps {
  title: string;
  content: string;
  icon: string;
}

export default function ResultPanel({ title, content, icon }: ResultPanelProps) {
  return (
    <div className="result-panel">
      <div className="panel-header">
        <span className="panel-icon">{icon}</span>
        <h3 className="panel-title">{title}</h3>
      </div>
      <div className="panel-body">
        <pre className="panel-text">{content}</pre>
      </div>
    </div>
  );
}
