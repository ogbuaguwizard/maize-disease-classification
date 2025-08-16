import React, { useState, useRef } from 'react';
import { Upload, Camera, Leaf, AlertCircle } from 'lucide-react';
import './App.css';

const MODEL_NAME = 'francis-ogbuagu/maize_vit_model';
const CLASS_LABELS = ['Common Rust', 'Gray Leaf Spot', 'Blight', 'Healthy'];

function App() {
  const [image, setImage] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Model loading state is now just a boolean
  const fileInputRef = useRef(null);

  // Predict using backend API
  const predictWithAPI = async () => {
    if (!image) {
      setError('Please upload or capture an image first.');
      return;
    }
    setLoading(true);
    setError(null);
    setPredictions([]);
    try {
      // Remove the data URL prefix for backend
      const base64Image = image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Image })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Prediction failed.');
        setPredictions([]);
        return;
      }
      // Hugging Face returns an array of predictions
      setPredictions(data.map(pred => ({
        label: pred.label,
        score: pred.score
      })));
    } catch (err) {
      setError('Prediction failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target.result);
        setPredictions([]);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle camera capture
  const handleCameraCapture = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          const video = document.createElement('video');
          video.srcObject = stream;
          video.play();
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          setTimeout(() => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0);
            
            const imageData = canvas.toDataURL('image/jpeg');
            setImage(imageData);
            stream.getTracks().forEach(track => track.stop());
          }, 1000);
        })
        .catch(err => setError('Camera access denied: ' + err.message));
    }
  };

  // ...existing code...

  return (
    <div className="app">
      <header className="app-header">
        <Leaf className="header-icon" />
        <h1>Maize Disease Detection</h1>
        <p>Powered by React + Transformer.js</p>
      </header>

      <main className="main-content">
        <div className="upload-section">
          <div className="upload-card">
            <h2>Upload Image</h2>
            <div className="upload-options">
              <button 
                className="upload-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={20} />
                Choose File
              </button>
              <button 
                className="upload-btn"
                onClick={handleCameraCapture}
              >
                <Camera size={20} />
                Use Camera
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </div>

          {image && (
            <div className="image-preview">
              <img src={image} alt="Uploaded maize leaf" />
            </div>
          )}

          <button 
            className="predict-btn"
            onClick={predictWithAPI}
            disabled={loading || !image}
          >
            {loading ? 'Predicting...' : 'Predict Disease'}
          </button>

          {error && (
            <div className="error-message">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {predictions.length > 0 && (
            <div className="results-section">
              <h3>Prediction Results</h3>
              <div className="predictions-list">
                {predictions.map((pred, index) => (
                  <div key={index} className="prediction-item">
                    <span className="label">{pred.label}</span>
                    <div className="confidence-bar">
                      <div 
                        className="confidence-fill" 
                        style={{ width: `${pred.score * 100}%` }}
                      />
                    </div>
                    <span className="score">{(pred.score * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>Built with React, Transformer.js, and Vercel</p>
      </footer>
    </div>
  );
}

export default App;
