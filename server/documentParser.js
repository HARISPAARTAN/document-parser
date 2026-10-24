const pdfParse = require('pdf-parse');
const fs = require('fs');
const { createWorker } = require('tesseract.js');

// Regular expressions for different document types
const PATTERNS = {
  passport: {
    surname: /(?:surname|last name|family name)[\s:]*([A-Z\s]+)/i,
    givenName: /(?:given name|first name|forename)[\s:]*([A-Z\s]+)/i,
    fullName: /(?:name|full name)[\s:]*([A-Z\s]+)/i,
    dateOfBirth: /(?:date of birth|birth date|dob)[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    expiryDate: /(?:expiry|expiration|expires)[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    issueDate: /(?:issue date|issued|date of issue)[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    passportNumber: /(?:passport number|passport no)[\s:]*([A-Z0-9]+)/i,
    nationality: /(?:nationality)[\s:]*([A-Z\s]+)/i
  },
  nationalId: {
    surname: /(?:surname|last name|family name)[\s:]*([A-Z\s]+)/i,
    givenName: /(?:given name|first name|forename)[\s:]*([A-Z\s]+)/i,
    fullName: /(?:name|full name)[\s:]*([A-Z\s]+)/i,
    dateOfBirth: /(?:date of birth|birth date|dob)[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    expiryDate: /(?:expiry|expiration|expires)[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    issueDate: /(?:issue date|issued|date of issue)[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    idNumber: /(?:id number|identity number|national id)[\s:]*([A-Z0-9]+)/i,
    nationality: /(?:nationality)[\s:]*([A-Z\s]+)/i
  },
  license: {
    surname: /(?:surname|last name|family name)[\s:]*([A-Z\s]+)/i,
    givenName: /(?:given name|first name|forename)[\s:]*([A-Z\s]+)/i,
    fullName: /(?:name|full name)[\s:]*([A-Z\s]+)/i,
    dateOfBirth: /(?:date of birth|birth date|dob)[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    expiryDate: /(?:expiry|expiration|expires)[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    issueDate: /(?:issue date|issued|date of issue)[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    licenseNumber: /(?:license number|driving license|license no)[\s:]*([A-Z0-9]+)/i,
    licenseType: /(?:license type|class)[\s:]*([A-Z0-9\s]+)/i
  }
};

// Date parsing helper
function parseDate(dateString) {
  if (!dateString) return null;
  
  // Try different date formats
  const formats = [
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/, // DD/MM/YYYY or DD-MM-YYYY
    /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/    // YYYY/MM/DD or YYYY-MM-DD
  ];
  
  for (const format of formats) {
    const match = dateString.match(format);
    if (match) {
      let day, month, year;
      
      if (match[3].length === 2) {
        // DD/MM/YY format
        day = parseInt(match[1]);
        month = parseInt(match[2]) - 1;
        year = parseInt(match[3]) + (parseInt(match[3]) < 50 ? 2000 : 1900);
      } else {
        // DD/MM/YYYY or YYYY/MM/DD format
        if (parseInt(match[1]) > 31) {
          // YYYY/MM/DD format
          year = parseInt(match[1]);
          month = parseInt(match[2]) - 1;
          day = parseInt(match[3]);
        } else {
          // DD/MM/YYYY format
          day = parseInt(match[1]);
          month = parseInt(match[2]) - 1;
          year = parseInt(match[3]);
        }
      }
      
      return new Date(year, month, day);
    }
  }
  
  return null;
}

// Extract data using regex patterns
function extractDataFromText(text, documentType) {
  const patterns = PATTERNS[documentType] || PATTERNS.passport;
  const extractedData = {};
  
  // Convert text to uppercase for better matching
  const upperText = text.toUpperCase();
  
  // Extract each field
  for (const [field, pattern] of Object.entries(patterns)) {
    const match = upperText.match(pattern);
    if (match && match[1]) {
      let value = match[1].trim();
      
      // Clean up the extracted value
      value = value.replace(/\s+/g, ' ').trim();
      
      // Parse dates
      if (field.includes('Date') || field.includes('dob')) {
        const parsedDate = parseDate(value);
        if (parsedDate) {
          extractedData[field] = parsedDate.toISOString().split('T')[0];
        } else {
          extractedData[field] = value;
        }
      } else {
        extractedData[field] = value;
      }
    }
  }
  
  return extractedData;
}

// Main document parsing function
async function parseDocument(filePath, documentType = 'passport') {
  try {
    // Read the PDF file
    const dataBuffer = fs.readFileSync(filePath);
    
    // Parse PDF text
    const pdfData = await pdfParse(dataBuffer);
    const text = pdfData.text;
    
    console.log(`Extracted text length: ${text.length} characters`);
    
    // Extract data using regex patterns
    const extractedData = extractDataFromText(text, documentType);
    
    // If text extraction didn't work well, try OCR
    if (Object.keys(extractedData).length < 3) {
      console.log('Text extraction yielded few results, trying OCR...');
      const ocrData = await performOCR(filePath, documentType);
      
      // Merge OCR results with text extraction results
      for (const [key, value] of Object.entries(ocrData)) {
        if (value && (!extractedData[key] || extractedData[key] === '')) {
          extractedData[key] = value;
        }
      }
    }
    
    // Format the response
    const result = {
      documentType,
      extractedData,
      confidence: calculateConfidence(extractedData),
      rawText: text.substring(0, 500) + '...' // First 500 chars for debugging
    };
    
    console.log('Extracted data:', result);
    return result;
    
  } catch (error) {
    console.error('Error parsing document:', error);
    throw new Error(`Failed to parse document: ${error.message}`);
  }
}

// OCR processing for better text extraction
async function performOCR(filePath, documentType) {
  try {
    const worker = await createWorker('eng');
    
    // Convert PDF to image and perform OCR
    const { data: { text } } = await worker.recognize(filePath);
    
    await worker.terminate();
    
    return extractDataFromText(text, documentType);
    
  } catch (error) {
    console.error('OCR processing failed:', error);
    return {};
  }
}

// Calculate confidence score based on extracted data
function calculateConfidence(extractedData) {
  const requiredFields = ['surname', 'givenName', 'dateOfBirth'];
  const optionalFields = ['expiryDate', 'issueDate'];
  
  let score = 0;
  const totalFields = requiredFields.length + optionalFields.length;
  
  // Check required fields
  for (const field of requiredFields) {
    if (extractedData[field] && extractedData[field].trim() !== '') {
      score += 1;
    }
  }
  
  // Check optional fields
  for (const field of optionalFields) {
    if (extractedData[field] && extractedData[field].trim() !== '') {
      score += 0.5;
    }
  }
  
  return Math.round((score / totalFields) * 100);
}

module.exports = {
  parseDocument,
  extractDataFromText,
  parseDate
}; 