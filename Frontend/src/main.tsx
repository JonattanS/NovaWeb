import { createRoot } from 'react-dom/client';
import AppRoot from './AppRoot.tsx';
import { UserProvider } from '@/contexts/UserContext';
import './index.css';

createRoot(document.getElementById("root")!).render(
  <AppRoot />
);
