import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert, Modal } from 'react-native';
import { Text, Card, Chip, Appbar, Searchbar, Divider, ActivityIndicator, IconButton } from 'react-native-paper';
import { useWarranty } from '../context/WarrantyContext';
import { Warranty, WarrantyStatus } from '../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../utils/theme';
import { createLogger } from '../utils/logger';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import WebView from 'react-native-webview';

// Create logger for warranties list screen
const logger = createLogger('WarrantiesList');

const WarrantiesListScreen: React.FC = () => {
  const { warranties, isLoading, getWarranties } = useWarranty();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredWarranties, setFilteredWarranties] = useState<Warranty[]>([]);
  const [selectedWarranty, setSelectedWarranty] = useState<Warranty | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    logger.info('Warranties list screen mounted');
    getWarranties();
  }, []);
  
  useEffect(() => {
    if (searchQuery.trim() === '') {
      logger.debug('No search query, showing all warranties');
      setFilteredWarranties(warranties);
    } else {
      const query = searchQuery.toLowerCase();
      logger.debug(`Filtering warranties by query: "${query}"`);
      
      const filtered = warranties.filter(
        warranty => 
          warranty.customerName.toLowerCase().includes(query) ||
          warranty.customerPhone.toLowerCase().includes(query) ||
          warranty.productName.toLowerCase().includes(query)
      );
      
      logger.debug(`Found ${filtered.length} matching warranties`);
      setFilteredWarranties(filtered);
    }
  }, [warranties, searchQuery]);

  useEffect(() => {
    if (selectedWarranty) {
      setShowInvoice(true);
      setLoading(true);
    }
  }, [selectedWarranty]);
  
  const onRefresh = async () => {
    logger.info('Refreshing warranties list');
    setRefreshing(true);
    await getWarranties();
    setRefreshing(false);
  };
  
  const handleSearch = (query: string) => {
    logger.debug(`Search query changed: "${query}"`);
    setSearchQuery(query);
  };
  
  const getStatusColor = (status: WarrantyStatus) => {
    switch(status) {
      case WarrantyStatus.APPROVED:
        return COLORS.success;
      case WarrantyStatus.REJECTED:
        return COLORS.error;
      case WarrantyStatus.PENDING:
      case WarrantyStatus.MANUAL_REVIEW:
      default:
        return COLORS.warning;
    }
  };
  
  const getInvoiceDisplayText = (warranty: Warranty) => {
    if (warranty.invoice && warranty.invoice.name) {
      return warranty.invoice.name;
    }
    return 'View Document';
  };

  const handleViewInvoice = (warranty: Warranty) => {
    setSelectedWarranty(warranty);
  };
  
  const renderWarrantyItem = ({ item }: { item: Warranty }) => {
    const installationDate = new Date(item.installationDate).toLocaleDateString();
    const submissionDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Missing submission date";
    
    return (
      <Card style={styles.card} mode="outlined">
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text style={styles.productTitle}>
              {item.productName}
            </Text>
            <Chip
              style={[styles.statusChip, { backgroundColor: getStatusColor(item.status || WarrantyStatus.PENDING) }]}
              textStyle={styles.statusText}
            >
              {item.status}
            </Chip>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.clientInfo}>
            <Text style={styles.label}>Client:</Text>
            <Text style={styles.value}>{item.customerName}</Text>
          </View>
          
          <View style={styles.clientInfo}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{item.customerPhone}</Text>
          </View>
          
          <View style={styles.clientInfo}>
            <Text style={styles.label}>Product Name:</Text>
            <Text style={styles.value}>{item.productName}</Text>
          </View>
          
          <View style={styles.datesContainer}>
            <View style={styles.dateInfo}>
              <Text style={styles.dateLabel}>Installed</Text>
              <Text style={styles.dateValue}>{installationDate}</Text>
            </View>
            
            <View style={styles.dateInfo}>
              <Text style={styles.dateLabel}>Submitted</Text>
              <Text style={styles.dateValue}>{submissionDate}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.invoiceContainer}
            onPress={() => handleViewInvoice(item)}
          >
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>Invoice</Text>
              <Text style={styles.viewInvoiceText}>View Document</Text>
            </View>
            <Text style={styles.invoiceValue}>{getInvoiceDisplayText(item)}</Text>
          </TouchableOpacity>
        </Card.Content>
      </Card>
    );
  };
  
  return (
    <View style={styles.screen}>
      <Appbar.Header>
        <Appbar.Content title="Warranty Activations" />
      </Appbar.Header>
      
      <View style={styles.container}>
        <Searchbar
          placeholder="Search warranties..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        {isLoading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredWarranties}
            keyExtractor={(item) => item.id?.toString() || ''}
            renderItem={renderWarrantyItem}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No warranties found for this search' : 'No warranties submitted yet'}
                </Text>
              </View>
            }
          />
        )}
        
        {/* Invoice WebView Modal */}
        <Modal
          visible={showInvoice}
          animationType="slide"
          onRequestClose={() => setShowInvoice(false)}
        >
          <View style={styles.modalContainer}>
            <Appbar.Header>
              <Appbar.BackAction onPress={() => setShowInvoice(false)} />
              <Appbar.Content title="Invoice Document" />
            </Appbar.Header>
            
            {selectedWarranty && (
              <WebView
                source={{
                  uri: `${client.defaults.baseURL}/warranties/${selectedWarranty.id}/invoice`,
                  headers: {
                    Authorization: `Bearer ${user?.token}`,
                  },
                }}
                style={styles.webview}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                onError={(e) => {
                  logger.error('Error loading invoice in WebView:', e.nativeEvent);
                  Alert.alert('Error', 'Failed to load the invoice document.');
                  setShowInvoice(false);
                }}
              />
            )}
            
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            )}
          </View>
        </Modal>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  container: {
    flex: 1,
  },
  searchBar: {
    margin: SPACING.md,
    elevation: 2,
  },
  listContainer: {
    padding: SPACING.md,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginBottom: SPACING.md,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  productTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    flex: 1,
  },
  statusChip: {
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: SPACING.sm,
  },
  clientInfo: {
    flexDirection: 'row',
    marginVertical: SPACING.xs / 2,
  },
  label: {
    width: 100,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  value: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  datesContainer: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    justifyContent: 'space-between',
  },
  dateInfo: {
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
  },
  dateValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  invoiceContainer: {
    marginTop: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: BORDER_RADIUS.sm,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    fontWeight: 'bold',
  },
  invoiceValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginTop: 4,
  },
  viewInvoiceText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
  },
  webview: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
});

export default WarrantiesListScreen; 