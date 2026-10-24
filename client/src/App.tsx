import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import DocumentUpload from './components/DocumentUpload';
import DocumentForm from './components/DocumentForm';
import { DocumentData } from './types';

function App() {
  const [extractedData, setExtractedData] = useState<DocumentData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDocumentProcessed = (data: DocumentData) => {
    setExtractedData(data);
  };

  const handleProcessingState = (processing: boolean) => {
    setIsProcessing(processing);
  };

  return (
    <div className="App">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      
      <div className="container">
        <header className="text-center mb-4">
          <h1 style={{ 
            color: 'white', 
            fontSize: '2.5rem', 
            fontWeight: 'bold',
            marginBottom: '8px'
          }}>
            Document Parser
          </h1>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.9)', 
            fontSize: '1.1rem' 
          }}>
            Upload your passport, national ID, or license to automatically extract information
          </p>
        </header>

        <div className="grid grid-2">
          <div className="card">
            <DocumentUpload 
              onDocumentProcessed={handleDocumentProcessed}
              onProcessingState={handleProcessingState}
            />
          </div>

          <div className="card">
            <DocumentForm 
              extractedData={extractedData}
              isProcessing={isProcessing}
            />
          </div>
        </div>

        {extractedData && (
          <div className="card">
            <h2 style={{ marginBottom: '20px', color: '#495057' }}>
              Extracted Information
            </h2>
            <div className="grid grid-3">
              {Object.entries(extractedData.extractedData).map(([key, value]) => (
                <div key={key} className="form-group">
                  <label className="form-label">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={value || ''}
                    readOnly
                  />
                </div>
              ))}
            </div>
            
            <div className="mt-4">
              <div className="form-group">
                <label className="form-label">Confidence Score</label>
                <div className="confidence-bar">
                  <div 
                    className="confidence-fill" 
                    style={{ width: `${extractedData.confidence}%` }}
                  />
                </div>
                <p className="text-muted" style={{ marginTop: '8px' }}>
                  {extractedData.confidence}% confidence in extracted data
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App; 