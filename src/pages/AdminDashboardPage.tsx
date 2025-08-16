import React, { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import * as config from '../firebase/config';
import '../App.css'; // Importando o CSS principal

// --- URLs das Cloud Functions ---
const URL_CRIAR_ALUNO = "https://us-central1-feira-de-trocas-cotemig.cloudfunctions.net/criarAluno";
const URL_ATUALIZAR_DADOS = "https://us-central1-feira-de-trocas-cotemig.cloudfunctions.net/atualizarDados";
const URL_EXCLUIR_ALUNO = "https://us-central1-feira-de-trocas-cotemig.cloudfunctions.net/excluirAluno";

// --- Interfaces TypeScript ---
interface Aluno {
  nome: string;
  turma: string;
  unidade: string;
  saldo: number;
}
interface AlunosData { [ra: string]: Aluno; }
interface ModalInfo { visible: boolean; title: string; message: string; isSuccess: boolean; }

// --- Componentes Auxiliares ---

const FeedbackModal: React.FC<{ modalInfo: ModalInfo; onClose: () => void }> = ({ modalInfo, onClose }) => {
  if (!modalInfo.visible) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className={modalInfo.isSuccess ? 'modal-title-success' : 'modal-title-warning'}>{modalInfo.title}</h3>
        <p className="modal-message">{modalInfo.message}</p>
        <button onClick={onClose} className="modal-button">Fechar</button>
      </div>
    </div>
  );
};

const AlunoItem: React.FC<{ ra: string; aluno: Aluno; onUpdate: (ra: string, data: Partial<Aluno>) => void; onDelete: (ra: string) => void; }> = ({ ra, aluno, onUpdate, onDelete }) => {
  const [saldo, setSaldo] = useState<number>(aluno.saldo || 0);
  const [nome, setNome] = useState<string>(aluno.nome || '');

  const handleSave = () => {
    onUpdate(ra, { nome, saldo: parseFloat(saldo.toString()) });
  };

  return (
    <div className="admin-list-item">
      <div className="admin-list-item-details">
        <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="admin-list-item-name-input" />
        <p className="admin-list-item-meta">RA: {ra} | Turma: {aluno.turma || 'N/A'}</p>
      </div>
      <div className="admin-list-item-actions">
        <span>R$</span>
        <input type="number" value={saldo} onChange={(e) => setSaldo(Number(e.target.value))} className="admin-list-item-saldo-input" />
        <button onClick={handleSave} className="admin-update-button">Salvar</button>
        <button onClick={() => onDelete(ra)} className="admin-delete-button">X</button>
      </div>
    </div>
  );
};

// --- Componente Principal da Página ---

const AdminDashboardPage: React.FC = () => {
  const [alunos, setAlunos] = useState<AlunosData>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [modalInfo, setModalInfo] = useState<ModalInfo>({ visible: false, title: '', message: '', isSuccess: false });
  const [formData, setFormData] = useState({ ra: '', nome: '', turma: '', unidade: '', saldo: '', senha: '' });

  const db = getDatabase(config.app);

  useEffect(() => {
    const alunosRef = ref(db, 'alunos/');
    const unsubscribe = onValue(alunosRef, (snapshot) => {
      setAlunos(snapshot.val() || {});
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [db]);

  const showModal = (info: Omit<ModalInfo, 'visible'>) => {
    setModalInfo({ ...info, visible: true });
  };

  const handleFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    showModal({ title: 'Processando...', message: 'Aguarde...', isSuccess: false });
    try {
      const response = await fetch(URL_CRIAR_ALUNO, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, saldo: parseFloat(formData.saldo) })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Erro desconhecido');
      showModal({ title: 'Sucesso!', message: 'Aluno cadastrado e login criado.', isSuccess: true });
      setFormData({ ra: '', nome: '', turma: '', unidade: '', saldo: '', senha: '' });
    } catch (error: any) {
      showModal({ title: 'Erro!', message: error.message, isSuccess: false });
    }
  };

  const handleUpdate = async (ra: string, novoAlunoData: Partial<Aluno>) => {
    showModal({ title: 'Atualizando...', message: `Atualizando RA ${ra}.`, isSuccess: false });
    try {
      const response = await fetch(URL_ATUALIZAR_DADOS, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ra, ...novoAlunoData })
      });
      if (!response.ok) throw new Error('Falha ao atualizar');
      showModal({ title: 'Sucesso!', message: 'Dados atualizados.', isSuccess: true });
    } catch (error: any) {
      showModal({ title: 'Erro!', message: error.message, isSuccess: false });
    }
  };

  const handleDelete = async (ra: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o aluno com RA ${ra}?`)) {
      showModal({ title: 'Excluindo...', message: `Removendo RA ${ra}.`, isSuccess: false });
      try {
        const response = await fetch(URL_EXCLUIR_ALUNO, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ra })
        });
        if (!response.ok) throw new Error('Falha ao excluir');
        showModal({ title: 'Sucesso!', message: 'Aluno excluído.', isSuccess: true });
      } catch (error: any) {
        showModal({ title: 'Erro!', message: error.message, isSuccess: false });
      }
    }
  };

  return (
    <div className="admin-dashboard-page">
      <FeedbackModal modalInfo={modalInfo} onClose={() => setModalInfo(prev => ({ ...prev, visible: false }))} />
      <div className="admin-container">
        <header className="admin-header">
          <h1>Painel de Admin</h1>
          <p>Feira de Trocas Cotemig</p>
        </header>

        <main className="admin-main-grid">
          <div className="admin-form-card">
            <h2>Cadastrar Novo Aluno</h2>
            <form onSubmit={handleCreate} className="admin-form">
              <input type="text" id="ra" value={formData.ra} onChange={handleFormChange} placeholder="RA do Aluno" className="admin-input" required />
              <input type="text" id="nome" value={formData.nome} onChange={handleFormChange} placeholder="Nome Completo" className="admin-input" required />
              <input type="text" id="turma" value={formData.turma} onChange={handleFormChange} placeholder="Turma (ex: 3INA)" className="admin-input" required />
              <input type="text" id="unidade" value={formData.unidade} onChange={handleFormChange} placeholder="Unidade (ex: Barroca)" className="admin-input" required />
              <input type="number" id="saldo" value={formData.saldo} onChange={handleFormChange} placeholder="Saldo Inicial" className="admin-input" required />
              <input type="password" id="senha" value={formData.senha} onChange={handleFormChange} placeholder="Senha (mín. 6 caracteres)" className="admin-input" required minLength={6} />
              <button type="submit" className="admin-button">Cadastrar Aluno</button>
            </form>
          </div>

          <div className="admin-list-card">
            <h2>Alunos Cadastrados</h2>
            {isLoading ? (
              <div className="admin-loader-container"><div className="admin-loader"></div></div>
            ) : Object.keys(alunos).length === 0 ? (
              <p className="admin-empty-list">Nenhum aluno encontrado.</p>
            ) : (
              <div className="admin-list-container">
                {Object.entries(alunos).map(([ra, aluno]) => (
                  <AlunoItem key={ra} ra={ra} aluno={aluno} onUpdate={handleUpdate} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardPage;

