import {
    List,
    Datagrid,
    TextField,
    DateField,
    ShowButton,
    Show,
    SearchInput,
    FilterButton,
    TabbedShowLayout,
    ReferenceManyField
} from 'react-admin';
import { useParams } from 'react-router-dom';
import React from 'react';

// Filters for User List
const userFilters = [
    <SearchInput source="q" alwaysOn placeholder="Search by username" />,
];

// User List component
export const UserList = () => {
    console.log('Rendering UserList component');
    return (
        <List 
            filters={userFilters} 
            actions={<FilterButton />}
            sort={{ field: 'name', order: 'ASC' }}
        >
            <Datagrid bulkActionButtons={false}>
                <TextField source="id" sortable={true} />
                <TextField source="username" sortable={true} />
                <DateField source="createdAt" label="Registration Date" sortable={true} />
                <ShowButton />
            </Datagrid>
        </List>
    );
};

// Add a custom ShowButton component with logging
const LoggingShowButton = (props: any) => {
    return (
        <ShowButton 
            {...props}
            onClick={(e) => {
                // Get the record from the row data
                const record = e.currentTarget.closest('tr')?.dataset?.record;
                console.log("[UserResource] ShowButton clicked with record data:", 
                    record ? JSON.parse(record) : "Record data not available");
                
                // Continue with the default behavior
                if (props.onClick) {
                    props.onClick(e);
                }
            }}
        />
    );
};

// User Detail Show component
export const UserShow = () => {
    const { id } = useParams<{ id: string }>();
    console.log('[UserResource] Rendering UserShow component for user ID:', id);
    
    // Setup logging for component lifecycle
    React.useEffect(() => {
        console.log('[UserResource] UserShow component mounted with ID:', id);
        return () => {
            console.log('[UserResource] UserShow component unmounted');
        };
    }, [id]);
    
    return (
        <Show>
            <TabbedShowLayout>
                <TabbedShowLayout.Tab label="User Details">
                    <TextField source="id" />
                    <TextField source="username" />
                    <DateField source="createdAt" label="Registration Date" />
                </TabbedShowLayout.Tab>
                
                <TabbedShowLayout.Tab label="Warranties">
                    <ReferenceManyField
                        reference="warranties"
                        target="userId"
                        label="Warranties"
                    >
                        <Datagrid 
                            bulkActionButtons={false}
                            rowClick={(id, resource, record) => {
                                console.log('[UserResource] Warranty row clicked:', { id, resource, record });
                                return 'show';
                            }}
                        >
                            <TextField source="id" />
                            <TextField source="customerName" />
                            <TextField source="customerPhone" />
                            <DateField source="installationDate" />
                            <DateField source="invoiceDate" />
                            <TextField source="productName" />
                            <TextField source="status" />
                            <TextField source="documentUrl" />
                            <TextField source="createdAt" />
                            <TextField source="updatedAt" />
                            <LoggingShowButton />
                        </Datagrid>
                    </ReferenceManyField>
                </TabbedShowLayout.Tab>
            </TabbedShowLayout>
        </Show>
    );
}; 