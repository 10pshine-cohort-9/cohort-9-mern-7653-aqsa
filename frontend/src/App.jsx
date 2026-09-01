import { useState, useEffect } from 'react';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import NoteEditorPage from './pages/NoteEditorPage';
import NotesListPage from './pages/NoteListPage';
import FoldersPage from './pages/FoldersPage';
import TasksPage from './pages/TasksPage';
import StickyWallPage from './pages/StickyWallPage';
import NoteReaderPage from './pages/NoteReaderPage';
import api from './api/axios';
import ForgotPasswordPage from './components/Auth/ForgotPasswordPage';
import ResetPasswordPage from './components/Auth/ResetPasswordPage';
import HomePage from './pages/HomePage';

const ProtectedRoute = ({ isAuthenticated }) => {
  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  useEffect(() => {
    let isMounted = true;
    api.get('/auth/profile')
      .then(() => {
        if (isMounted) setIsAuthenticated(true);
      })
      .catch(() => {
        if (isMounted) setIsAuthenticated(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);
  if (isAuthenticated === null) {
    return <div className="loading-screen">Loading application...</div>;
  }
  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated
            ? <Navigate to="/dashboard" replace />
            : <HomePage />
        }
      />
      <Route
        path="/auth"
        element={
          !isAuthenticated
            ? <Auth setIsAuthenticated={setIsAuthenticated} />
            : <Navigate to="/dashboard" replace />
        }
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/notes" element={<NotesListPage />} />
        <Route path="/note/:id" element={<NoteReaderPage />} />
        <Route path="/note-editor/:id" element={<NoteEditorPage />} />
        <Route path="/folders" element={<FoldersPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/stickies" element={<StickyWallPage />} />
      </Route>
      <Route
        path="*"
        element={
          <Navigate
            to={isAuthenticated ? "/dashboard" : "/"}
            replace
          />
        }
      />
    </Routes>
  );
}

export default App;

