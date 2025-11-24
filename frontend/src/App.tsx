import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import Preloader from './components/Preloader';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import LessonView from './pages/LessonView';
import QuizView from './pages/QuizView';
import Progress from './pages/Progress';
import AdminPanel from './pages/AdminPanel';
import UserManagement from './pages/UserManagement';
import Profile from './pages/Profile';
import AIAssistant from './pages/AIAssistant';
import AITools from './pages/AITools';
import Achievements from './pages/Achievements';
// import Certificates from './pages/Certificates'; // Временно отключено
import { authService } from './services/auth';

function App() {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Проверяем аутентификацию при первой загрузке
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          // Если есть токен, пытаемся получить пользователя
          await authService.getCurrentUser();
        }
      } catch (error) {
        // Если ошибка, очищаем токен
        authService.logout();
      } finally {
        // Добавляем небольшую задержку для плавности анимации
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    };

    checkAuth();
  }, []);

  return (
    <>
      <Preloader isLoading={isLoading} />
      {!isLoading && (
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />
          
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
            <Route path="courses" element={<Courses />} />
            <Route path="courses/:id" element={<CourseDetail />} />
            <Route path="lessons/:id" element={<LessonView />} />
            <Route path="quizzes/:id" element={<QuizView />} />
            <Route path="progress" element={<Progress />} />
            <Route path="achievements" element={<Achievements />} />
            {/* <Route path="certificates" element={<Certificates />} /> */} {/* Временно отключено */}
            <Route path="profile" element={<Profile />} />
            <Route path="ai-assistant" element={<AIAssistant />} />
            <Route path="ai-tools" element={<AITools />} />
            <Route
              path="admin"
              element={
                <ProtectedRoute requiredRole="teacher">
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/users"
              element={
                <ProtectedRoute requiredRole="admin">
                  <UserManagement />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      )}
    </>
  );
}

export default App;

