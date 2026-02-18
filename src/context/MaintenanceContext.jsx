import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const MaintenanceContext = createContext();

export function MaintenanceProvider({ children }) {
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [maintenanceEndTime, setMaintenanceEndTime] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const intervalRef = useRef(null);

    const formatTime = useCallback((ms) => {
        if (!ms || ms <= 0) return null;
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        }
        return `${minutes}m ${seconds}s`;
    }, []);

    // Poll backend for maintenance status every 5 seconds
    const fetchMaintenanceStatus = useCallback(async () => {
        try {
            const res = await axios.get('/api/settings/maintenance');
            setMaintenanceMode(res.data.maintenanceMode);
            if (res.data.maintenanceEndTime && res.data.maintenanceEndTime > 0) {
                setMaintenanceEndTime(res.data.maintenanceEndTime);
            } else {
                setMaintenanceEndTime(null);
            }
        } catch {
            // If backend is unreachable, don't change state
        }
    }, []);

    useEffect(() => {
        fetchMaintenanceStatus();
    }, [fetchMaintenanceStatus]);

    // Update countdown timer every second
    useEffect(() => {
        if (!maintenanceEndTime) {
            setTimeRemaining(null);
            return;
        }

        const timer = setInterval(() => {
            const remaining = maintenanceEndTime - Date.now();
            if (remaining <= 0) {
                setTimeRemaining(null);
                // Server will auto-disable, next poll picks it up
            } else {
                setTimeRemaining(formatTime(remaining));
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [maintenanceEndTime, formatTime]);

    const toggleMaintenance = useCallback(async (token) => {
        try {
            const res = await axios.post('/api/settings/maintenance/toggle', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMaintenanceMode(res.data.maintenanceMode);
            if (!res.data.maintenanceMode) {
                setMaintenanceEndTime(null);
                setTimeRemaining(null);
            }
        } catch (err) {
            console.error('Failed to toggle maintenance', err);
        }
    }, []);

    const startMaintenanceWithTimer = useCallback(async (minutes, token) => {
        if (minutes <= 0) return;
        try {
            const res = await axios.post('/api/settings/maintenance/timer', { minutes }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMaintenanceMode(true);
            setMaintenanceEndTime(res.data.maintenanceEndTime);
        } catch (err) {
            console.error('Failed to start maintenance timer', err);
        }
    }, []);

    return (
        <MaintenanceContext.Provider value={{
            maintenanceMode,
            toggleMaintenance,
            startMaintenanceWithTimer,
            timeRemaining,
            maintenanceEndTime
        }}>
            {children}
        </MaintenanceContext.Provider>
    );
}

export function useMaintenance() {
    return useContext(MaintenanceContext);
}
