import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import AuthPage from './components/AuthPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import './globals.css';
import './performance.css';

// Performance monitoring
if (process.env.NODE_ENV === 'production') {
  // Report Web Vitals
  const reportWebVitals = (metric) => {
    console.log(metric);
    // Send to analytics endpoint if needed
  };

  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(reportWebVitals);
    getFID(reportWebVitals);
    getFCP(reportWebVitals);
    getLCP(reportWebVitals);
    getTTFB(reportWebVitals);
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <App />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);