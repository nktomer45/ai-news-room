import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TopicProvider } from './context/TopicContext';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Articles from './pages/Articles';
import ArticleDetail from './pages/ArticleDetail';
import ArticleEditor from './pages/ArticleEditor';
import Trending from './pages/Trending';
import FetchTrends from './pages/FetchTrends';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';

const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <TopicProvider>
        <Router>
          <Routes>
            {/* Public Authentication Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Application Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="articles" element={<Articles />} />
              <Route path="trending" element={<Trending />} />
              <Route path="fetch-trends" element={<FetchTrends />} />
              <Route path="settings" element={<Settings />} />
              <Route path="articles/new" element={<ArticleEditor />} />
              <Route path="articles/:id" element={<ArticleDetail />} />
              <Route path="articles/:id/edit" element={<ArticleEditor />} />
              
              {/* Catch-all for sub-routes */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>

            {/* Fallback for unauthenticated or non-existent routes */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </TopicProvider>
    </AuthProvider>
  );
}

export default App;
