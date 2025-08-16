/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { signInWithEmailAndPassword, getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { app } from '../firebase/config';
import { BookOpen, User, Lock, AlertCircle } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [matricula, setMatricula] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate();
  const auth = getAuth(app);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const email = `${matricula}@aluno.cotemig.com.br`;
      const userCredential = await signInWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      // --- A MÁGICA ACONTECE AQUI ---
      // Força a atualização do token para pegar a permissão de admin
      const idTokenResult = await user.getIdTokenResult(true);

      // Verifica se o usuário tem a "marca" de admin
      if (idTokenResult.claims.admin === true) {
        navigate('/admin/dashboard'); // Se for admin, vai para o painel
      } else {
        navigate('/tickets'); // Se for aluno, vai para a home/tickets
      }

    } catch (error: any) {
      console.error('Erro no login:', error);
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('Matrícula ou senha incorreta');
          break;
        case 'auth/invalid-email':
          setError('Matrícula inválida');
          break;
        case 'auth/too-many-requests':
          setError('Muitas tentativas. Tente novamente mais tarde');
          break;
        default:
          setError('Erro no login. Verifique seus dados');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <BookOpen size={60} className="login-logo" />
          <h1>Feira Cotemig</h1>
          <p>Entre com sua matrícula</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <div className="input-container">
              <User size={20} className="input-icon" />
              <input
                type="text"
                placeholder="Matrícula (ex: 12300055)"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                required
                className="form-input"
                pattern="[0-9]{8}"
                title="Digite 8 números da matrícula"
                maxLength={8}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-container">
              <Lock size={20} className="input-icon" />
              <input
                type="password"
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="form-input"
              />
            </div>
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="login-footer">
          <p>Sistema de troca da feira Cotemig</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

