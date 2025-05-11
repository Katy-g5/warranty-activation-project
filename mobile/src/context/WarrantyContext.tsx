import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Warranty, WarrantyState, InvoiceFile } from '../types';
import { useAuth } from './AuthContext';
import * as warrantyApi from '../api/warranties';
import { createLogger } from '../utils/logger';

// Create logger for warranty context
const logger = createLogger('Warranty');

// Interface for creating a new warranty
export interface CreateWarrantyData extends Warranty {}

interface WarrantyContextType extends WarrantyState {
  addWarranty: (warranty: warrantyApi.CreateWarrantyRequest) => Promise<void>;
  getWarranties: () => Promise<void>;
}

// Default context value
const defaultContextValue: WarrantyContextType = {
  warranties: [],
  isLoading: false,
  error: null,
  addWarranty: async () => {},
  getWarranties: async () => {},
};

// Create the context
const WarrantyContext = createContext<WarrantyContextType>(defaultContextValue);

// Custom hook to use the warranty context
export const useWarranty = () => useContext(WarrantyContext);

interface WarrantyProviderProps {
  children: ReactNode;
}

// Warranty Provider component
export const WarrantyProvider: React.FC<WarrantyProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<WarrantyState>({
    warranties: [],
    isLoading: false,
    error: null,
  });

  // Load warranties when user changes
  useEffect(() => {
    if (user) {
      logger.info('User authenticated, fetching warranties');
      getWarranties();
    } else {
      logger.info('No user authenticated, clearing warranties');
      setState(prev => ({ ...prev, warranties: [] }));
    }
  }, [user]);

  // Get warranties from API
  const getWarranties = async () => {
    if (!user) {
      logger.warn('Attempted to fetch warranties without authentication');
      return;
    }
    
    logger.info('Fetching warranties');
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const warranties = await warrantyApi.getWarranties();
      logger.info(`Successfully fetched ${warranties.length} warranties`);
      logger.debug('Warranty data:', warranties);
      setState(prev => ({ ...prev, warranties, isLoading: false }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to load warranties';
      logger.error('Error fetching warranties:', errorMessage);
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isLoading: false 
      }));
    }
  };

  // Add a new warranty
  const addWarranty = async (warrantyData: warrantyApi.CreateWarrantyRequest) => {
    if (!user) {
      logger.warn('Attempted to add warranty without authentication');
      return;
    }
    
    logger.info('Creating new warranty', { 
      customerName: warrantyData.customerName,
      productName: warrantyData.productName,
      invoice: { 
        name: warrantyData.invoice.name, 
        type: warrantyData.invoice.type 
      }
    });
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Send the warranty data directly to the API
      const newWarranty = await warrantyApi.createWarranty(warrantyData);
      
      logger.info('Successfully created warranty', { 
        id: newWarranty.id,
        customerName: newWarranty.customerName,
        status: newWarranty.status
      });
      
      // Update the local state with the new warranty
      setState(prev => ({ 
        ...prev, 
        warranties: [...prev.warranties, newWarranty], 
        isLoading: false 
      }));
    } catch (error: any) {
      logger.error('Error creating warranty:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add warranty';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isLoading: false 
      }));
    }
  };

  const value = {
    ...state,
    addWarranty,
    getWarranties,
  };

  return (
    <WarrantyContext.Provider value={value}>
      {children}
    </WarrantyContext.Provider>
  );
};

export default WarrantyContext; 