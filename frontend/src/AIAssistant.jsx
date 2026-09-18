import React, { useState } from 'react';
import './AIAssistant.css';

const API_URL =
  import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

function AIAssistant() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState(null);
  const [loadingPredictions, setLoadingPredictions] = useState(false);

  const askAI = async (e) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/analytics/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      setResponse(data.answer || "No response");
    } catch (error) {
      setResponse("Error connecting to AI Assistant.");
    }
    setLoading(false);
  };

  const predictDemand = async () => {
    setLoadingPredictions(true);
    try {
      const res = await fetch(`${API_URL}/analytics/predict-demand`, {
        method: 'GET',
        credentials: 'include'
      });
      const data = await res.json();
      setPredictions(data.recommendations || []);
    } catch (error) {
      setPredictions([]);
    }
    setLoadingPredictions(false);
  };

  return (
    <div className="ai-assistant-container">
      <div className="ai-chat-section">
        <h3>🤖 AI Inventory Assistant</h3>
        <p>Ask anything about your stock!</p>
        <form onSubmit={askAI} className="ai-chat-form">
          <input
            type="text"
            placeholder="e.g. Which products are low in stock?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Asking..." : "Ask AI"}
          </button>
        </form>
        {response && (
          <div className="ai-response">
            <strong>AI Response:</strong>
            <p>{response}</p>
          </div>
        )}
      </div>

      <div className="ai-predict-section">
        <h3>📈 Demand Prediction</h3>
        <button onClick={predictDemand} disabled={loadingPredictions} className="predict-btn">
          {loadingPredictions ? "Predicting..." : "Run AI Demand Prediction"}
        </button>
        
        {predictions && (
          <div className="predictions-list">
            {predictions.length === 0 ? (
              <p>No reorders needed at the moment.</p>
            ) : (
              <ul>
                {predictions.map(p => (
                  <li key={p.product_id} className="prediction-item">
                    <strong>{p.name}</strong>
                    <span>Current: {p.current_quantity}</span>
                    <span>Suggest Reorder: {p.suggested_reorder_quantity}</span>
                    <p>Reason: {p.reason}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AIAssistant;
