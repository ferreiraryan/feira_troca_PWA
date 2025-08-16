import React, { useState, useEffect } from 'react';
import { signOut, type User as FirebaseUser } from 'firebase/auth';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import { auth } from '../firebase/config'; // Supondo que a config do auth está aqui
import { Ticket, User, LogOut, Plus, Minus, RefreshCw } from 'lucide-react';


interface AlunoData {
  nome: string;
  turma: string;
  unidade: string;
  saldo: number;
}

// Define a estrutura de uma transação (para o histórico)
interface Transacao {
  id: string; // Usaremos o timestamp como ID
  tipo: 'ganho' | 'gasto';
  quantidade: number;
  descricao: string;
  data: number; // Armazenaremos como timestamp para facilitar a ordenação
}

interface TicketsPageProps {
  user: FirebaseUser;
}

const TicketsPage: React.FC<TicketsPageProps> = ({ user }) => {
  // Estado para guardar os dados do aluno vindos do Firebase
  const [alunoData, setAlunoData] = useState<AlunoData | null>(null);
  // Estado para o histórico de transações (ainda local, podemos mover para o DB depois)
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const db = getDatabase();

  // --- Efeito para buscar e ouvir os dados do aluno em tempo real ---
  useEffect(() => {
    if (user?.uid) {
      // O caminho para os dados do aluno no DB é /alunos/{RA do aluno}
      const alunoRef = ref(db, `alunos/${user.uid}`);

      // onValue "ouve" qualquer mudança nesse caminho
      const unsubscribe = onValue(alunoRef, (snapshot) => {
        if (snapshot.exists()) {
          setAlunoData(snapshot.val() as AlunoData);
        } else {
          // Caso o aluno esteja logado mas não tenha dados no DB
          console.error("Dados do aluno não encontrados no Realtime Database.");
          setAlunoData(null);
        }
        setIsLoading(false);
      });

      // Função de limpeza: para de ouvir quando o componente é desmontado
      return () => unsubscribe();
    }
  }, [user, db]);

  // --- Funções de Ação ---

  const handleLogout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  // Função para gastar tickets (atualiza o Firebase)
  const gastarTicket = async (quantidade: number, descricao: string): Promise<void> => {
    if (!user || !alunoData || alunoData.saldo < quantidade) {
      alert("Saldo insuficiente!");
      return;
    }

    const novoSaldo = alunoData.saldo - quantidade;
    const alunoRef = ref(db, `alunos/${user.uid}`);

    try {
      // Atualiza apenas o campo 'saldo' no Firebase
      await update(alunoRef, { saldo: novoSaldo });

      // Adiciona ao histórico local (idealmente, isso também iria para o DB)
      const novaTransacao: Transacao = {
        id: Date.now().toString(),
        tipo: 'gasto',
        quantidade,
        descricao,
        data: Date.now()
      };
      setTransacoes(prev => [novaTransacao, ...prev]);

    } catch (error) {
      console.error("Erro ao atualizar saldo:", error);
      alert("Ocorreu um erro ao tentar usar os tickets.");
    }
  };

  // Funções utilitárias para formatação
  const getMatricula = (): string => user?.uid || 'Usuário';
  const formatarData = (timestamp: number): string => new Date(timestamp).toLocaleDateString('pt-BR');
  const formatarHora = (timestamp: number): string => new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  if (isLoading) {
    return <div className="loading-screen">Carregando dados do aluno...</div>;
  }

  // O saldo agora vem de alunoData.saldo
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
          {/* O botão de receber foi removido, pois o saldo é gerenciado pelo admin */}
          <button
            className="action-button spend"
            onClick={() => gastarTicket(1, 'Ticket usado')}
            disabled={saldoAtual <= 0}
          >
            <Minus size={20} />
            Usar 1 Ticket
          </button>
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

export default TicketsPage;

