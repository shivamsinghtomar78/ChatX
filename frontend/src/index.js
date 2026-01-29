import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
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
    <App />
  </React.StrictMode>
);