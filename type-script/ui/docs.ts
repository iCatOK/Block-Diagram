document.addEventListener('DOMContentLoaded', () => {
    const highlightAll = () => {
        const preBlocks = document.querySelectorAll('pre');
        preBlocks.forEach(pre => {
            // Игнорируем блоки, у которых уже есть класс или которые помечены как lua
            if (pre.classList.contains('highlighted') || pre.className.includes('lua')) return;
            // pre.classList.add("textarea-container");
            const code = pre.textContent!;
            const tokens = Lexer.lex(code, false);

            let result = "";
            let lastPos = 0;

            tokens.forEach(token => {
                // Добавляем текст между токенами (пробелы и т.д.)
                result += code.substring(lastPos, token.range.start);

                const kindName = TokenKind[token.kind];
                const content = code.substring(token.range.start, token.range.end);

                result += `<span class="token-${kindName}">${content}</span>`;
                lastPos = token.range.end;
            });

            // Добавляем остаток текста
            result += code.substring(lastPos);

            pre.innerHTML = result;
            pre.classList.add('highlighted');
        });
    };

    highlightAll();

});