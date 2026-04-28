import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import HomePage from './pages/HomePage';
import SlotTablePage from './pages/SlotTablePage';
import { SLOT_TABLES } from './slotTables';
import './index.css';

const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      ...SLOT_TABLES.map((t) => ({
        path: t.slug,
        element: <SlotTablePage table={t} />,
      })),
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
