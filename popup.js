/*
  popup.js - lógica do popup

  PASSOS IMPORTANTES:
  1) Substitua o valor de ADMIN_TOKEN abaixo pelo token fixo fornecido pelo administrador:
       const ADMIN_TOKEN = "<COLE_AQUI_O_TOKEN_FIXO>";
     -> Troque exatamente o texto <COLE_AQUI_O_TOKEN_FIXO> pelo token.
  2) Opcionalmente: insira o ID da extensão principal no input do popup ou modifique
     a variável DEFAULT_TARGET_EXTENSION_ID abaixo.

  AVISO: Este token dá controle total — mantenha-o seguro. Não o compartilhe.
*/

// Token embutido — substituir pelo token real fornecido pelo administrador
const ADMIN_TOKEN = "<COLE_AQUI_O_TOKEN_FIXO>"; // **trocar <COLE_AQUI_O_TOKEN_FIXO> pelo token fornecido pelo administrador**

// Opcional: colocar um ID padrão da extensão alvo aqui como fallback
const DEFAULT_TARGET_EXTENSION_ID = ""; // Ex: "abcdefghijklmnopqrstu..." (deixe vazio para forçar input)

document.addEventListener('DOMContentLoaded', () => {
  const targetInput = document.getElementById('targetId');
  const sendBtn = document.getElementById('sendBtn');
  const toast = document.getElementById('toast');

  // Auto-popula o input se houver ID padrão
  if (DEFAULT_TARGET_EXTENSION_ID) targetInput.value = DEFAULT_TARGET_EXTENSION_ID;

  function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 4000);
  }

  sendBtn.addEventListener('click', () => {
    const targetId = (targetInput.value || DEFAULT_TARGET_EXTENSION_ID || '').trim();

    if (!targetId) {
      showToast('Por favor, insira o Target extension ID.', 'error');
      return;
    }

    // Confirmação do usuário
    const ok = confirm('Tem certeza que deseja limpar todos os sites bloqueados na extensão alvo?');
    if (!ok) return;

    // Preparar payload
    const message = { action: 'clearBlockedSites', token: ADMIN_TOKEN };

    try {
      // Envia mensagem externa para a extensão alvo
      chrome.runtime.sendMessage(targetId, message, (response) => {
        // Detectar erros de runtime (ex.: extensão não encontrada)
        if (chrome.runtime.lastError) {
          // Ex.: 'Could not establish connection. Receiving end does not exist.'
          console.error('chrome.runtime.lastError:', chrome.runtime.lastError.message);
          showToast(`Erro: ${chrome.runtime.lastError.message}`, 'error');
          return;
        }

        // Se a extensão alvo respondeu com um objeto de erro
        if (!response) {
          showToast('Nenhuma resposta da extensão alvo.', 'error');
          return;
        }

        if (response.success) {
          showToast('Comando enviado com sucesso — desbloqueio realizado.', 'success');
        } else {
          const errMsg = response.error || 'Falha desconhecida na extensão alvo.';
          showToast(`Falha: ${errMsg}`, 'error');
        }
      });
    } catch (e) {
      console.error(e);
      showToast('Erro ao enviar mensagem: ' + e.message, 'error');
    }
  });
});
