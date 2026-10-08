import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { initPwaSafeArea } from './lib/pwaSafeArea';
import { registerServiceWorker } from './lib/pwa';
import { installNewVersionReload } from './lib/newVersionReload';
import './styles/global.css';

initPwaSafeArea();
registerServiceWorker();
installNewVersionReload();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
