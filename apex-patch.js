/**
 * APEX | Cobli — Layout Patch v2
 * Adiciona data-status nos painel-items para coloração por status via CSS.
 * Cole <script src="apex-patch.js"></script> antes do </body>
 */
(function() {
    // Mapa de palavras-chave → classe de status
    function resolverStatus(statusStr) {
        let s = String(statusStr || '').toLowerCase();
        if (s.includes('conclu') || s.includes('finalizado') || s.includes('completed')) return 'concluido';
        if (s.includes('negocia') || s.includes('aguardando')) return 'negociacao';
        if (s.includes('agendado') || s.includes('scheduled')) return 'agendado';
        if (s.includes('andamento') || s.includes('progress') || s.includes('deslocamento')) return 'andamento';
        if (s.includes('impedido') || s.includes('reportado') || s.includes('falha')) return 'impedido';
        if (s.includes('cancelado') || s.includes('canceled')) return 'cancelado';
        return 'solicitado';
    }

    // Observer para marcar painel-items com data-status quando renderizados
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(m) {
            m.addedNodes.forEach(function(node) {
                if (node.nodeType !== 1) return;

                // Items do painel principal
                let items = node.classList && node.classList.contains('painel-item')
                    ? [node]
                    : Array.from(node.querySelectorAll ? node.querySelectorAll('.painel-item') : []);

                items.forEach(function(item) {
                    if (item.dataset.status) return; // já tem
                    // Tenta extrair o status do texto interno
                    let statusMatch = item.innerHTML.match(/Status:\s*<span[^>]*>([^<]+)</i);
                    if (!statusMatch) {
                        // fallback: procura diretamente no texto
                        statusMatch = item.textContent.match(/Status:\s*([^\|]+)/i);
                    }
                    if (statusMatch) {
                        item.dataset.status = resolverStatus(statusMatch[1].trim());
                    }
                });
            });
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Aplica nos items já existentes ao carregar
    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('.painel-item').forEach(function(item) {
            if (item.dataset.status) return;
            let statusMatch = item.innerHTML.match(/Status:\s*<span[^>]*>([^<]+)</i)
                           || item.textContent.match(/Status:\s*([^\|]+)/i);
            if (statusMatch) {
                item.dataset.status = resolverStatus(statusMatch[1].trim());
            }
        });
    });

    console.log('✅ APEX Patch v2 — Layout enhancements active');
})();
