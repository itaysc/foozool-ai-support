import { createContext, useState, useContext } from "react";
import { useRefreshToken } from '../hooks/useRefreshToken';

const mainLayoutContext = createContext(undefined);
const { Provider } = mainLayoutContext;

const MainLayoutProvider = ({ children }: { children: React.ReactNode }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { isAuthorized } = useRefreshToken();
    const [requestedUrl, setRequestedUrl] = useState<string | null>(null);
    return (
        <Provider value={{ isLoading, setIsLoading, isAuthorized, requestedUrl, setRequestedUrl }}>
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