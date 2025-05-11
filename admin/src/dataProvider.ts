import { DataProvider, fetchUtils } from 'react-admin';
import queryString from 'query-string';

// Extend the DataProvider type to include our custom method
export interface ExtendedDataProvider extends DataProvider {
    getInvoice: (warrantyId: string | number) => Promise<{
        data: Blob;
        contentType: string;
        filename: string;
    }>;
}

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const httpClient = async (url: string, options: any = {}) => {
    console.log(`[httpClient] Request to: ${url}`, { 
        method: options.method || 'GET',
        headers: options.headers ? Object.fromEntries(options.headers.entries()) : {},
        body: options.body ? JSON.parse(options.body) : undefined
    });

    if (!options.headers) {
        options.headers = new Headers({ Accept: 'application/json' });
    }

    const token = localStorage.getItem('token');
    if (token) {
        options.headers.set('Authorization', `Bearer ${token}`);
        console.log(`[httpClient] Using auth token: ${token.substring(0, 10)}...`);
    }

    try {
        console.time(`[httpClient] Request time for ${url}`);
        const response = await fetchUtils.fetchJson(url, options);
        console.timeEnd(`[httpClient] Request time for ${url}`);
        
        console.log(`[httpClient] Response from ${url}:`, {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            dataKeys: Object.keys(response.json || {}),
            dataLength: typeof response.json === 'object' 
                ? (Array.isArray(response.json) ? response.json.length : Object.keys(response.json).length) 
                : 'N/A',
        });
        
        // Log the first few properties of each object for debugging
        if (response.json && typeof response.json === 'object') {
            if (Array.isArray(response.json)) {
                console.log(`[httpClient] First item sample:`, 
                    response.json.length > 0 ? response.json[0] : 'Empty array');
            } else {
                // For each top-level key that's an object, show a sample
                Object.entries(response.json).forEach(([key, value]) => {
                    if (value && typeof value === 'object') {
                        console.log(`[httpClient] Sample of ${key}:`, value);
                    }
                });
            }
        }
        
        return response;
    } catch (error) {
        console.error(`[httpClient] ERROR for ${url}:`, error);
        
        // Try to extract and log more error details if possible
        if (error instanceof Error) {
            console.error(`[httpClient] Error message: ${error.message}`);
            console.error(`[httpClient] Error stack: ${error.stack}`);
            
            // Check if it's a fetchUtils error with a body
            if ('body' in error && error.body) {
                console.error(`[httpClient] Error response body:`, error.body);
            }
            
            // Check if it's an HTTP error with a status
            if ('status' in error) {
                console.error(`[httpClient] Error HTTP status:`, (error as any).status);
            }
        }
        
        throw error;
    }
};

const dataProvider: ExtendedDataProvider = {
    getList: async (resource, params) => {
        const { page, perPage } = params.pagination || { page: 1, perPage: 10 };
        const { field, order } = params.sort || { field: 'id', order: 'ASC' };

        const query = {
            ...params.filter,
            _sort: field,
            _order: order,
            _start: (page - 1) * perPage,
            _end: page * perPage,
        };

        const url = `${apiUrl}/${resource}?${queryString.stringify(query)}`;
        const { headers, json } = await httpClient(url);

        return {
            data: json[resource],
            total: parseInt(headers.get('x-total-count') || json[resource].length?.toString() || '0', 10),
        };
    },

    getOne: async (resource, params) => {
        console.log(`[getOne] Fetching ${resource} with ID:`, params.id);
        console.log(`[getOne] Request URL: ${apiUrl}/${resource}/${params.id}`);
        
        try {
            const { json } = await httpClient(`${apiUrl}/${resource}/${params.id}`);
            console.log(`[getOne] Response for ${resource}/${params.id}:`, json);
            
            // Determine the response key based on resource type
            let r = resource === "users" ? "user" : resource;
            
            // Handle different response formats
            let data;
            
            // Check if the expected key exists in the response
            if (json[r]) {
                // Standard format: { "warranties": { ... } }
                data = json[r];
                console.log(`[getOne] Found data under key "${r}"`, data);
            } 
            // Check if response has id and typical fields (direct object response)
            else if (json.id && resource === 'warranties' && 
                     (json.hasOwnProperty('status') || json.hasOwnProperty('customerName'))) {
                // Direct object: { id: 1, status: "approved", ... } 
                data = json;
                console.log(`[getOne] Direct warranty object returned (no wrapper)`, data);
            }
            else if (json.id && resource === 'users' && 
                     (json.hasOwnProperty('username') || json.hasOwnProperty('isAdmin'))) {
                // Direct user object
                data = json;
                console.log(`[getOne] Direct user object returned (no wrapper)`, data);
            }
            // Check for singular resource name
            else if (r.endsWith('ies') && json[r.replace(/ies$/, 'y')]) {
                // Handle singular/plural mismatch: warranties -> warranty
                const singularKey = r.replace(/ies$/, 'y');
                data = json[singularKey];
                console.log(`[getOne] Found data under singular key "${singularKey}"`, data);
            }
            else if (r.endsWith('s') && json[r.slice(0, -1)]) {
                // Handle singular/plural mismatch: users -> user
                const singularKey = r.slice(0, -1);
                data = json[singularKey];
                console.log(`[getOne] Found data under singular key "${singularKey}"`, data);
            }
            else {
                // If we can't find the data under expected keys, log and try to handle anyway
                console.error(`[getOne] ERROR: Expected response key "${r}" not found in:`, json);
                console.error(`[getOne] Available keys:`, Object.keys(json));
                
                // If the response itself has an ID that matches the requested ID, assume it's the data
                if (json.id && json.id.toString() === params.id.toString()) {
                    console.log(`[getOne] Using the response object itself as data since ID matches`, json);
                    data = json;
                } else {
                    // Last resort: check all top-level object properties 
                    // to find one with matching ID
                    const matchingProperty = Object.entries(json)
                        .find(([key, value]) => 
                            typeof value === 'object' && 
                            value !== null && 
                            'id' in value && 
                            (value as any).id.toString() === params.id.toString()
                        );
                    
                    if (matchingProperty) {
                        console.log(`[getOne] Found matching data under key "${matchingProperty[0]}"`, matchingProperty[1]);
                        data = matchingProperty[1];
                    } else {
                        // If all else fails, use the response as is
                        console.log(`[getOne] No matching data found, using response object as is`);
                        data = json;
                    }
                }
            }
            
            return { data };
        } catch (error) {
            console.error(`[getOne] ERROR fetching ${resource}/${params.id}:`, error);
            throw error;
        }
    },

    getMany: async (resource, params) => {
        console.log(`[getMany] Fetching ${resource} with IDs:`, params.ids);
        
        try {
            const query = { id: params.ids };
            const url = `${apiUrl}/${resource}?${queryString.stringify(query)}`;
            const { json } = await httpClient(url);
            console.log(`[getMany] Response for ${resource}:`, json);
            
            // Ensure we have an array of data
            let data;
            if (Array.isArray(json)) {
                // If json is already an array, use it
                data = json;
            } else if (json[resource] && Array.isArray(json[resource])) {
                // If json has a property named after resource and it's an array, use that
                data = json[resource];
            } else if (resource === 'warranties' && json.warranty && !Array.isArray(json.warranty)) {
                // Special case: single warranty object returned instead of array
                data = [json.warranty];
            } else if (resource === 'users' && json.user && !Array.isArray(json.user)) {
                // Special case: single user object returned instead of array
                data = [json.user];
            } else {
                // If we can't find an array, try to convert the object to an array
                console.error(`[getMany] Expected an array but got:`, json);
                // Try to extract values from the object
                data = Object.values(json).filter(value => typeof value === 'object');
                if (data.length === 0) {
                    // If all else fails, return an empty array
                    console.error(`[getMany] Could not extract data, returning empty array`);
                    data = [];
                }
            }
            
            console.log(`[getMany] Processed data:`, data);
            return { data };
        } catch (error) {
            console.error(`[getMany] ERROR fetching ${resource} with IDs ${params.ids}:`, error);
            throw error;
        }
    },

    getManyReference: async (resource, params) => {
        console.log(`[getManyReference] Fetching ${resource} with reference ${params.target}=${params.id}`);
        
        try {
            const { page, perPage } = params.pagination;
            const { field, order } = params.sort;

            const query = {
                ...params.filter,
                [params.target]: params.id,
                _sort: field,
                _order: order,
                _start: (page - 1) * perPage,
                _end: page * perPage,
            };

            const url = `${apiUrl}/${resource}?${queryString.stringify(query)}`;
            const { headers, json } = await httpClient(url);
            console.log(`[getManyReference] Response for ${resource}:`, json);
            
            // Ensure we have an array of data
            let data;
            if (Array.isArray(json)) {
                // If json is already an array, use it
                data = json;
            } else if (json[resource] && Array.isArray(json[resource])) {
                // If json has a property named after resource and it's an array, use that
                data = json[resource];
            } else {
                // If we can't find an array, try to convert the object to an array
                console.error(`[getManyReference] Expected an array but got:`, json);
                // Try to extract values from the object
                data = Object.values(json).filter(value => typeof value === 'object' && value !== null);
                if (data.length === 0) {
                    // If all else fails, return an empty array
                    console.error(`[getManyReference] Could not extract data, returning empty array`);
                    data = [];
                }
            }
            
            console.log(`[getManyReference] Processed data:`, data);
            
            // Get the total count
            const total = parseInt(headers.get('x-total-count') || data.length.toString(), 10);
            console.log(`[getManyReference] Total count:`, total);
            
            return {
                data,
                total,
            };
        } catch (error) {
            console.error(`[getManyReference] ERROR for ${resource} with reference ${params.target}=${params.id}:`, error);
            throw error;
        }
    },

    update: async (resource, params) => {
        console.log(`[update] Called for ${resource} with ID:`, params.id);
        console.log(`[update] Update data:`, params.data);
        console.log(`[update] Request URL: ${apiUrl}/${resource}/${params.id}`);
        
        const { json } = await httpClient(`${apiUrl}/${resource}/${params.id}`, {
            method: 'PATCH',
            body: JSON.stringify(params.data),
        });
        console.log(`[update] Response:`, json);
        return { data: json };
    },

    updateMany: async (resource, params) => {
        const query = {
            filter: JSON.stringify({ id: params.ids }),
        };

        await httpClient(`${apiUrl}/${resource}?${queryString.stringify(query)}`, {
            method: 'PATCH',
            body: JSON.stringify(params.data),
        });

        return { data: params.ids };
    },

    create: async (resource, params) => {
        const { json } = await httpClient(`${apiUrl}/${resource}`, {
            method: 'POST',
            body: JSON.stringify(params.data),
        });

        return { data: json };
    },

    delete: async (resource, params) => {
        const { json } = await httpClient(`${apiUrl}/${resource}/${params.id}`, {
            method: 'DELETE',
        });
        return { data: json };
    },

    deleteMany: async (resource, params) => {
        const query = {
            filter: JSON.stringify({ id: params.ids }),
        };

        await httpClient(`${apiUrl}/${resource}?${queryString.stringify(query)}`, {
            method: 'DELETE',
        });

        return { data: params.ids };
    },

    // Custom method to fetch warranty invoice file
    getInvoice: async (warrantyId: string | number) => {
        try {
            // We use fetch directly instead of httpClient to handle file response
            const token = localStorage.getItem('token');
            const headers: HeadersInit = {
                'Authorization': `Bearer ${token}`,
            };
            
            const response = await fetch(`${apiUrl}/warranties/${warrantyId}/invoice`, {
                method: 'GET',
                headers,
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `Failed to fetch invoice: ${response.status} ${response.statusText}`);
            }
            
            const blob = await response.blob();
            
            // Get content type from response or default to application/pdf
            const contentType = response.headers.get('Content-Type') || 'application/pdf';
            
            // Try to get filename from Content-Disposition header or create a default one
            let filename = `invoice-${warrantyId}`;
            const contentDisposition = response.headers.get('Content-Disposition');
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename=["']?([^"']+)["']?/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1];
                }
            }
            
            // Add file extension if not present
            if (!filename.includes('.')) {
                if (contentType.includes('pdf')) {
                    filename += '.pdf';
                } else if (contentType.includes('image')) {
                    filename += contentType.includes('jpeg') ? '.jpg' : '.png';
                }
            }
            
            return {
                data: blob,
                contentType,
                filename,
            };
        } catch (error) {
            console.error('Error fetching invoice:', error);
            throw error;
        }
    },
};

export default dataProvider;
