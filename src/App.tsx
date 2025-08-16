import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, getAuth, type User } from 'firebase/auth';
import * as config from './firebase/config'; // Importando a configuração centralizada

// Importe suas páginas
import SplashPage from './pages/SplashPage';
import LoginPage from './pages/LoginPage';
import TicketsPage from './pages/TicketsPage';
import AdminDashboardPage from './pages/AdminDashboardPage'; // Importando a nova página

// --- Componente de Proteção para Rotas de Admin ---
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const auth = getAuth(config.app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // Força a atualização do token para pegar os claims mais recentes
          const idTokenResult = await currentUser.getIdTokenResult(true);
          // Define se o usuário é admin ou não
          setIsAdmin(!!idTokenResult.claims.admin);
        } catch (error) {
          console.error("Erro ao verificar permissões de admin:", error);
          setIsAdmin(false);
        }
      } else {
        // Se não há usuário, ele definitivamente não é admin
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  // Enquanto verifica, mostra uma tela de carregamento
  if (loading) {
    return <SplashPage />;
  }

  // Se for admin, mostra a página. Se não, redireciona para o login.
  return isAdmin ? <>{children}</> : <Navigate to="/login" />;
};


function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const auth = getAuth(config.app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser: User | null) => {
      setUser(currentUser);
      setLoading(false);
    });

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [auth]);

  if (loading || showSplash) {
    return <SplashPage />;
  }

  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          {/* Rota de Login: se já estiver logado, vai para /tickets */}
          <Route
            path="/login"
            element={user ? <Navigate to="/tickets" /> : <LoginPage />}
          />

          {/* Rota de Tickets: se não estiver logado, vai para /login */}
          <Route
            path="/tickets"
            element={user ? <TicketsPage user={user} /> : <Navigate to="/login" />}
          />

          {/* Rota do Admin: protegida pelo componente AdminRoute */}
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />

          {/* Rota Raiz: redireciona para tickets ou login dependendo do status */}
          <Route
            path="/"
            element={user ? <Navigate to="/tickets" /> : <Navigate to="/login" />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
