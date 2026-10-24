import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { DocumentData, DocumentType } from '../types';

interface DocumentUploadProps {
  onDocumentProcessed: (data: DocumentData) => void;
  onProcessingState: (processing: boolean) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onDocumentProcessed,
  onProcessingState
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('passport');
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        toast.success('PDF file selected successfully!');
      } else {
        toast.error('Please select a PDF file');
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  });

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsUploading(true);
    onProcessingState(true);

    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('documentType', documentType);

      const response = await axios.post('/api/upload-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        onDocumentProcessed(response.data.data);
        toast.success('Document processed successfully!');
        setSelectedFile(null);
      } else {
        toast.error('Failed to process document');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to upload document');
    } finally {
      setIsUploading(false);
      onProcessingState(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      toast.success('PDF file selected successfully!');
    } else if (file) {
      toast.error('Please select a PDF file');
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '20px', color: '#495057' }}>
        Upload Document
      </h2>

      <div className="form-group">
        <label className="form-label">Document Type</label>
        <select
          className="form-input"
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value as DocumentType)}
        >
          <option value="passport">Passport</option>
          <option value="nationalId">National ID</option>
          <option value="license">Driving License</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Upload PDF Document</label>
        
        <div
          {...getRootProps()}
          style={{
            border: '2px dashed #e9ecef',
            borderRadius: '8px',
            padding: '40px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            backgroundColor: isDragActive ? '#f8f9fa' : 'white',
            borderColor: isDragActive ? '#667eea' : '#e9ecef'
          }}
        >
          <input {...getInputProps()} />
          
          {selectedFile ? (
            <div>
              <CheckCircle size={48} color="#28a745" style={{ marginBottom: '12px' }} />
              <p style={{ fontWeight: '600', color: '#28a745', marginBottom: '8px' }}>
                File Selected
              </p>
              <p style={{ color: '#6c757d', fontSize: '14px' }}>
                {selectedFile.name}
              </p>
              <p style={{ color: '#6c757d', fontSize: '12px', marginTop: '8px' }}>
                Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div>
              <Upload size={48} color="#667eea" style={{ marginBottom: '12px' }} />
              <p style={{ fontWeight: '600', color: '#495057', marginBottom: '8px' }}>
                {isDragActive ? 'Drop the PDF here' : 'Drag & drop a PDF file here'}
              </p>
              <p style={{ color: '#6c757d', fontSize: '14px' }}>
                or click to browse files
              </p>
              <p style={{ color: '#6c757d', fontSize: '12px', marginTop: '8px' }}>
                Maximum file size: 10MB
              </p>
            </div>
          )}
        </div>

        <div style={{ marginTop: '12px', textAlign: 'center' }}>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="file-input"
          />
          <label htmlFor="file-input" className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            Browse Files
          </label>
        </div>
      </div>

      {selectedFile && (
        <div className="form-group">
          <button
            className="btn"
            onClick={handleUpload}
            disabled={isUploading}
            style={{ width: '100%' }}
          >
            {isUploading ? (
              <>
                <div className="spinner" />
                Processing Document...
              </>
            ) : (
              <>
                <FileText size={20} />
                Process Document
              </>
            )}
          </button>
        </div>
      )}

      <div className="warning">
        <AlertCircle size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
        <strong>Important:</strong> Make sure your document is clear and all text is readable for better extraction results.
      </div>
    </div>
  );
};

export default DocumentUpload; 