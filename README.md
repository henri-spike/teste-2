# Desbloqueador Remoto (Extensão Auxiliar)

Este repositório contém uma extensão Chrome (Manifest V3) auxiliar chamada "Desbloqueador Remoto".
Ela envia um comando autenticado para outra extensão (a extensão principal) para remover todos os sites bloqueados.

ATENÇÃO: Esta extensão atua apenas como cliente/auxiliar — a extensão principal deve implementar um listener
para `onMessageExternal` e validar o token. O token embutido dá controle total sobre a ação remota; mantenha-o seguro.

## Arquivos incluídos

- `manifest.json` — Manifest V3 com permissões `storage` e `notifications`, aponta para `popup.html` e `background.js`.
- `popup.html` — Interface do popup com campo para `Target extension ID` e botão para enviar o comando.
- `popup.css` — Estilos do popup.
- `popup.js` — Lógica do envio: contém a constante `ADMIN_TOKEN` (placeholder) e envia a mensagem externa.
- `background.js` — Service worker mínimo (opcional) para a extensão auxiliar.

## Placeholders importantes

- No arquivo `popup.js` há a linha:

```js
const ADMIN_TOKEN = "<COLE_AQUI_O_TOKEN_FIXO>"; // **trocar pelo token real**
```

Substitua `<COLE_AQUI_O_TOKEN_FIXO>` pelo token fixo fornecido pelo administrador. Este token **dá controle total** — não o compartilhe.

- Você pode inserir o ID da extensão principal no campo do popup em tempo de execução. Opcionalmente, defina `DEFAULT_TARGET_EXTENSION_ID`
	em `popup.js` para auto-popular o campo.

## Como instalar (modo desenvolvedor)

1. Abra Chrome e acesse `chrome://extensions`.
2. Ative o "Modo do desenvolvedor" (no canto superior direito).
3. Clique em "Carregar sem compactação" e selecione a pasta deste projeto (`/workspaces/teste-2`).
4. Clique no ícone da extensão e abra o popup.
5. Cole o ID da extensão principal no campo "Target extension ID".
6. No `popup.js`, cole o token do administrador em `ADMIN_TOKEN`.
7. Clique em "Enviar comando de desbloqueio" e confirme.

## Exemplo mínimo de listener (extensão principal)

O seguinte snippet ilustra como a extensão principal pode implementar um listener para aceitar a mensagem e validar o token:

```js
// Exemplo em background.js da extensão principal
const ADMIN_TOKEN_EXPECTED = "<TOKEN_ESPERADO_PELA_PRINCIPAL>";

chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
	try {
		if (!msg || msg.action !== 'clearBlockedSites') {
			sendResponse({ success: false, error: 'ação inválida' });
			return;
		}

		if (msg.token !== ADMIN_TOKEN_EXPECTED) {
			sendResponse({ success: false, error: 'token inválido' });
			return;
		}

		// Aqui execute a lógica para limpar a lista de sites bloqueados
		// ex: storage.local.set({ blockedSites: [] }) ou chamada ao seu código interno

		sendResponse({ success: true });
	} catch (err) {
		console.error(err);
		sendResponse({ success: false, error: String(err) });
	}
});
```

Observação: a extensão principal deve validar o token de forma segura e possibilitar mensagens externas (ver `manifest.json` e `externally_connectable` se necessário).

## Segurança e recomendações

- Nunca exponha o `ADMIN_TOKEN` em repositórios públicos sem controle de acesso.
- Considere usar canais mais seguros (servidor backend com autenticação) se for necessário gerenciar tokens dinâmica ou revogá-los.
- Limit the scope: a extensão principal deve checar origem/ID do remetente e o token.

## Próximos passos sugeridos

- Adicionar validação do formato do `Target extension ID` no `popup.js`.
- Implementar logs/armazenamento na extensão auxiliar para auditoria.
- Criar um mecanismo de rotação/revogação de tokens na extensão principal se for necessário mais segurança.

---

Se quiser, eu atualizo `popup.js` para preencher automaticamente um `DEFAULT_TARGET_EXTENSION_ID` e adicionar validação do ID — quer que eu faça isso agora?
