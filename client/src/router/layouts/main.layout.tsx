import { Outlet } from 'react-router-dom';
import LinearProgress from '@mui/material/LinearProgress';
import { Navbar } from '@/components';
import { useMainLayoutContext } from '@/context/mainLayout.context';
import configStore from '@/stores/config.store';
import { useEffect } from 'react';
import { Chat } from '@/components';
import customerStore from '@/stores/customer.store';
import { ChatProvider } from '@/context/chat/chat.context';

export default function Layout() {
  const { isLoading } = useMainLayoutContext();
  useEffect(() => {
    configStore.fetchConfig();
    customerStore.fetchCustomers();
  }, []);
  return (
    <div>
      <header>
        <Navbar />
        {isLoading && <LinearProgress />}
      </header>
      <main >
        <ChatProvider>
          <Chat />
          <Outlet /> {/* Render nested routes here */}
        </ChatProvider>
      </main>
      <footer></footer>
    </div>
  );
}