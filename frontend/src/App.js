import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation, useParams } from "react-router-dom";
import axios from "axios";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth context 
import { createContext, useContext } from "react";
const AuthContext = createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      // Fetch user data
      const fetchUser = async () => {
        try {
          const response = await axios.get(`${API}/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(response.data);
          setLoading(false);
        } catch (error) {
          console.error("Failed to fetch user:", error);
          logout();
          setLoading(false);
        }
      };
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (newToken) => {
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  return useContext(AuthContext);
}

// API helper with auth headers
const apiClient = (token) => {
  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (token) {
    defaultOptions.headers.Authorization = `Bearer ${token}`;
  }

  return {
    get: (url, options = {}) => 
      axios.get(url, { ...defaultOptions, ...options }),
    post: (url, data, options = {}) => 
      axios.post(url, data, { ...defaultOptions, ...options }),
    put: (url, data, options = {}) => 
      axios.put(url, data, { ...defaultOptions, ...options }),
    delete: (url, options = {}) => 
      axios.delete(url, { ...defaultOptions, ...options }),
  };
};

// Components
function NavBar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  return (
    <nav className="bg-blue-900 text-white py-4 px-6 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">Mandoob+</Link>
        
        {user && (
          <div className="hidden md:flex space-x-6">
            <Link 
              to="/dashboard" 
              className={`hover:text-blue-200 ${location.pathname === '/dashboard' ? 'text-green-300' : ''}`}
            >
              Dashboard
            </Link>
            <Link 
              to="/notifications" 
              className={`hover:text-blue-200 ${location.pathname === '/notifications' ? 'text-green-300' : ''}`}
            >
              Notifications
            </Link>
            <Link 
              to="/orders" 
              className={`hover:text-blue-200 ${location.pathname === '/orders' ? 'text-green-300' : ''}`}
            >
              Orders
            </Link>
            <Link 
              to="/combinations" 
              className={`hover:text-blue-200 ${location.pathname === '/combinations' ? 'text-green-300' : ''}`}
            >
              Smart Combinations
            </Link>
          </div>
        )}
        
        <div>
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="hidden md:inline">{user.username}</span>
              <button 
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded-md transition duration-200"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="space-x-2">
              <Link 
                to="/login" 
                className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md transition duration-200"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition duration-200"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function MobileMenu() {
  const { user } = useAuth();
  const location = useLocation();
  
  if (!user) return null;
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-blue-900 text-white py-2 shadow-top">
      <div className="flex justify-around">
        <Link 
          to="/dashboard" 
          className={`flex flex-col items-center p-2 ${location.pathname === '/dashboard' ? 'text-green-300' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs">Dashboard</span>
        </Link>
        
        <Link 
          to="/notifications" 
          className={`flex flex-col items-center p-2 ${location.pathname === '/notifications' ? 'text-green-300' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="text-xs">Notifications</span>
        </Link>
        
        <Link 
          to="/orders" 
          className={`flex flex-col items-center p-2 ${location.pathname === '/orders' ? 'text-green-300' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <span className="text-xs">Orders</span>
        </Link>
        
        <Link 
          to="/combinations" 
          className={`flex flex-col items-center p-2 ${location.pathname === '/combinations' ? 'text-green-300' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-xs">Combinations</span>
        </Link>
      </div>
    </div>
  );
}

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 text-white">
      <div className="container mx-auto px-4 py-20 flex flex-col items-center">
        <h1 className="text-4xl md:text-6xl font-bold text-center mb-6">
          Mandoob<span className="text-green-400">+</span>
        </h1>
        <p className="text-xl md:text-2xl text-center max-w-2xl mb-12">
          The smart delivery assistant that helps drivers work smarter, not harder. Combine orders from multiple apps to maximize your earnings.
        </p>
        
        <div className="grid md:grid-cols-3 gap-8 mb-16 max-w-5xl w-full">
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl shadow-lg">
            <div className="text-green-400 text-4xl mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Smart Notifications</h3>
            <p>Automatically collects notifications from your delivery apps and organizes them in one place.</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl shadow-lg">
            <div className="text-green-400 text-4xl mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Route Optimization</h3>
            <p>Suggests efficient combinations of orders that are in the same direction, saving you time and fuel.</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl shadow-lg">
            <div className="text-green-400 text-4xl mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Increase Earnings</h3>
            <p>Complete more deliveries in less time by efficiently combining orders from different apps.</p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
          <Link 
            to="/register" 
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold transition duration-200 shadow-lg"
          >
            Get Started
          </Link>
          <Link 
            to="/login" 
            className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-3 rounded-lg text-lg font-semibold transition duration-200 shadow-lg"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);
      
      const response = await axios.post(`${API}/token`, formData);
      login(response.data.access_token);
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Don't have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/register"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Register now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    full_name: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    setLoading(true);
    
    try {
      const { confirmPassword, ...userData } = formData;
      
      await axios.post(`${API}/users`, userData);
      navigate("/login", { state: { registrationSuccess: true } });
    } catch (error) {
      console.error("Registration error:", error);
      if (error.response && error.response.data) {
        setError(error.response.data.detail || "Registration failed");
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create an account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                Full name
              </label>
              <div className="mt-1">
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign in instead
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { token } = useAuth();
  const [deliveryApps, setDeliveryApps] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [combinations, setCombinations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const api = apiClient(token);
        
        // Fetch delivery apps
        const appsResponse = await api.get(`${API}/delivery-apps`);
        setDeliveryApps(appsResponse.data);
        
        // Fetch pending orders
        const ordersResponse = await api.get(`${API}/orders?status=pending`);
        setPendingOrders(ordersResponse.data);
        
        // Fetch combinations
        const combinationsResponse = await api.get(`${API}/combinations`);
        setCombinations(combinationsResponse.data);
        
        setLoading(false);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [token]);
  
  return (
    <div className="container mx-auto px-4 py-8 mb-16">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Apps Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Your Delivery Apps</h2>
            
            <div className="flex flex-wrap gap-4">
              {deliveryApps.map(app => (
                <div key={app.id} className="flex items-center space-x-2 bg-gray-100 rounded-full px-4 py-2">
                  <img 
                    src={app.logo_url} 
                    alt={app.name} 
                    className="w-6 h-6 rounded-full"
                  />
                  <span>{app.name}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-gray-600 text-sm">
                We're monitoring notifications from these delivery apps
              </p>
            </div>
          </div>
          
          {/* Pending Orders Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Current Orders</h2>
            
            {pendingOrders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No pending orders</p>
                <p className="text-sm text-gray-400 mt-2">
                  Orders will appear here when you receive notifications
                </p>
              </div>
            ) : (
              <div>
                <p className="text-green-700 font-medium">
                  {pendingOrders.length} pending {pendingOrders.length === 1 ? 'order' : 'orders'}
                </p>
                
                <div className="mt-3 space-y-3">
                  {pendingOrders.slice(0, 3).map(order => (
                    <div key={order.id} className="border-l-4 border-blue-500 pl-3 py-2">
                      <div className="flex items-center">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {order.app_name}
                        </span>
                        <span className="ml-2 text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm mt-1">
                        <span className="font-medium">Pickup:</span> {order.pickup_location.address}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Dropoff:</span> {order.dropoff_location.address}
                      </p>
                    </div>
                  ))}
                </div>
                
                {pendingOrders.length > 3 && (
                  <div className="mt-3 text-center">
                    <Link 
                      to="/orders" 
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View all orders
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Combinations Section */}
          <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Smart Order Combinations</h2>
              
              <Link 
                to="/combinations"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
              >
                View All
              </Link>
            </div>
            
            {combinations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No order combinations available</p>
                {pendingOrders.length >= 2 ? (
                  <Link 
                    to="/combinations"
                    className="mt-3 inline-block bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                  >
                    Generate Combinations
                  </Link>
                ) : (
                  <p className="text-sm text-gray-400 mt-2">
                    You need at least 2 pending orders to generate combinations
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {combinations.slice(0, 2).map(combo => (
                  <div key={combo.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-medium">
                          {combo.order_ids.length} Orders Combination
                        </h3>
                        <p className="text-sm text-gray-500">
                          Total distance: {combo.total_distance} km
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-600 font-bold">
                          Save {combo.savings_percentage}%
                        </p>
                        <p className="text-sm text-gray-500">
                          ~{combo.estimated_time} min
                        </p>
                      </div>
                    </div>
                    
                    {combo.is_accepted ? (
                      <div className="mt-3 text-center">
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          Accepted
                        </span>
                      </div>
                    ) : (
                      <div className="mt-3 text-center">
                        <Link 
                          to={`/combinations/${combo.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View details →
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Simulation Section */}
          <div className="md:col-span-2 bg-blue-50 rounded-lg shadow-md p-6 border border-blue-200">
            <h2 className="text-xl font-semibold mb-4">Simulate Notifications</h2>
            <p className="text-gray-600 mb-4">
              For demo purposes, you can simulate receiving notifications from delivery apps
            </p>
            
            <div className="grid md:grid-cols-3 gap-4">
              <Link 
                to="/notifications/simulate"
                className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-4 text-center transition duration-200"
              >
                <img 
                  src="https://play-lh.googleusercontent.com/HN9-_FL6v4AwKslcCKD9BB0rsmbK_BLJdzjFTKPaHRQr7-xM3xkJl2E0M4TjRH1__Ps" 
                  alt="Talabat" 
                  className="w-12 h-12 mx-auto rounded"
                />
                <p className="font-medium mt-2">Talabat</p>
                <p className="text-sm text-gray-500">Simulate order</p>
              </Link>
              
              <Link 
                to="/notifications/simulate"
                className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-4 text-center transition duration-200"
              >
                <img 
                  src="https://play-lh.googleusercontent.com/uf19YZxHI1RdHhvDGbwPrMupvYF2BxLVvheEPolXsHFRjGfnZJQJg-9qoCLMJVE54Q" 
                  alt="Careem" 
                  className="w-12 h-12 mx-auto rounded"
                />
                <p className="font-medium mt-2">Careem</p>
                <p className="text-sm text-gray-500">Simulate ride</p>
              </Link>
              
              <Link 
                to="/notifications/simulate"
                className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-4 text-center transition duration-200"
              >
                <img 
                  src="https://play-lh.googleusercontent.com/Q6oi2-y7Mega_8VYu-UvdE9PBgHfBZTb-KnFPXHxjDgWbkgnJqMzwlMxhW9or6P12KDU" 
                  alt="InDrive" 
                  className="w-12 h-12 mx-auto rounded"
                />
                <p className="font-medium mt-2">InDrive</p>
                <p className="text-sm text-gray-500">Simulate delivery</p>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }
  
  return user ? children : null;
}

function NotificationsPage() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const api = apiClient(token);
        const response = await api.get(`${API}/notifications`);
        setNotifications(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, [token]);
  
  return (
    <div className="container mx-auto px-4 py-8 mb-16">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      ) : (
        <div>
          {notifications.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-16 w-16 mx-auto text-gray-400"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1} 
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No notifications yet</h3>
              <p className="mt-1 text-gray-500">
                When you receive notifications from delivery apps, they will appear here
              </p>
              <div className="mt-6">
                <Link 
                  to="/notifications/simulate"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Simulate Notifications
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {notifications.map(notification => (
                  <li 
                    key={notification.id} 
                    className={`p-4 hover:bg-gray-50 ${notification.is_read ? 'opacity-70' : ''}`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-1">
                        <div className={`h-3 w-3 rounded-full ${notification.is_read ? 'bg-gray-300' : 'bg-blue-500'}`}></div>
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.app_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(notification.received_at).toLocaleString()}
                          </p>
                        </div>
                        <p className="text-sm font-semibold mt-1">{notification.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{notification.content}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-8">
        <Link 
          to="/notifications/simulate"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Simulate New Notification
        </Link>
      </div>
    </div>
  );
}

function NotificationSimulatePage() {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    app_name: "Talabat",
    title: "New Order",
    content: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const navigate = useNavigate();
  
  // Preset templates for each app
  const templates = {
    Talabat: {
      title: "New Order from Talabat",
      content: "You have a new order from McDonald's, Nasr City. Pickup from restaurant McDonald's, Nasr City. Deliver to 12 Abbas El Akkad St, Nasr City. Order amount: 125 EGP. Customer name: Ahmed Hassan."
    },
    Careem: {
      title: "New Ride Request",
      content: "You have a new ride request. Pickup from Cairo Festival City Mall. Dropoff at Cairo International Airport. Fare: 180 EGP. Client: Mohamed Ali."
    },
    InDrive: {
      title: "New InDrive Delivery",
      content: "New delivery request: 75 EGP. Pickup from Maadi Grand Mall. Dropoff at 15 Road 9, Maadi. Client requested fast delivery."
    },
    "Uber Eats": {
      title: "New Uber Eats Order",
      content: "New food delivery: Pickup from KFC, Heliopolis. Deliver to 18 Cleopatra St, Heliopolis. Order total: 210 EGP. Customer name: Sara Ahmed."
    },
    Instashop: {
      title: "New Instashop Order",
      content: "New grocery order: Pickup from Carrefour, Downtown. Deliver to 24 Talaat Harb St, Downtown. Total amount: 350 EGP. Customer: Omar Ibrahim."
    }
  };
  
  const handleAppChange = (e) => {
    const app = e.target.value;
    setFormData({
      app_name: app,
      title: templates[app].title,
      content: templates[app].content
    });
  };
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const api = apiClient(token);
      await api.post(`${API}/notifications/simulate`, formData);
      setSuccess(true);
      
      // Reset after 2 seconds
      setTimeout(() => {
        setSuccess(false);
        navigate("/notifications");
      }, 2000);
    } catch (error) {
      console.error("Failed to simulate notification:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateRandomOrder = () => {
    const apps = Object.keys(templates);
    const randomApp = apps[Math.floor(Math.random() * apps.length)];
    
    // Cairo neighborhoods
    const neighborhoods = [
      "Maadi", "Zamalek", "Nasr City", "Heliopolis", "Downtown", 
      "6th of October", "New Cairo", "Garden City", "Mohandessin", "Dokki"
    ];
    
    // Popular places
    const places = [
      "Cairo Festival City Mall", "Mall of Arabia", "City Stars", "Cairo International Airport",
      "KFC", "McDonald's", "Starbucks", "Carrefour", "Mall of Egypt", "Grand Mall"
    ];
    
    const randomPickupPlace = places[Math.floor(Math.random() * places.length)];
    const randomNeighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)];
    const randomStreetNumber = Math.floor(Math.random() * 200) + 1;
    const randomStreet = `Street ${randomStreetNumber}`;
    const randomAmount = Math.floor(Math.random() * 300) + 50;
    
    // Egyptian names
    const names = [
      "Ahmed Mohamed", "Sara Hassan", "Omar Ibrahim", "Mariam Khaled",
      "Mohamed Ali", "Nour Mahmoud", "Amr Yousef", "Laila Hossam"
    ];
    const randomName = names[Math.floor(Math.random() * names.length)];
    
    // Generate content based on app
    let content = "";
    switch (randomApp) {
      case "Talabat":
        content = `You have a new order from ${randomPickupPlace}. Pickup from restaurant ${randomPickupPlace}, ${randomNeighborhood}. Deliver to ${randomStreetNumber} ${randomStreet}, ${randomNeighborhood}. Order amount: ${randomAmount} EGP. Customer name: ${randomName}.`;
        break;
      case "Careem":
        content = `You have a new ride request. Pickup from ${randomPickupPlace}. Dropoff at ${randomStreetNumber} ${randomStreet}, ${randomNeighborhood}. Fare: ${randomAmount} EGP. Client: ${randomName}.`;
        break;
      case "InDrive":
        content = `New delivery request: ${randomAmount} EGP. Pickup from ${randomPickupPlace}, ${randomNeighborhood}. Dropoff at ${randomStreetNumber} ${randomStreet}, ${randomNeighborhood}. Client requested fast delivery.`;
        break;
      case "Uber Eats":
        content = `New food delivery: Pickup from ${randomPickupPlace}, ${randomNeighborhood}. Deliver to ${randomStreetNumber} ${randomStreet}, ${randomNeighborhood}. Order total: ${randomAmount} EGP. Customer name: ${randomName}.`;
        break;
      case "Instashop":
        content = `New grocery order: Pickup from ${randomPickupPlace}, ${randomNeighborhood}. Deliver to ${randomStreetNumber} ${randomStreet}, ${randomNeighborhood}. Total amount: ${randomAmount} EGP. Customer: ${randomName}.`;
        break;
      default:
        content = templates[randomApp].content;
    }
    
    setFormData({
      app_name: randomApp,
      title: `New Order from ${randomApp}`,
      content
    });
  };
  
  return (
    <div className="container mx-auto px-4 py-8 mb-16">
      <h1 className="text-2xl font-bold mb-6">Simulate Notification</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="text-blue-800 font-medium mb-1">Demo Feature</h3>
          <p className="text-sm text-blue-700">
            This feature simulates receiving notifications from delivery apps. 
            In a real mobile app, we would automatically capture these notifications.
          </p>
        </div>
        
        {success ? (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Notification simulated successfully! Redirecting...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="app_name" className="block text-sm font-medium text-gray-700 mb-1">
                Delivery App
              </label>
              <select
                id="app_name"
                name="app_name"
                value={formData.app_name}
                onChange={handleAppChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Talabat">Talabat</option>
                <option value="Careem">Careem</option>
                <option value="InDrive">InDrive</option>
                <option value="Uber Eats">Uber Eats</option>
                <option value="Instashop">Instashop</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Notification Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Notification Content
              </label>
              <textarea
                id="content"
                name="content"
                rows="5"
                value={formData.content}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter notification content with pickup and delivery addresses..."
              ></textarea>
              <p className="mt-1 text-xs text-gray-500">
                Make sure to include phrases like "Pickup from" and "Deliver to" or "Dropoff at"
                so the app can extract order information.
              </p>
            </div>

            <div className="mb-6">
              <button
                type="button"
                onClick={() => setAdvanced(!advanced)}
                className="text-blue-600 text-sm hover:text-blue-800 flex items-center"
              >
                <span>{advanced ? 'Hide' : 'Show'} Advanced Options</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-4 w-4 ml-1 transition-transform ${advanced ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {advanced && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Advanced Options</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        For our enhanced notification parser to work best, try to include:
                      </p>
                      <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                        <li>Pickup location with a phrase like "pickup from" or "restaurant"</li>
                        <li>Dropoff location with phrases like "deliver to" or "dropoff at"</li>
                        <li>Payment amount with currency (EGP)</li>
                        <li>Customer name if available</li>
                      </ul>
                    </div>
                    
                    <div>
                      <button
                        type="button"
                        onClick={generateRandomOrder}
                        className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-sm"
                      >
                        Generate Random Order
                      </button>
                      <p className="text-xs text-gray-500 mt-1">
                        Creates a randomized order notification with valid Cairo locations
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="mr-3 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Simulating...' : 'Simulate Notification'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const api = apiClient(token);
        const endpoint = statusFilter === "all" 
          ? `${API}/orders` 
          : `${API}/orders?status=${statusFilter}`;
          
        const response = await api.get(endpoint);
        setOrders(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [token, statusFilter]);
  
  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "accepted": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-purple-100 text-purple-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const api = apiClient(token);
      await api.put(`${API}/orders/${orderId}/status`, { status: newStatus });
      
      // Update order in state
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus, updated_at: new Date().toISOString() } 
          : order
      ));
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  };
  
  const openInMaps = (pickup, dropoff) => {
    const origin = `${pickup.latitude},${pickup.longitude}`;
    const destination = `${dropoff.latitude},${dropoff.longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    window.open(url, '_blank');
  };
  
  const formatCurrency = (amount) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
  };
  
  return (
    <div className="container mx-auto px-4 py-8 mb-16">
      <h1 className="text-2xl font-bold mb-6">Orders</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h2 className="text-xl font-semibold mb-3 md:mb-0">Order List</h2>
          
          <div className="flex">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          </div>
        ) : (
          <>
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {statusFilter === "all" 
                    ? "No orders found" 
                    : `No ${statusFilter} orders found`}
                </p>
                <Link 
                  to="/notifications/simulate"
                  className="mt-4 inline-block text-blue-600 hover:text-blue-800"
                >
                  Simulate order notifications
                </Link>
              </div>
            ) : (
              <div>
                {orders.map(order => (
                  <div 
                    key={order.id} 
                    className="border-b border-gray-200 last:border-b-0 py-6"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                      <div className="flex-grow">
                        <div className="flex items-center mb-2">
                          <span className={`${getStatusColor(order.status)} text-xs px-2 py-1 rounded-full mr-2`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleString()}
                          </span>
                          <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                            {order.app_name}
                          </span>
                          
                          {order.payment_amount && (
                            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                              {formatCurrency(order.payment_amount)}
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mt-3">
                          <div className="bg-blue-50 rounded-lg p-3">
                            <h4 className="text-sm font-semibold text-blue-800 mb-1">Pickup Location</h4>
                            <p className="text-sm">{order.pickup_location.address}</p>
                            <div className="text-xs text-gray-500 mt-1">
                              {order.pickup_location.latitude.toFixed(4)}, {order.pickup_location.longitude.toFixed(4)}
                            </div>
                          </div>
                          
                          <div className="bg-green-50 rounded-lg p-3">
                            <h4 className="text-sm font-semibold text-green-800 mb-1">Dropoff Location</h4>
                            <p className="text-sm">{order.dropoff_location.address}</p>
                            <div className="text-xs text-gray-500 mt-1">
                              {order.dropoff_location.latitude.toFixed(4)}, {order.dropoff_location.longitude.toFixed(4)}
                            </div>
                          </div>
                        </div>
                        
                        {order.customer_name && (
                          <div className="mt-2 text-sm">
                            <span className="font-medium">Customer:</span> {order.customer_name}
                          </div>
                        )}
                        
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Order ID:</span> {order.order_reference}
                        </div>
                      </div>
                      
                      <div className="mt-4 md:mt-0 md:ml-4 flex flex-wrap md:flex-col space-y-0 space-x-2 md:space-y-2 md:space-x-0">
                        <button
                          onClick={() => openInMaps(order.pickup_location, order.dropoff_location)}
                          className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-sm"
                        >
                          Open in Maps
                        </button>
                        
                        {order.status === "pending" && (
                          <button
                            onClick={() => updateOrderStatus(order.id, "accepted")}
                            className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-sm"
                          >
                            Accept
                          </button>
                        )}
                        
                        {order.status === "accepted" && (
                          <button
                            onClick={() => updateOrderStatus(order.id, "in_progress")}
                            className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded text-sm"
                          >
                            Start Delivery
                          </button>
                        )}
                        
                        {order.status === "in_progress" && (
                          <button
                            onClick={() => updateOrderStatus(order.id, "completed")}
                            className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-sm"
                          >
                            Complete
                          </button>
                        )}
                        
                        {["pending", "accepted"].includes(order.status) && (
                          <button
                            onClick={() => updateOrderStatus(order.id, "cancelled")}
                            className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-sm"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CombinationsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [combinations, setCombinations] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const api = apiClient(token);
        
        // Fetch combinations
        const combinationsResponse = await api.get(`${API}/combinations`);
        setCombinations(combinationsResponse.data);
        
        // Fetch pending orders
        const ordersResponse = await api.get(`${API}/orders?status=pending`);
        setPendingOrders(ordersResponse.data);
        
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch combinations:", error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [token]);
  
  const generateCombinations = async () => {
    if (pendingOrders.length < 2) {
      alert("You need at least 2 pending orders to generate combinations");
      return;
    }
    
    setGenerating(true);
    
    try {
      const api = apiClient(token);
      const response = await api.post(`${API}/combinations/generate`);
      
      // Add new combinations to the state
      setCombinations([...response.data, ...combinations]);
    } catch (error) {
      console.error("Failed to generate combinations:", error);
    } finally {
      setGenerating(false);
    }
  };
  
  const acceptCombination = async (combinationId) => {
    try {
      const api = apiClient(token);
      const response = await api.put(`${API}/combinations/${combinationId}/accept`);
      
      // Update combination in state
      setCombinations(combinations.map(combo => 
        combo.id === combinationId ? response.data : combo
      ));
      
      // Refresh pending orders since some may have been accepted
      const ordersResponse = await api.get(`${API}/orders?status=pending`);
      setPendingOrders(ordersResponse.data);
    } catch (error) {
      console.error("Failed to accept combination:", error);
    }
  };
  
  const viewOrderDetails = (combinationId) => {
    navigate(`/combinations/${combinationId}`);
  };
  
  return (
    <div className="container mx-auto px-4 py-8 mb-16">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Smart Order Combinations</h1>
        
        <button
          onClick={generateCombinations}
          disabled={generating || pendingOrders.length < 2}
          className={`px-4 py-2 rounded shadow-sm text-white ${
            pendingOrders.length < 2
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {generating ? 'Generating...' : 'Generate Combinations'}
        </button>
      </div>
      
      {pendingOrders.length < 2 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You need at least 2 pending orders to generate smart combinations. 
                <Link 
                  to="/notifications/simulate"
                  className="font-medium underline text-yellow-700 hover:text-yellow-600"
                >
                  {' '}Simulate some orders
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          {combinations.length === 0 ? (
            <div className="text-center py-12">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-16 w-16 mx-auto text-gray-400"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No combinations available</h3>
              <p className="mt-1 text-gray-500">
                Generate smart combinations to optimize your deliveries
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {combinations.map(combo => (
                <div 
                  key={combo.id} 
                  className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50"
                >
                  <div className="flex flex-col md:flex-row md:justify-between">
                    <div className="mb-4 md:mb-0">
                      <h3 className="text-lg font-semibold mb-2">
                        {combo.order_ids.length} Orders Combination
                      </h3>
                      <div className="flex items-center space-x-4 mb-2">
                        <p className="text-gray-600">
                          <span className="font-medium">Distance:</span> {combo.total_distance} km
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Time:</span> ~{combo.estimated_time} min
                        </p>
                      </div>
                      <p className="text-green-600 font-bold">
                        Saves {combo.savings_percentage}% compared to separate deliveries
                      </p>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      {combo.is_accepted ? (
                        <div className="flex items-center bg-green-100 text-green-800 px-4 py-2 rounded">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Accepted
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => acceptCombination(combo.id)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition duration-200"
                          >
                            Accept Combination
                          </button>
                          <button
                            onClick={() => viewOrderDetails(combo.id)}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition duration-200"
                          >
                            View Details
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Included Orders:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* In a real implementation, you would fetch the actual order details here */}
                      {combo.order_ids.map((orderId, index) => (
                        <div key={orderId} className="text-sm bg-gray-100 p-2 rounded">
                          Order #{index + 1}: {orderId.substring(0, 8)}...
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App min-h-screen bg-gray-100">
          <NavBar />
          
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/notifications" 
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/notifications/simulate" 
              element={
                <ProtectedRoute>
                  <NotificationSimulatePage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/orders" 
              element={
                <ProtectedRoute>
                  <OrdersPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/history" 
              element={
                <ProtectedRoute>
                  <OrderHistoryPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/combinations" 
              element={
                <ProtectedRoute>
                  <CombinationsPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/combinations/:combinationId" 
              element={
                <ProtectedRoute>
                  <CombinationDetailPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/analytics" 
              element={
                <ProtectedRoute>
                  <AnalyticsPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
          
          <MobileMenu />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

function CombinationDetailPage() {
  const { token } = useAuth();
  const { combinationId } = useParams();
  const navigate = useNavigate();
  const [combination, setCombination] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapUrl, setMapUrl] = useState("");
  
  useEffect(() => {
    const fetchCombinationDetails = async () => {
      try {
        const api = apiClient(token);
        
        // Fetch the combination
        const combinationsResponse = await api.get(`${API}/combinations`);
        const foundCombination = combinationsResponse.data.find(c => c.id === combinationId);
        
        if (!foundCombination) {
          navigate("/combinations");
          return;
        }
        
        setCombination(foundCombination);
        
        // Fetch all orders
        const ordersResponse = await api.get(`${API}/orders`);
        const allOrders = ordersResponse.data;
        
        // Filter orders that are part of this combination
        const combinationOrders = allOrders.filter(order => 
          foundCombination.order_ids.includes(order.id)
        );
        
        setOrders(combinationOrders);
        
        // Generate a map URL for the entire route
        generateMapUrl(combinationOrders);
        
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch combination details:", error);
        setLoading(false);
        navigate("/combinations");
      }
    };
    
    fetchCombinationDetails();
  }, [token, combinationId, navigate]);
  
  const generateMapUrl = (orderData) => {
    if (!orderData || orderData.length === 0) return;
    
    // Create a Google Maps directions URL with multiple waypoints
    let url = "https://www.google.com/maps/dir/?api=1";
    
    // Add origin (first pickup location)
    const firstOrder = orderData[0];
    url += `&origin=${firstOrder.pickup_location.latitude},${firstOrder.pickup_location.longitude}`;
    
    // Add destination (last dropoff location)
    const lastOrder = orderData[orderData.length - 1];
    url += `&destination=${lastOrder.dropoff_location.latitude},${lastOrder.dropoff_location.longitude}`;
    
    // Add waypoints (all other pickup and dropoff locations)
    const waypoints = [];
    
    // Skip first pickup (origin) and last dropoff (destination)
    for (let i = 1; i < orderData.length; i++) {
      waypoints.push(`${orderData[i].pickup_location.latitude},${orderData[i].pickup_location.longitude}`);
    }
    
    for (let i = 0; i < orderData.length - 1; i++) {
      waypoints.push(`${orderData[i].dropoff_location.latitude},${orderData[i].dropoff_location.longitude}`);
    }
    
    if (waypoints.length > 0) {
      url += `&waypoints=${waypoints.join('|')}`;
    }
    
    setMapUrl(url);
  };
  
  const handleAccept = async () => {
    try {
      const api = apiClient(token);
      await api.put(`${API}/combinations/${combinationId}/accept`);
      navigate("/orders", { state: { acceptedCombination: true } });
    } catch (error) {
      console.error("Failed to accept combination:", error);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 mb-16">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      </div>
    );
  }
  
  if (!combination) {
    return (
      <div className="container mx-auto px-4 py-8 mb-16">
        <div className="text-center py-8">
          <p className="text-gray-500">Combination not found</p>
          <Link 
            to="/combinations"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800"
          >
            Back to combinations
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 mb-16">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mr-3 text-gray-600 hover:text-gray-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold">Combination Details</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">
              {orders.length} Orders Combination
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="font-medium">{combination.savings_percentage}%</span> savings
              </span>
              
              <span className="flex items-center text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{combination.estimated_time}</span> minutes
              </span>
              
              <span className="flex items-center text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span className="font-medium">{combination.total_distance}</span> km total
              </span>
            </div>
          </div>
          
          {!combination.is_accepted && (
            <button
              onClick={handleAccept}
              className="mt-4 md:mt-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition duration-200"
            >
              Accept Combination
            </button>
          )}
        </div>
        
        {/* Map Preview - Simple placeholder as we don't have an actual API key */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-700 mb-2">Route Preview</h3>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            {orders.length > 0 ? (
              <div className="text-center p-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-blue-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <p className="text-gray-600">
                  Route map from {orders[0]?.pickup_location.address} to {orders[orders.length-1]?.dropoff_location.address}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Total distance: {combination.total_distance} km
                </p>
              </div>
            ) : (
              <p className="text-gray-500">No route data available</p>
            )}
          </div>
          
          <div className="mt-3 text-center">
            <a 
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Open in Google Maps
            </a>
          </div>
        </div>
        
        {/* Order Route */}
        <div>
          <h3 className="text-md font-medium text-gray-700 mb-3">Delivery Route</h3>
          <div className="space-y-1">
            {orders.map((order, index) => (
              <React.Fragment key={order.id}>
                {/* Pickup */}
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-1 mr-3">
                    <div className="h-8 w-8 bg-blue-500 text-white rounded-full flex items-center justify-center">
                      {index + 1}P
                    </div>
                  </div>
                  <div className="flex-grow p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">
                        {order.app_name}
                      </span>
                      <span className="text-sm text-gray-600">
                        Order #{order.order_reference}
                      </span>
                    </div>
                    <p className="font-medium mt-1">Pickup: {order.pickup_location.address}</p>
                    {order.payment_amount && (
                      <p className="text-sm text-green-600 mt-1">
                        Amount: {new Intl.NumberFormat('ar-EG', {
                          style: 'currency',
                          currency: 'EGP'
                        }).format(order.payment_amount)}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Connecting line */}
                <div className="flex justify-center">
                  <div className="h-6 border-l-2 border-dashed border-gray-300"></div>
                </div>
                
                {/* Dropoff */}
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-1 mr-3">
                    <div className="h-8 w-8 bg-green-500 text-white rounded-full flex items-center justify-center">
                      {index + 1}D
                    </div>
                  </div>
                  <div className="flex-grow p-3 bg-green-50 rounded-lg">
                    <p className="font-medium">Dropoff: {order.dropoff_location.address}</p>
                    {order.customer_name && (
                      <p className="text-sm text-gray-600 mt-1">
                        Customer: {order.customer_name}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Separator between orders */}
                {index < orders.length - 1 && (
                  <div className="flex justify-center">
                    <div className="h-8 border-l-2 border-dotted border-gray-300"></div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        
        {!combination.is_accepted && (
          <button
            onClick={handleAccept}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition duration-200"
          >
            Accept Combination
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
