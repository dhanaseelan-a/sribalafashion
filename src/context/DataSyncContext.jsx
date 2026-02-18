import { createContext, useContext, useCallback, useEffect, useRef } from 'react';

const DataSyncContext = createContext();

const SYNC_KEY = 'sribalafashion_data_sync';

export function DataSyncProvider({ children }) {

    // Trigger a sync event that other tabs and same-tab listeners can detect
    const notifyDataChange = useCallback((dataType) => {
        const event = JSON.stringify({ type: dataType, timestamp: Date.now() });
        localStorage.setItem(SYNC_KEY, event);
        // Also dispatch a custom event for same-tab listeners
        window.dispatchEvent(new CustomEvent('data-sync', { detail: { type: dataType } }));
    }, []);

    return (
        <DataSyncContext.Provider value={{ notifyDataChange }}>
            {children}
        </DataSyncContext.Provider>
    );
}

export function useDataSync() {
    return useContext(DataSyncContext);
}

// Hook: listen for data changes (from other tabs via storage, from same tab via custom event)
export function useDataListener(dataType, callback) {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useEffect(() => {
        // Listen for cross-tab changes
        const handleStorage = (e) => {
            if (e.key === SYNC_KEY && e.newValue) {
                try {
                    const data = JSON.parse(e.newValue);
                    if (data.type === dataType) {
                        callbackRef.current();
                    }
                } catch { /* ignore */ }
            }
        };

        // Listen for same-tab changes
        const handleCustom = (e) => {
            if (e.detail?.type === dataType) {
                callbackRef.current();
            }
        };

        window.addEventListener('storage', handleStorage);
        window.addEventListener('data-sync', handleCustom);

        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('data-sync', handleCustom);
        };
    }, [dataType]);
}
