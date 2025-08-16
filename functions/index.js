// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

admin.initializeApp();

// FUNÇÃO PARA CRIAR ALUNO (AUTH + DATABASE)
exports.criarAluno = functions.https.onRequest((request, response) => {
  cors(request, response, async () => {
    try {
      const { ra, nome, turma, unidade, saldo, senha } = request.body;
      await admin.auth().createUser({ uid: ra, email: `${ra}@cotemig.app`, password: senha, displayName: nome });
      await admin.database().ref(`/alunos/${ra}`).set({ nome, turma, unidade, saldo });
      response.status(201).send({ message: "Aluno criado com sucesso!" });
    } catch (error) {
      console.error("Erro ao criar aluno:", error);
      response.status(500).send({ message: "Erro ao criar aluno", error: error.message });
    }
  });
});

// FUNÇÃO PARA ATUALIZAR DADOS (NOME E SALDO)
exports.atualizarDados = functions.https.onRequest((request, response) => {
  cors(request, response, async () => {
    try {
      const { ra, nome, saldo } = request.body;
      await admin.database().ref(`/alunos/${ra}`).update({ nome, saldo });
      await admin.auth().updateUser(ra, { displayName: nome });
      response.status(200).send({ message: "Dados atualizados com sucesso!" });
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
      response.status(500).send({ message: "Erro ao atualizar dados", error: error.message });
    }
  });
});

// FUNÇÃO PARA EXCLUIR ALUNO (AUTH + DATABASE)
exports.excluirAluno = functions.https.onRequest((request, response) => {
  cors(request, response, async () => {
    try {
      const { ra } = request.body;
      await admin.auth().deleteUser(ra);
      await admin.database().ref(`/alunos/${ra}`).remove();
      response.status(200).send({ message: "Aluno excluído com sucesso!" });
    } catch (error) {
      console.error("Erro ao excluir aluno:", error);
      response.status(500).send({ message: "Erro ao excluir aluno", error: error.message });
    }
  });
});

// FUNÇÃO PARA DEFINIR UM USUÁRIO COMO ADMIN
exports.setAdminClaim = functions.https.onRequest((request, response) => {
  cors(request, response, async () => {
    try {
      const { ra } = request.body;
      if (!ra) return response.status(400).send({ message: "RA não fornecido." });
      await admin.auth().setCustomUserClaims(ra, { admin: true });
      response.status(200).send({ message: `Sucesso! Usuário ${ra} agora é um administrador.` });
    } catch (error) {
      console.error("Erro ao definir admin claim:", error);
      response.status(500).send({ message: "Erro ao definir admin claim.", error: error.message });
    }
  });
});

