import React, { useState, useRef } from 'react';
import * as ort from 'onnxruntime-web';
import { saveModelToIndexedDB, loadModelFromIndexedDB } from './modelCache';
import { Upload, Leaf, AlertCircle, Trash2 } from 'lucide-react';
import { preprocessImage } from './preprocess';
import { CLASS_LABELS } from './labels';
import './App.css';

function App() {
  const [image, setImage] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(false);
  const fileInputRef = useRef(null);
  const sessionRef = useRef(null);

  // Initialize ONNX session
  // Use IndexedDB caching for ONNX model
  const initializeSession = async () => {
    if (!sessionRef.current) {
      setModelLoading(true);
      let showFirstLoadMsg = false;
      try {
        ort.env.wasm.proxy = true;
        ort.env.wasm.numThreads = 1;
        // Try to load model from IndexedDB
        let modelArrayBuffer = await loadModelFromIndexedDB();
        if (!modelArrayBuffer) {
          showFirstLoadMsg = true;
          setFirstLoad(true);
          const response = await fetch('/maize_vit_model.onnx');
          modelArrayBuffer = await response.arrayBuffer();
          await saveModelToIndexedDB(modelArrayBuffer);
        }
        const session = await ort.InferenceSession.create(modelArrayBuffer, {
          executionProviders: ['wasm'],
          graphOptimizationLevel: 'all',
        });
        sessionRef.current = session;
      } catch (err) {
        console.error('Failed to initialize ONNX session:', err);
        throw new Error('Failed to load the ONNX model. Please refresh the page.');
      } finally {
        setModelLoading(false);
        if (showFirstLoadMsg) {
          setTimeout(() => setFirstLoad(false), 3000);
        }
      }
    }
    return sessionRef.current;
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
      const session = await initializeSession();
      // Preprocess image to Float32Array
      const inputTensor = await preprocessImage(image, [1, 3, 224, 224]);
      const tensor = new ort.Tensor('float32', inputTensor, [1, 3, 224, 224]);
      const feeds = { [session.inputNames[0]]: tensor };
      const results = await session.run(feeds);
      // Assume output is logits or probabilities
      const output = results[session.outputNames[0]].data;
      // Softmax if not already
      const softmax = arr => {
        const max = Math.max(...arr);
        const exps = arr.map(x => Math.exp(x - max));
        const sum = exps.reduce((a, b) => a + b, 0);
        return exps.map(e => e / sum);
      };
      const scores = softmax(Array.from(output));
      // Map to labels
      const preds = scores.map((score, i) => ({ label: CLASS_LABELS[i] || `Class ${i}`, score }));
      // Sort descending
      preds.sort((a, b) => b.score - a.score);
      setPredictions(preds);
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
  <p>Powered by ONNX.js - Runs entirely in your browser</p>
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
                    className="remove-image-btn"
                    onClick={() => {
                      setImage(null);
                      setPredictions([]);
                      setError(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    <Trash2 size={16} style={{marginRight:4,marginBottom:-2}} /> Remove Image
                  </button>
                </div>
              ) : (
                <div className="upload-prompt">
                  <Upload size={48} className="upload-icon" />
                  <p>Drag & drop an image here or click to browse</p>
                  <button 
                    className="choose-image-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose Image
                  </button>
                </div>
              )}
            </div>
          </div>

          {image && (
            <>
              <button 
                className="analyze-btn"
                onClick={handlePredict}
                disabled={loading || modelLoading}
              >
                {loading ? 'Analyzing...' : modelLoading ? 'Loading Model...' : 'Analyze Image'}
              </button>
              {firstLoad && (
                <div style={{color:'#b45309',background:'#fef3c7',borderRadius:'0.5rem',padding:'0.7rem 1rem',marginBottom:'1rem',fontWeight:500}}>
                  First time analysis may take up to a minute as the model loads. Subsequent predictions will be much faster.
                </div>
              )}
            </>
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
  <p>Built with React and ONNX.js - No server required</p>
      </footer>
    </div>
  );
}

export default App;
