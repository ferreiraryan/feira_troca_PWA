/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { BookOpen, User, Lock, AlertCircle } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [matricula, setMatricula] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Converter matrícula para email
      const email = `${matricula}@cotemig.app`;

      await signInWithEmailAndPassword(auth, email, senha);
    } catch (error: any) {
      console.error('Erro no login:', error);

      switch (error.code) {
        case 'auth/user-not-found':
          setError('Matrícula não encontrada');
          break;
        case 'auth/wrong-password':
          setError('Senha incorreta');
          break;
        case 'auth/invalid-email':
          setError('Matrícula inválida');
          break;
        case 'auth/too-many-requests':
          setError('Muitas tentativas. Tente novamente mais tarde');
          break;
        case 'auth/invalid-credential':
          setError('Matrícula ou senha incorreta');
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
