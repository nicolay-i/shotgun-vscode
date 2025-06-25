import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
if (!container) throw new Error('Не найден элемент root');

const root = createRoot(container);
root.render(<App />); 