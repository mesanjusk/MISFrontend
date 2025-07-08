import axios from 'axios';

// Track all Axios requests and toggle the disabled state of
// every form submit button while requests are in-flight.

let activeRequests = 0;

function toggleSubmitButtons(disabled) {
  const buttons = document.querySelectorAll('button[type="submit"]');
  buttons.forEach(btn => {
    btn.disabled = disabled;
  });
}

axios.interceptors.request.use(config => {
  activeRequests += 1;
  if (activeRequests === 1) {
    toggleSubmitButtons(true);
  }
  return config;
}, error => {
  activeRequests = Math.max(activeRequests - 1, 0);
  if (activeRequests === 0) {
    toggleSubmitButtons(false);
  }
  return Promise.reject(error);
});

axios.interceptors.response.use(response => {
  activeRequests = Math.max(activeRequests - 1, 0);
  if (activeRequests === 0) {
    toggleSubmitButtons(false);
  }
  return response;
}, error => {
  activeRequests = Math.max(activeRequests - 1, 0);
  if (activeRequests === 0) {
    toggleSubmitButtons(false);
  }
  return Promise.reject(error);
});

