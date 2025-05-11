import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { InvoiceFile, Warranty } from '../types';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

// Helper to extract file name from URI
export function getFileName(uri: string): string {
  return uri.split('/').pop() || 'invoice';
}

// Helper to guess MIME type from file extension
export function getMimeType(uri: string): string {
  const ext = uri.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Opens a document from the given invoice file info
 * Works across platforms (web, iOS, Android)
 */
export const viewDocument = async (invoice: InvoiceFile): Promise<void> => {
  try {
    if (!invoice || !invoice.uri) {
      Alert.alert('No Document', 'Document is not available.');
      return;
    }

    // For native platforms, we can open directly with WebBrowser
    if (invoice.uri.startsWith('file://') || 
        invoice.uri.startsWith('http://') || 
        invoice.uri.startsWith('https://')) {
      await WebBrowser.openBrowserAsync(invoice.uri);
      return;
    }

    // For other formats, like base64 data or blobs
    if (invoice.uri.startsWith('data:')) {
      // Extract base64 data
      const base64Data = invoice.uri.split(',')[1];
      if (!base64Data) {
        throw new Error('Invalid base64 data');
      }

      // Save to a temporary file
      const fileUri = FileSystem.documentDirectory + invoice.name;
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Share the file
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device.');
        return;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: invoice.type,
        dialogTitle: 'Open Document',
      });
      return;
    }

    // Fallback for other formats
    Alert.alert('Cannot View Document', 'The document format is not supported.');
  } catch (error) {
    console.error('Error viewing document:', error);
    Alert.alert('Error', 'Failed to open the document.');
  }
};

/**
 * Converts a file or data from the backend to the InvoiceFile format
 */
export function convertToInvoiceFile(data: any): InvoiceFile {
  // If the data is already in the correct format, return it
  if (data && data.uri && data.name && data.type) {
    return data as InvoiceFile;
  }

  // Handle different formats that might come from the backend
  let uri: string;
  let name: string;
  let type: string;

  if (typeof data === 'string') {
    // If data is a string, assume it's a URL or path
    uri = data;
    name = getFileName(data);
    type = getMimeType(data);
  } else if (data?.path || data?.filename) {
    // Format from multer or similar backends
    uri = data.path || `http://localhost:3000/uploads/${data.filename}`;
    name = data.originalname || data.filename || 'document';
    type = data.mimetype || getMimeType(name);
  } else if (data?.data) {
    // Binary data
    // Convert to base64 if it's a Buffer or similar
    const arrayBuffer = data.data instanceof ArrayBuffer 
      ? data.data 
      : new Uint8Array(data.data).buffer;
    
    // Create base64 data URL
    const base64 = btoa(
      new Uint8Array(arrayBuffer)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    // Create a data URL
    uri = `data:${data.mimetype || 'application/octet-stream'};base64,${base64}`;
    name = data.originalname || 'document';
    type = data.mimetype || 'application/octet-stream';
  } else {
    // Fallback for unknown formats
    uri = '';
    name = 'document';
    type = 'application/octet-stream';
  }

  return { uri, name, type };
}