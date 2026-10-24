import React, { useState, useEffect } from 'react';
import { Save, Edit3, User, Calendar, Hash } from 'lucide-react';
import { DocumentData, FormData } from '../types';
import toast from 'react-hot-toast';

interface DocumentFormProps {
  extractedData: DocumentData | null;
  isProcessing: boolean;
}

const DocumentForm: React.FC<DocumentFormProps> = ({ extractedData, isProcessing }) => {
  const [formData, setFormData] = useState<FormData>({
    surname: '',
    givenName: '',
    fullName: '',
    dateOfBirth: '',
    expiryDate: '',
    issueDate: '',
    documentNumber: '',
    nationality: '',
    additionalInfo: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  // Auto-fill form when extracted data is available
  useEffect(() => {
    if (extractedData && extractedData.extractedData) {
      const data = extractedData.extractedData;
      setFormData({
        surname: data.surname || '',
        givenName: data.givenName || '',
        fullName: data.fullName || '',
        dateOfBirth: data.dateOfBirth || '',
        expiryDate: data.expiryDate || '',
        issueDate: data.issueDate || '',
        documentNumber: data.passportNumber || data.idNumber || data.licenseNumber || '',
        nationality: data.nationality || '',
        additionalInfo: ''
      });
      setIsEditing(true);
    }
  }, [extractedData]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Here you would typically save the data to your backend
    console.log('Saving form data:', formData);
    toast.success('Form data saved successfully!');
    setIsEditing(false);
  };

  const handleReset = () => {
    if (extractedData && extractedData.extractedData) {
      const data = extractedData.extractedData;
      setFormData({
        surname: data.surname || '',
        givenName: data.givenName || '',
        fullName: data.fullName || '',
        dateOfBirth: data.dateOfBirth || '',
        expiryDate: data.expiryDate || '',
        issueDate: data.issueDate || '',
        documentNumber: data.passportNumber || data.idNumber || data.licenseNumber || '',
        nationality: data.nationality || '',
        additionalInfo: ''
      });
    }
    toast.success('Form reset to extracted data');
  };

  const getDocumentTypeLabel = () => {
    if (!extractedData) return '';
    switch (extractedData.documentType) {
      case 'passport': return 'Passport';
      case 'nationalId': return 'National ID';
      case 'license': return 'Driving License';
      default: return 'Document';
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#495057' }}>Personal Information</h2>
        {extractedData && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setIsEditing(!isEditing)}
              disabled={isProcessing}
            >
              <Edit3 size={16} />
              {isEditing ? 'View Only' : 'Edit'}
            </button>
            {isEditing && (
              <>
                <button
                  className="btn btn-secondary"
                  onClick={handleReset}
                  disabled={isProcessing}
                >
                  Reset
                </button>
                <button
                  className="btn"
                  onClick={handleSave}
                  disabled={isProcessing}
                >
                  <Save size={16} />
                  Save
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {extractedData && (
        <div className="success" style={{ marginBottom: '20px' }}>
          <strong>✓ {getDocumentTypeLabel()} Data Extracted</strong>
          <br />
          Confidence: {extractedData.confidence}%
        </div>
      )}

      {isProcessing && (
        <div className="loading" style={{ marginBottom: '20px' }}>
          <div className="spinner" />
          Processing document...
        </div>
      )}

      <div className="grid grid-2">
        <div className="form-group">
          <label className="form-label">
            <User size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Surname
          </label>
          <input
            type="text"
            className="form-input"
            value={formData.surname}
            onChange={(e) => handleInputChange('surname', e.target.value)}
            disabled={!isEditing || isProcessing}
            placeholder="Enter surname"
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <User size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Given Name
          </label>
          <input
            type="text"
            className="form-input"
            value={formData.givenName}
            onChange={(e) => handleInputChange('givenName', e.target.value)}
            disabled={!isEditing || isProcessing}
            placeholder="Enter given name"
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <User size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Full Name
          </label>
          <input
            type="text"
            className="form-input"
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            disabled={!isEditing || isProcessing}
            placeholder="Enter full name"
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <Hash size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Document Number
          </label>
          <input
            type="text"
            className="form-input"
            value={formData.documentNumber}
            onChange={(e) => handleInputChange('documentNumber', e.target.value)}
            disabled={!isEditing || isProcessing}
            placeholder="Enter document number"
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <Calendar size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Date of Birth
          </label>
          <input
            type="date"
            className="form-input"
            value={formData.dateOfBirth}
            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
            disabled={!isEditing || isProcessing}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <Calendar size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Issue Date
          </label>
          <input
            type="date"
            className="form-input"
            value={formData.issueDate}
            onChange={(e) => handleInputChange('issueDate', e.target.value)}
            disabled={!isEditing || isProcessing}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <Calendar size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Expiry Date
          </label>
          <input
            type="date"
            className="form-input"
            value={formData.expiryDate}
            onChange={(e) => handleInputChange('expiryDate', e.target.value)}
            disabled={!isEditing || isProcessing}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <User size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Nationality
          </label>
          <input
            type="text"
            className="form-input"
            value={formData.nationality}
            onChange={(e) => handleInputChange('nationality', e.target.value)}
            disabled={!isEditing || isProcessing}
            placeholder="Enter nationality"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Additional Information</label>
        <textarea
          className="form-input"
          value={formData.additionalInfo}
          onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
          disabled={!isEditing || isProcessing}
          placeholder="Enter any additional information..."
          rows={3}
          style={{ resize: 'vertical' }}
        />
      </div>

      {!extractedData && !isProcessing && (
        <div className="text-center" style={{ color: '#6c757d', marginTop: '40px' }}>
          <User size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p>Upload a document to automatically fill this form</p>
        </div>
      )}
    </div>
  );
};

export default DocumentForm; 