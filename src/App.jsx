import React, { useState, useRef } from 'react';
import { pipeline } from '@xenova/transformers';
import { Upload, Camera, Leaf, AlertCircle } from 'lucide-react';
import './App.css';

function App() {
  const [image, setImage] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modelLoading, setModelLoading] = useState(false);
  const fileInputRef = useRef(null);
  const classifierRef = useRef(null);

  // Initialize the classifier
  const initializeClassifier = async () => {
    if (!classifierRef.current) {
      setModelLoading(true);
      try {
        classifierRef.current = await pipeline(
          'image-classification',
          'Xenova/francis-ogbuagu-maize_vit_model'
        );
      } catch (err) {
        console.error('Failed to initialize classifier:', err);
        throw new Error('Failed to load the model. Please refresh the page.');
      } finally {
        setModelLoading(false);
      }
    }
    return classifierRef.current;
  };

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

  const handlePredict = async () => {
    if (!image) {
      setError('Please upload an image first.');
      return;
    }

    setLoading(true);
    setError(null);
    setPredictions([]);

    try {
      const classifier = await initializeClassifier();
      
      // Convert base64 to blob
      const response = await fetch(image);
      const blob = await response.blob();
      
      const predictions = await classifier(blob);
      
      if (predictions && predictions.length > 0) {
        setPredictions(predictions.map(pred => ({
          label: pred.label,
          score: pred.score
        })));
      } else {
        setError('No predictions could be made. Please try another image.');
      }
    } catch (err) {
      console.error('Prediction error:', err);
      setError(err.message || 'Failed to analyze the image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target.result);
        setPredictions([]);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="app">
      <header className="app-header">
        <Leaf className="header-icon" />
        <h1>Maize Disease Detection</h1>
        <p>Powered by Transformers.js - Runs entirely in your browser</p>
      </header>

      <main className="main-content">
        <div className="upload-section">
          <div className="upload-card">
            <h2>Upload Image</h2>
            <div 
              className="upload-area"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              
              {image ? (
                <div className="image-preview">
                  <img src={image} alt="Uploaded maize leaf" />
                  <button 
                    className="remove-image"
                    onClick={() => {
                      setImage(null);
                      setPredictions([]);
                      setError(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <div className="upload-prompt">
                  <Upload size={48} className="upload-icon" />
                  <p>Drag & drop an image here or click to browse</p>
                  <button 
                    className="upload-button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose Image
                  </button>
                </div>
              )}
            </div>
          </div>

          {image && (
            <button 
              className="predict-button"
              onClick={handlePredict}
              disabled={loading || modelLoading}
            >
              {loading ? 'Analyzing...' : modelLoading ? 'Loading Model...' : 'Analyze Image'}
            </button>
          )}

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
        <p>Built with React and Transformers.js - No server required</p>
      </footer>
    </div>
  );
}

export default App;
