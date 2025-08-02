import { createContext, useState, useContext } from "react";
import { useAuth } from './auth.context';
import { useTokenRefresh } from '../hooks/useTokenRefresh';

const mainLayoutContext = createContext(undefined);
const { Provider } = mainLayoutContext;

const MainLayoutProvider = ({ children }: { children: React.ReactNode }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { isAuthenticated } = useAuth();
    const [requestedUrl, setRequestedUrl] = useState<string | null>(null);
    
    // Set up periodic token refresh
    useTokenRefresh();
    
    return (
        <Provider value={{ isLoading, setIsLoading, isAuthorized: isAuthenticated, requestedUrl, setRequestedUrl }}>
            {children}
        </Provider>
    );
}

const useMainLayoutContext = () => {
    const context = useContext(mainLayoutContext);
    if (!context) {
        throw new Error('useMainLayoutContext must be used within a MainLayoutProvider');
    }
    return context;
}

export { MainLayoutProvider, useMainLayoutContext };