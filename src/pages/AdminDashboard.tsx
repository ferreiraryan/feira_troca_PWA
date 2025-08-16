import React, { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import * as config from '../firebase/config'; // Importando a configuração centralizada

// --- 1. URLs DAS SUAS CLOUD FUNCTIONS ---
// Cole as URLs que o comando 'firebase deploy' gerou
const URL_CRIAR_ALUNO = "SUA_URL_DA_FUNCAO_CRIAR_AQUI";
const URL_ATUALIZAR_DADOS = "SUA_URL_DA_FUNCAO_ATUALIZAR_AQUI";
const URL_EXCLUIR_ALUNO = "SUA_URL_DA_FUNCAO_EXCLUIR_AQUI";

// --- 2. INTERFACES TYPESCRIPT ---
// Define a estrutura dos dados de um aluno
interface Aluno {
  nome: string;
  turma: string;
  unidade: string;
  saldo: number;
}

// Define a estrutura do objeto de alunos que vem do Firebase
interface AlunosData {
  [ra: string]: Aluno;
}

// Define as propriedades do modal de feedback
interface ModalInfo {
  visible: boolean;
  title: string;
  message: string;
  isSuccess: boolean;
}

// --- 3. COMPONENTES AUXILIARES ---

const FeedbackModal: React.FC<{ modalInfo: ModalInfo; onClose: () => void }> = ({ modalInfo, onClose }) => {
  if (!modalInfo.visible) return null;
  const colorClass = modalInfo.isSuccess ? 'text-green-400' : 'text-yellow-400';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-700 p-6 rounded-lg shadow-xl max-w-sm text-center">
        <h3 className={`text-lg font-bold mb-2 ${colorClass}`}>{modalInfo.title}</h3>
        <p className="text-gray-300 mb-4">{modalInfo.message}</p>
        <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md">Fechar</button>
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
    <div className="bg-gray-700 p-4 rounded-md flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex-grow w-full">
        <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="font-bold text-white bg-transparent w-full focus:outline-none focus:bg-gray-600 rounded px-1" />
        <p className="text-sm text-gray-400">RA: {ra} | Turma: {aluno.turma || 'N/A'}</p>
      </div>
      <div className="flex items-center gap-2 w-full md:w-auto">
        <span className="text-gray-400 text-sm">R$</span>
        <input type="number" value={saldo} onChange={(e) => setSaldo(Number(e.target.value))} className="w-24 bg-gray-600 border border-gray-500 rounded-md p-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button onClick={handleSave} className="btn-atualizar bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 rounded-md text-sm">Salvar</button>
        <button onClick={() => onDelete(ra)} className="btn-excluir bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded-md text-sm">X</button>
      </div>
    </div>
  );
};

// --- 4. COMPONENTE PRINCIPAL DA PÁGINA ---

const AdminDashboardPage: React.FC = () => {
  const [alunos, setAlunos] = useState<AlunosData>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [modalInfo, setModalInfo] = useState<ModalInfo>({ visible: false, title: '', message: '', isSuccess: false });
  const [formData, setFormData] = useState({ ra: '', nome: '', turma: '', unidade: '', saldo: '', senha: '' });

  const db = getDatabase(config.app);

  useEffect(() => {
    const alunosRef = ref(db, 'alunos/');
    const unsubscribe = onValue(alunosRef, (snapshot) => {
      const data = snapshot.val() || {};
      setAlunos(data);
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
    showModal({ title: 'Processando...', message: 'Aguarde enquanto o aluno é cadastrado.', isSuccess: false });
    try {
      const response = await fetch(URL_CRIAR_ALUNO, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    showModal({ title: 'Atualizando...', message: `Atualizando dados do RA ${ra}.`, isSuccess: false });
    try {
      const response = await fetch(URL_ATUALIZAR_DADOS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ra, ...novoAlunoData })
      });
      if (!response.ok) throw new Error('Falha ao atualizar');
      showModal({ title: 'Sucesso!', message: 'Dados atualizados.', isSuccess: true });
    } catch (error: any) {
      showModal({ title: 'Erro!', message: error.message, isSuccess: false });
    }
  };

  const handleDelete = async (ra: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o aluno com RA ${ra}? Essa ação não pode ser desfeita.`)) {
      showModal({ title: 'Excluindo...', message: `Removendo aluno com RA ${ra}.`, isSuccess: false });
      try {
        const response = await fetch(URL_EXCLUIR_ALUNO, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
    <div className="bg-gray-900 text-gray-200 min-h-screen font-sans">
      <FeedbackModal modalInfo={modalInfo} onClose={() => setModalInfo(prev => ({ ...prev, visible: false }))} />
      <div className="container mx-auto p-4 md:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">Painel de Admin</h1>
          <p className="text-gray-400">Feira de Trocas Cotemig</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulário de Cadastro */}
          <div className="lg:col-span-1 bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-white">Cadastrar Novo Aluno</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <input type="text" id="ra" value={formData.ra} onChange={handleFormChange} placeholder="RA do Aluno" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              <input type="text" id="nome" value={formData.nome} onChange={handleFormChange} placeholder="Nome Completo" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              <input type="text" id="turma" value={formData.turma} onChange={handleFormChange} placeholder="Turma (ex: 3INA)" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              <input type="text" id="unidade" value={formData.unidade} onChange={handleFormChange} placeholder="Unidade (ex: Barroca)" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              <input type="number" id="saldo" value={formData.saldo} onChange={handleFormChange} placeholder="Saldo Inicial" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              <input type="password" id="senha" value={formData.senha} onChange={handleFormChange} placeholder="Senha (mín. 6 caracteres)" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required minLength={6} />
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">Cadastrar Aluno</button>
            </form>
          </div>

          {/* Lista de Alunos */}
          <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-white">Alunos Cadastrados</h2>
            {isLoading ? (
              <div className="flex justify-center items-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div></div>
            ) : Object.keys(alunos).length === 0 ? (
              <p className="text-gray-500">Nenhum aluno encontrado no banco de dados.</p>
            ) : (
              <div className="space-y-3">
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

