/*
  background.js - serviço opcional para a extensão auxiliar

  Observações:
  - A maior parte da lógica é executada no popup. Mantivemos este service worker
    minimalista para possíveis futuras extensões (ex.: logs, armazenamento).
  - Se não precisar, pode remover o campo "background" do manifest.json.

  IMPORTANTE: O token e o envio da mensagem são feitos no popup por simplicidade.
*/

// Exemplo: listener para mensagens internas (não é usado para a mensagem externa)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('background recebeu mensagem interna:', msg, 'de', sender);
  if (msg && msg.ping) {
    sendResponse({ pong: true });
  }
  // return true para indicar resposta assíncrona se necessário
});
