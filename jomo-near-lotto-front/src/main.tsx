import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/globals.css';
import App from '@/App';
// 1. Додаємо імпорт провайдера гаманця
import { NearProvider } from 'near-connect-hooks';

const rootElement = document.getElementById('root');

if (rootElement) {
    createRoot(rootElement).render(
        <StrictMode>
            {/* 2. Огортаємо наш додаток, щоб усі компоненти всередині знали про мережу */}
            <NearProvider config={{ network: 'testnet' }}>
                <App />
            </NearProvider>
        </StrictMode>
    );
}