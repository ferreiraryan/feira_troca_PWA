import React, { useState, useEffect } from 'react';
import { signOut, type User as FirebaseUser } from 'firebase/auth';
import { getDatabase, ref, onValue, update } from 'firebase/database';
// Para salvar transações, você precisará do 'push'
// import { getDatabase, ref, onValue, update, push } from 'firebase/database';
import { auth } from '../firebase/config';
import { Ticket, User, LogOut, Plus, Minus, RefreshCw } from 'lucide-react';
import '../App.css';

// --- Interfaces TypeScript ---
interface AlunoData {
  nome: string;
  turma: string;
  unidade: string;
  saldo: number;
}

interface Transacao {
  id: string;
  tipo: 'ganho' | 'gasto';
  quantidade: number;
  descricao: string;
  data: number;
}

interface TicketsPageProps {
  user: FirebaseUser;
}

const TicketsPage: React.FC<TicketsPageProps> = ({ user }) => {
  const [alunoData, setAlunoData] = useState<AlunoData | null>(null);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const db = getDatabase();

  useEffect(() => {
    if (user?.uid) {
      const alunoRef = ref(db, `alunos/${user.uid}`);
      const unsubscribeAluno = onValue(alunoRef, (snapshot) => {
        if (snapshot.exists()) {
          setAlunoData(snapshot.val() as AlunoData);
        } else {
          console.error("Dados do aluno não encontrados no Realtime Database.");
          setAlunoData(null);
        }
        setIsLoading(false);
      });

      // --- COMENTÁRIO PARA VOCÊ ---
      // AQUI: Você deve buscar o histórico de transações do aluno do Firebase.
      // Crie uma referência para um nó como `transacoes/${user.uid}`.
      // Use `onValue` para ouvir as atualizações em tempo real e popular o estado `transacoes`.
      // Exemplo:
      /*
      const transacoesRef = ref(db, `transacoes/${user.uid}`);
      const unsubscribeTransacoes = onValue(transacoesRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          // Converte o objeto retornado pelo Firebase em um array
          const transacoesArray = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));
          // Ordena da mais recente para a mais antiga
          setTransacoes(transacoesArray.sort((a, b) => b.data - a.data));
        } else {
          setTransacoes([]); // Limpa o histórico se não houver nada
        }
      });
      */

      // Lembre-se de retornar a função de limpeza para as transações também
      // return () => { unsubscribeAluno(); unsubscribeTransacoes(); };
      return () => unsubscribeAluno();
    }
  }, [user, db]);

  const handleLogout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  const gastarTicket = async (quantidade: number, descricao: string): Promise<void> => {
    if (!user || !alunoData || alunoData.saldo < quantidade) {
      alert("Saldo insuficiente!");
      return;
    }
    const novoSaldo = alunoData.saldo - quantidade;
    const alunoRef = ref(db, `alunos/${user.uid}`);
    try {
      await update(alunoRef, { saldo: novoSaldo });
      const novaTransacao = {
        // id não é mais necessário se o Firebase gerar a chave com push()
        tipo: 'gasto' as const,
        quantidade,
        descricao,
        data: Date.now()
      };

      // --- COMENTÁRIO PARA VOCÊ ---
      // AQUI: Salve a `novaTransacao` no Realtime Database.
      // Use a função `push` para gerar uma chave única para cada transação.
      // Exemplo:
      /*
      const transacoesRef = ref(db, `transacoes/${user.uid}`);
      await push(transacoesRef, novaTransacao);
      */

      // Esta linha abaixo se tornará desnecessária se você usar `onValue` no useEffect,
      // pois o listener do Firebase atualizará o estado `transacoes` automaticamente.
      setTransacoes(prev => [{ id: Date.now().toString(), ...novaTransacao }, ...prev]);

    } catch (error) {
      console.error("Erro ao atualizar saldo:", error);
      alert("Ocorreu um erro ao tentar usar os tickets.");
    }
  };

  const getMatricula = (): string => user?.uid || 'Usuário';
  const formatarData = (timestamp: number): string => new Date(timestamp).toLocaleDateString('pt-BR');
  const formatarHora = (timestamp: number): string => new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  if (isLoading) {
    return <div className="loading-screen">Carregando dados do aluno...</div>;
  }

  const saldoAtual = alunoData?.saldo ?? 0;

  return (
    <div className="tickets-page">
      <div className="tickets-container">
        <header className="tickets-header">
          <div className="user-info">
            <User size={24} />
            <div>
              <h2>Olá, {alunoData?.nome || getMatricula()}</h2>
              <p>Feira Cotemig</p>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-button">
            <LogOut size={20} />
          </button>
        </header>

        <div className="tickets-balance">
          <div className="balance-card">
            <Ticket size={40} className="balance-icon" />
            <div className="balance-info">
              <h3>Seus Tickets</h3>
              <span className="balance-amount">{saldoAtual}</span>
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <h3>Gastos Rápidos</h3>
          <div className="button-grid">
            <button
              className="action-button spend"
              onClick={() => gastarTicket(10, 'Gasto de 10 tickets')}
              disabled={saldoAtual < 10}
            >
              <Minus size={16} /> 10
            </button>
            <button
              className="action-button spend"
              onClick={() => gastarTicket(15, 'Gasto de 15 tickets')}
              disabled={saldoAtual < 15}
            >
              <Minus size={16} /> 15
            </button>
            <button
              className="action-button spend"
              onClick={() => gastarTicket(20, 'Gasto de 20 tickets')}
              disabled={saldoAtual < 20}
            >
              <Minus size={16} /> 20
            </button>
            <button
              className="action-button spend"
              onClick={() => gastarTicket(50, 'Gasto de 50 tickets')}
              disabled={saldoAtual < 50}
            >
              <Minus size={16} /> 50
            </button>
          </div>
        </div>

        <div className="transactions-section">
          <div className="section-header">
            <h3>Histórico de Transações</h3>
            <RefreshCw size={18} />
          </div>

          <div className="transactions-list">
            {transacoes.length === 0 ? (
              <div className="empty-state">
                <Ticket size={48} />
                <p>Nenhuma transação ainda</p>
              </div>
            ) : (
              transacoes.map((transacao) => (
                <div key={transacao.id} className={`transaction-item ${transacao.tipo}`}>
                  <div className="transaction-icon">
                    {transacao.tipo === 'ganho' ? <Plus size={16} /> : <Minus size={16} />}
                  </div>
                  <div className="transaction-details">
                    <h4>{transacao.descricao}</h4>
                    <p>{formatarData(transacao.data)} às {formatarHora(transacao.data)}</p>
                  </div>
                  <div className={`transaction-amount ${transacao.tipo}`}>
                    {transacao.tipo === 'ganho' ? '+' : '-'}{transacao.quantidade}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketsPage
