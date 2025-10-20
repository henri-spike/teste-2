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

// Chave para salvar/recuperar a última remoção localmente
const STORAGE_KEY_LAST_REMOVED = 'desbloqueador_last_removed';

document.addEventListener('DOMContentLoaded', () => {
  const targetInput = document.getElementById('targetId');
  const fetchBtn = document.getElementById('fetchBtn');
  const removeSelectedBtn = document.getElementById('removeSelectedBtn');
  const restoreBtn = document.getElementById('restoreBtn');
  const sitesContainer = document.getElementById('sitesContainer');
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

  // Função: buscar sites bloqueados da extensão principal
  fetchBtn.addEventListener('click', () => {
    const targetId = (targetInput.value || DEFAULT_TARGET_EXTENSION_ID || '').trim();
    if (!targetId) { showToast('Por favor, insira o Target extension ID.', 'error'); return; }

    chrome.runtime.sendMessage(targetId, { action: 'getBlockedSites', token: ADMIN_TOKEN }, (response) => {
      if (chrome.runtime.lastError) { showToast(`Erro: ${chrome.runtime.lastError.message}`, 'error'); return; }
      if (!response) { showToast('Nenhuma resposta da extensão alvo.', 'error'); return; }
      if (!response.success) { showToast(`Falha: ${response.error || 'erro desconhecido'}`, 'error'); return; }

      // response.sites deve ser um array de strings
      renderSitesList(response.sites || []);
      showToast('Lista carregada.', 'success');
    });
  });

  // Remover sites selecionados
  removeSelectedBtn.addEventListener('click', () => {
    const targetId = (targetInput.value || DEFAULT_TARGET_EXTENSION_ID || '').trim();
    if (!targetId) { showToast('Por favor, insira o Target extension ID.', 'error'); return; }

    const checkedBoxes = sitesContainer.querySelectorAll('input[type="checkbox"]:checked');
    if (!checkedBoxes.length) { showToast('Selecione ao menos um site para remover.', 'error'); return; }

    if (!confirm(`Remover ${checkedBoxes.length} site(s) da extensão alvo?`)) return;

    const sitesToRemove = Array.from(checkedBoxes).map(cb => cb.value);

    // Envia lista para remoção; a extensão principal deve aceitar uma lista
    chrome.runtime.sendMessage(targetId, { action: 'clearBlockedSites', token: ADMIN_TOKEN, sites: sitesToRemove }, (response) => {
      if (chrome.runtime.lastError) { showToast(`Erro: ${chrome.runtime.lastError.message}`, 'error'); return; }
      if (!response) { showToast('Nenhuma resposta da extensão alvo.', 'error'); return; }
      if (!response.success) { showToast(`Falha: ${response.error || 'erro desconhecido'}`, 'error'); return; }

      // Salvar último conjunto removido para possível restauração
      chrome.storage.local.set({ [STORAGE_KEY_LAST_REMOVED]: { targetId, sites: sitesToRemove } }, () => {
        showToast('Sites removidos com sucesso. Você pode restaurá-los usando "Restaurar última remoção".', 'success');
        restoreBtn.disabled = false;
        // Recarregar a lista atual
        fetchBtn.click();
      });
    });
  });

  // Restaurar a última remoção
  restoreBtn.addEventListener('click', () => {
    chrome.storage.local.get([STORAGE_KEY_LAST_REMOVED], (items) => {
      const last = items[STORAGE_KEY_LAST_REMOVED];
      if (!last || !last.sites || !last.sites.length) { showToast('Nenhuma remoção salva para restaurar.', 'error'); return; }

      if (!confirm(`Restaurar ${last.sites.length} site(s) para a extensão ${last.targetId}?`)) return;

      chrome.runtime.sendMessage(last.targetId, { action: 'restoreBlockedSites', token: ADMIN_TOKEN, sites: last.sites }, (response) => {
        if (chrome.runtime.lastError) { showToast(`Erro: ${chrome.runtime.lastError.message}`, 'error'); return; }
        if (!response) { showToast('Nenhuma resposta da extensão alvo.', 'error'); return; }
        if (!response.success) { showToast(`Falha: ${response.error || 'erro desconhecido'}`, 'error'); return; }

        showToast('Restauração concluída.', 'success');
        // Limpar última remoção
        chrome.storage.local.remove([STORAGE_KEY_LAST_REMOVED], () => { restoreBtn.disabled = true; fetchBtn.click(); });
      });
    });
  });

  // Ao abrir popup, verificar se há remoção salva
  chrome.storage.local.get([STORAGE_KEY_LAST_REMOVED], (items) => {
    if (items && items[STORAGE_KEY_LAST_REMOVED] && items[STORAGE_KEY_LAST_REMOVED].sites.length) {
      restoreBtn.disabled = false;
    }
  });

  // Renderiza a lista de sites no container com checkboxes
  function renderSitesList(sites) {
    sitesContainer.innerHTML = '';
    if (!sites || !sites.length) {
      sitesContainer.innerHTML = '<p class="note">Nenhum site bloqueado.</p>';
      removeSelectedBtn.disabled = true;
      return;
    }

    sites.forEach((s, idx) => {
      const div = document.createElement('div');
      div.className = 'site-item';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = s;
      checkbox.id = `site_${idx}`;
      const label = document.createElement('label');
      label.htmlFor = checkbox.id;
      label.textContent = s;
      div.appendChild(checkbox);
      div.appendChild(label);
      sitesContainer.appendChild(div);
    });

    removeSelectedBtn.disabled = false;
  }
});
