import axios from 'axios';

// This securely points all our API calls to our Express server
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

export default API;
