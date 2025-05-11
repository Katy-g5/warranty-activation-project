import {
    List,
    Datagrid,
    TextField,
    DateField,
    ReferenceField,
    Edit,
    SimpleForm,
    SelectInput,
    Show,
    SimpleShowLayout,
    EditButton,
    ShowButton,
    SearchInput,
    FilterButton,
    useRecordContext,
    Button,
    FunctionField,
    TextInput,
    DateInput,
    TopToolbar,
    ExportButton,
    useNotify,
    useUpdate,
    SaveButton
} from 'react-admin';
import { useParams } from 'react-router-dom';
import dataProvider from '../dataProvider';
import React from 'react';

// Custom component to display and preview the warranty document
const WarrantyDocumentField = () => {
    const record = useRecordContext();
    
    console.log('WarrantyDocumentField record:', record);
    if (!record || !record.documentUrl) return null;
    
    return (
        <div>
            <p><strong>Document URL:</strong> {record.documentUrl}</p>
            <Button
                label="View Document"
                onClick={() => window.open(`api/${record.documentUrl}`, '_blank')}
                variant="contained"
            />
        </div>
    );
};

// Custom component to display and preview the invoice
const InvoiceField = () => {
    const record = useRecordContext();
    const notify = useNotify();
    
    if (!record || !record.id) return null;
    
    // Set the invoiceUrl based on the ID
    if (!record.invoiceUrl) {
        record.invoiceUrl = `/warranties/${record.id}/invoice`;
    }

    // Check if the warranty has an invoice object with data
    const hasInvoice = record.invoice && record.invoice.uri;
    
    const handleViewInvoice = async () => {
        if (!hasInvoice) {
            notify('No invoice file available', { type: 'warning' });
            return;
        }
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${apiUrl}/warranties/${record.id}/invoice`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
    
            if (!res.ok) throw new Error('Failed to fetch invoice');
    
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (err) {
            console.error(err);
            notify('Failed to open invoice', { type: 'error' });
        }
    };
    
    return (
        <div>
            <p>
                <strong>Invoice:</strong> {record.invoiceUrl}
                {hasInvoice && ` (${record.invoice.name}, ${record.invoice.type})`}
            </p>
            <Button
                label="View Invoice"
                onClick={handleViewInvoice}
                variant="contained"
                disabled={!hasInvoice}
            />
        </div>
    );
};

// Custom component to display invoice information
const InvoiceDisplayField = () => {
    const record = useRecordContext();
    
    if (!record || !record.id) return null;
    
    const hasInvoice = record.invoice && record.invoice.uri;
    
    return (
        <div>
            <p><strong>Invoice Information:</strong></p>
            {hasInvoice ? (
                <ul>
                    <li><strong>Name:</strong> {record.invoice.name}</li>
                    <li><strong>Type:</strong> {record.invoice.type}</li>
                </ul>
            ) : (
                <p>No invoice file available</p>
            )}
        </div>
    );
};

// Filters for Warranty List
const warrantyFilters = [
    <SearchInput source="q" alwaysOn placeholder="Search by product or serial" />,
    <SelectInput 
        source="status" 
        choices={[
            { id: 'pending', name: 'Pending' },
            { id: 'approved', name: 'Approved' },
            { id: 'rejected', name: 'Rejected' },
            { id: 'manual_review', name: 'Manual Review' },
        ]} 
    />
];

// Actions for the warranty list
const WarrantyListActions = () => (
    <TopToolbar>
        <FilterButton />
        <ExportButton />
    </TopToolbar>
);

// Warranty List component
export const WarrantyList = () => {
    console.log('Rendering WarrantyList component');
    
    return (
        <List 
            filters={warrantyFilters}
            actions={<WarrantyListActions />}
            sort={{ field: 'createdAt', order: 'DESC' }}
        >
            <Datagrid bulkActionButtons={false}>
                <TextField source="id" sortable={true} />
                <ReferenceField source="userId" reference="users" link="show">
                    <TextField source="username" />
                </ReferenceField>
                <TextField source="productName" sortable={true} />
                <TextField source="customerName" sortable={true} />
                <TextField source="customerPhone" sortable={true} />
                <DateField source="installationDate" sortable={true} />
                <DateField source="invoiceDate" sortable={true} />
                <TextField source="status" sortable={true} />
                <WarrantyDocumentField />
                <InvoiceField />
                <DateField source="createdAt" sortable={true} />
                <DateField source="updatedAt" sortable={true} />
                <FunctionField
                    label="Status"
                    render={(record: any) => {
                        const statusStyles: Record<string, { color: string, backgroundColor: string }> = {
                            pending: { color: 'black', backgroundColor: '#FFD700' },
                            approved: { color: 'white', backgroundColor: '#4CAF50' },
                            rejected: { color: 'white', backgroundColor: '#F44336' },
                            manual_review: { color: 'white', backgroundColor: '#2196F3' },
                        };
                        
                        const style = statusStyles[record.status] || { color: 'black', backgroundColor: '#e0e0e0' };
                        
                        return (
                            <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                ...style
                            }}>
                                {record.status}
                            </span>
                        );
                    }}
                    sortable={true}
                    source="status"
                />
                <EditButton />
                <ShowButton />
            </Datagrid>
        </List>
    );
};

// Warranty Edit component
export const WarrantyEdit = () => {
    const { id } = useParams<{ id: string }>();
    const notify = useNotify();
    const [update, { isLoading }] = useUpdate();
    
    console.log('[WarrantyEdit] Rendering component for warranty ID:', id);
    
    // Set up additional logging for the component lifecycle
    React.useEffect(() => {
        console.log('[WarrantyEdit] Component mounted with ID:', id);
        return () => {
            console.log('[WarrantyEdit] Component unmounted');
        };
    }, [id]);
    
    // Custom submit handler to ensure update happens
    const handleSubmit = (formData: any) => {
        console.log('[WarrantyEdit] Form submitted with data:', formData);
        
        // Force the update call using the useUpdate hook directly
        update(
            'warranties',
            { 
                id, 
                data: { status: formData.status },
                previousData: formData
            },
            {
                onSuccess: (data) => {
                    console.log('[WarrantyEdit] Update successful:', data);
                    notify('Warranty status updated successfully', { type: 'success' });
                },
                onError: (error) => {
                    console.error('[WarrantyEdit] Update failed:', error);
                    notify(`Error updating status: ${error.message}`, { type: 'error' });
                }
            }
        );
    };
    
    // Custom toolbar with only our custom Update Status button
    const CustomToolbar = () => (
        <div style={{ display: 'flex', margin: '15px 0 15px 15px' }}>
            <Button
                label="Update Status"
                onClick={() => document.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}
                disabled={isLoading}
                variant="contained"
                color="primary"
            />
        </div>
    );

    return (
        <Edit
            mutationOptions={{
                onSuccess: (data) => {
                    console.log('[WarrantyEdit] Update successful, response data:', data);
                    notify('Warranty status updated successfully', { type: 'success' });
                },
                onError: (error) => {
                    console.error('[WarrantyEdit] Error updating warranty:', error);
                    notify('Error updating warranty status', { type: 'error' });
                }
            }}
        >
            <SimpleForm 
                onSubmit={handleSubmit}
                toolbar={<CustomToolbar />}
            >
                {/* Content wrapped in a function to access record context */}
                <WarrantyEditForm isLoading={isLoading} />
            </SimpleForm>
        </Edit>
    );
};

// Form contents as a separate component to properly use useRecordContext
const WarrantyEditForm = ({ isLoading }: { isLoading: boolean }) => {
    const record = useRecordContext();
    
    console.log('[WarrantyEditForm] Current record:', record);
    
    return (
        <SelectInput 
            source="status"
            choices={[
                { id: 'pending', name: 'Pending' },
                { id: 'approved', name: 'Approved' },
                { id: 'rejected', name: 'Rejected' },
                { id: 'manual_review', name: 'Manual Review' },
            ]}
            fullWidth
            onChange={(e) => {
                console.log('[WarrantyEdit] Status changed to:', e.target.value);
            }}
        />
    );
};

// Warranty Show component
export const WarrantyShow = () => {
    const { id } = useParams<{ id: string }>();
    const notify = useNotify();
    console.log('[WarrantyShow] Rendering component for warranty ID:', id);
    
    // Set up additional logging for the component lifecycle
    React.useEffect(() => {
        console.log('[WarrantyShow] Component mounted with ID:', id);
        
        // Validate the ID parameter
        if (!id) {
            console.error('[WarrantyShow] Missing ID parameter in URL');
            notify('Error: Missing warranty ID', { type: 'error' });
            return;
        }
        
        // Check if the ID is valid
        if (isNaN(parseInt(id))) {
            console.error('[WarrantyShow] Invalid ID format:', id);
            notify('Error: Invalid warranty ID format', { type: 'error' });
            return;
        }
        
        // Log the current URL and route
        console.log('[WarrantyShow] Current URL:', window.location.href);
        console.log('[WarrantyShow] Pathname:', window.location.pathname);
        
        // Add a logger to track data loading errors
        const handleError = (error: Error): void => {
            console.error('[WarrantyShow] Error in data loading:', error);
            notify('Error loading warranty: ' + error.message, { type: 'error' });
        };
        
        // Simulate checking if data is available
        const checkData = async (): Promise<void> => {
            try {
                console.log('[WarrantyShow] Making direct API call to check data availability');
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
                console.log('[WarrantyShow] Using API URL:', apiUrl);
                
                const token = localStorage.getItem('token');
                console.log('[WarrantyShow] Auth token available:', !!token);
                
                const response = await fetch(`${apiUrl}/warranties/${id}`, {
                    headers: {
                        'Authorization': token ? `Bearer ${token}` : '',
                        'Accept': 'application/json',
                    }
                });
                
                if (!response.ok) {
                    console.error(`[WarrantyShow] Direct API check failed with status: ${response.status}`);
                    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                    console.error('[WarrantyShow] Error details:', errorData);
                } else {
                    const data = await response.json();
                    console.log('[WarrantyShow] Direct API check successful:', data);
                    // Check the structure of the response
                    if (data.warranty) {
                        console.log('[WarrantyShow] Found warranty under "warranty" key:', data.warranty);
                    } else if (data.warranties) {
                        console.log('[WarrantyShow] Found warranty under "warranties" key:', data.warranties);
                    } else {
                        console.log('[WarrantyShow] Warranty data structure:', Object.keys(data));
                    }
                }
            } catch (error) {
                console.error('[WarrantyShow] Error in direct API check:', error);
            }
        };
        
        // Run the check
        checkData();
        
        return () => {
            console.log('[WarrantyShow] Component unmounted');
        };
    }, [id, notify]);

    // Check if we have a valid ID, if not show an error message
    if (!id || isNaN(parseInt(id))) {
        return (
            <div>
                <h1>Error: Invalid Warranty ID</h1>
                <p>The warranty ID "{id}" is not valid. Please go back and try again.</p>
            </div>
        );
    }

    // Wrap the component in a try-catch for any rendering errors
    try {
        return (
            <Show>
                <SimpleShowLayout>
                    <TextField source="id" />
                    <ReferenceField 
                        source="userId" 
                        reference="users" 
                        link="show"
                        emptyText="Unknown User"
                    >
                        <TextField source="username" />
                    </ReferenceField>
                    <TextField source="productName" emptyText="No product name" />
                    <TextField source="customerName" emptyText="No customer name" />
                    <TextField source="customerPhone" emptyText="No phone number" />
                    <DateField source="installationDate" emptyText="No installation date" />
                    <DateField source="invoiceDate" emptyText="No invoice date" />
                    <TextField source="status" emptyText="No status" />
                    <WarrantyDocumentField />
                    <InvoiceDisplayField />
                    <InvoiceField />
                    <DateField source="createdAt" emptyText="No creation date" />
                    <DateField source="updatedAt" emptyText="No update date" />
                </SimpleShowLayout>
            </Show>
        );
    } catch (error) {
        console.error('[WarrantyShow] Error rendering component:', error);
        notify('Error displaying warranty details', { type: 'error' });
        return (
            <div>
                <h1>Error Loading Warranty</h1>
                <p>There was an error loading this warranty. Please try again later.</p>
                <pre>{error instanceof Error ? error.message : 'Unknown error'}</pre>
            </div>
        );
    }
}; 