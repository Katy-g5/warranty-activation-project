import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, Image, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, HelperText, Appbar, Snackbar } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../utils/theme';
import { useWarranty } from '../context/WarrantyContext';
import * as WebBrowser from 'expo-web-browser';
import { InvoiceFile } from '../types';
import { createLogger } from '../utils/logger';

// Create logger for warranty form screen
const logger = createLogger('WarrantyForm');

const WarrantyFormScreen: React.FC = () => {
  const { addWarranty, isLoading, error } = useWarranty();
  
  // Customer Information
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  // Product Information
  const [productName, setProductName] = useState('');
  
  // Installation Details
  const [installationDate, setInstallationDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Invoice Upload
  const [invoice, setInvoice] = useState<InvoiceFile | null>(null);
  
  // Form Validation
  const [customerNameError, setCustomerNameError] = useState('');
  const [customerPhoneError, setCustomerPhoneError] = useState('');
  const [productNameError, setProductNameError] = useState('');
  const [installationDateError, setInstallationDateError] = useState('');
  const [invoiceError, setInvoiceError] = useState('');
  
  // Success message
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    logger.info('Warranty form initialized');
  }, []);

  const validateCustomerName = (name: string): boolean => {
    const isValid = name.trim().length > 0;
    setCustomerNameError(isValid ? '' : 'Customer name is required');
    return isValid;
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) {
      setCustomerPhoneError('Customer phone is required');
      return false;
    }
    
    const phoneRegex = /^[0-9]{10}$/;
    const isValid = phoneRegex.test(phone);
    setCustomerPhoneError(isValid ? '' : 'Please enter a valid phone number');
    return isValid;
  };

  const validateProductName = (productName: string): boolean => {
    const isValid = productName.trim().length > 0;
    setProductNameError(isValid ? '' : 'Product name is required');
    return isValid;
  };

  const validateInvoice = (): boolean => {
    const isValid = invoice !== null;
    setInvoiceError(isValid ? '' : 'Invoice document is required');
    return isValid;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      logger.debug('Installation date selected', { date: selectedDate.toISOString() });
      setInstallationDate(selectedDate);
    }
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const handleDocumentPick = async () => {
    try {
      logger.debug('Opening document picker');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        logger.debug('Document picker canceled by user');
        return;
      }
      
      if (result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        logger.debug('Document selected', { 
          name: selectedAsset.name,
          type: selectedAsset.mimeType,
          size: selectedAsset.size
        });
        
        // Create an InvoiceFile object that works cross-platform
        const invoiceFile: InvoiceFile = {
          uri: selectedAsset.uri,
          name: selectedAsset.name || 'document',
          type: selectedAsset.mimeType || getMimeTypeFromUri(selectedAsset.uri)
        };
        
        setInvoice(invoiceFile);
        setInvoiceError('');
      }
    } catch (err) {
      logger.error('Document picker error', err);
      Alert.alert('Error', 'Failed to pick a document');
    }
  };
  
  // Helper to determine mime type from file extension
  const getMimeTypeFromUri = (uri: string): string => {
    const extension = uri.split('.').pop()?.toLowerCase() || '';
    
    switch (extension) {
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
  };
  
  // Handle viewing the document
  const handleViewInvoice = async (invoiceFile: InvoiceFile) => {
    try {
      if (invoiceFile && invoiceFile.uri) {
        logger.debug('Opening invoice document', { uri: invoiceFile.uri });
        await WebBrowser.openBrowserAsync(invoiceFile.uri);
      } else {
        logger.warn('Unable to open invoice file, URI is missing');
        Alert.alert('Error', 'Cannot open this file type');
      }
    } catch (error) {
      logger.error('Error viewing document:', error);
      Alert.alert('Error', 'Failed to open the document');
    }
  };

  const validateForm = (): boolean => {
    logger.debug('Validating form');
    const isCustomerNameValid = validateCustomerName(customerName);
    const isPhoneValid = validatePhone(customerPhone);
    const isProductNameValid = validateProductName(productName);
    const isInvoiceValid = validateInvoice();
    
    const isValid = isCustomerNameValid && isPhoneValid && isProductNameValid && isInvoiceValid;
    logger.debug('Form validation result', { isValid, validations: {
      name: isCustomerNameValid,
      phone: isPhoneValid,
      product: isProductNameValid,
      invoice: isInvoiceValid
    }});
    
    return isValid;
  };

  const resetForm = () => {
    logger.debug('Resetting form');
    setCustomerName('');
    setCustomerPhone('');
    setProductName('');
    setInstallationDate(new Date());
    setInvoice(null);
    
    // Reset errors
    setCustomerNameError('');
    setCustomerPhoneError('');
    setProductNameError('');
    setInvoiceError('');
  };

  const handleSubmit = async () => {
    logger.info('Attempting to submit warranty form');
    
    if (!validateForm() || !invoice) {
      logger.warn('Form validation failed, submission aborted');
      return;
    }
    
    try {
      logger.debug('Submitting warranty data', {
        customerName,
        customerPhone,
        productName,
        installationDate: installationDate.toISOString(),
        invoiceFileName: invoice.name
      });
      
      await addWarranty({
        customerName,
        customerPhone,
        productName,
        installationDate: installationDate.toISOString(),
        invoice: invoice
      });
      
      logger.info('Warranty submitted successfully');
      setSuccessMessage('Warranty activation submitted successfully!');
      setShowSuccessMessage(true);
      resetForm();
    } catch (err) {
      logger.error('Warranty submission failed', err);
      Alert.alert('Error', 'Failed to submit the warranty activation');
    }
  };

  return (
    <View style={styles.screen}>
      <Appbar.Header>
        <Appbar.Content title="Warranty Activation" />
      </Appbar.Header>
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          
          <TextInput
            label="Customer Name *"
            value={customerName}
            onChangeText={setCustomerName}
            onBlur={() => validateCustomerName(customerName)}
            style={styles.input}
            mode="outlined"
          />
          {!!customerNameError && (
            <HelperText type="error" visible={!!customerNameError}>
              {customerNameError}
            </HelperText>
          )}
          
          <TextInput
            label="Customer Phone *"
            value={customerPhone}
            onChangeText={setCustomerPhone}
            onBlur={() => validatePhone(customerPhone)}
            keyboardType="phone-pad"
            style={styles.input}
            mode="outlined"
          />
          {!!customerPhoneError && (
            <HelperText type="error" visible={!!customerPhoneError}>
              {customerPhoneError}
            </HelperText>
          )}
          
          <Text style={styles.sectionTitle}>Product Information</Text>
          
          <TextInput
            label="Product Name *"
            value={productName}
            onChangeText={setProductName}
            onBlur={() => validateProductName(productName)}
            style={styles.input}
            mode="outlined"
          />
          {!!productNameError && (
            <HelperText type="error" visible={!!productNameError}>
              {productNameError}
            </HelperText>
          )}
          
          <Text style={styles.sectionTitle}>Installation Details</Text>
          
          <Button 
            mode="outlined" 
            onPress={showDatepicker} 
            style={styles.dateButton}
          >
            Installation Date: {installationDate.toLocaleDateString()}
          </Button>
          
          {showDatePicker && (
            <DateTimePicker
              value={installationDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
          
          <Text style={styles.sectionTitle}>Invoice Document</Text>
          
          <Button 
            mode="outlined" 
            onPress={handleDocumentPick} 
            style={styles.documentButton}
            icon="file-upload"
          >
            {invoice ? 'Change Document' : 'Upload Invoice *'}
          </Button>
          
          {invoice && (
            <TouchableOpacity
              style={styles.documentPreview}
              onPress={() => handleViewInvoice(invoice)}
            >
              <View style={styles.fileInfoContainer}>
                <Text style={styles.documentName}>{invoice.name}</Text>
                <Text style={styles.documentType}>{invoice.type}</Text>
              </View>
              
              {invoice.type.startsWith('image/') && (
                <Image
                  source={{ uri: invoice.uri }}
                  style={styles.imagePreview}
                  resizeMode="contain"
                />
              )}
            </TouchableOpacity>
          )}
          
          {!!invoiceError && (
            <HelperText type="error" visible={!!invoiceError}>
              {invoiceError}
            </HelperText>
          )}
          
          {!!error && (
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
          )}
          
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
            style={styles.submitButton}
          >
            Submit For Warranty Activation
          </Button>
        </View>
      </ScrollView>
      
      <Snackbar
        visible={showSuccessMessage}
        onDismiss={() => setShowSuccessMessage(false)}
        duration={3000}
        style={styles.successMessage}
      >
        {successMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  input: {
    marginBottom: SPACING.xs,
  },
  dateButton: {
    marginVertical: SPACING.md,
    borderColor: COLORS.primary,
  },
  documentButton: {
    marginVertical: SPACING.md,
    borderColor: COLORS.primary,
  },
  documentPreview: {
    marginTop: SPACING.sm,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
  },
  documentName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  documentType: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
    marginTop: 4,
  },
  fileInfoContainer: {
    marginBottom: SPACING.sm,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    marginTop: SPACING.md,
  },
  submitButton: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxl,
    paddingVertical: SPACING.xs,
  },
  successMessage: {
    backgroundColor: COLORS.success,
  },
});

export default WarrantyFormScreen; 