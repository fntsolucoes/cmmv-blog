#!/bin/bash
# Script para instalar Chrome para Puppeteer
# Execute: chmod +x install-puppeteer-chrome.sh && ./install-puppeteer-chrome.sh

echo "📦 Instalando Chrome para Puppeteer..."
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto (onde está o package.json)"
    exit 1
fi

# Instalar Chrome via Puppeteer
echo "🔧 Executando: npx puppeteer browsers install chrome"
npx puppeteer browsers install chrome

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Chrome instalado com sucesso!"
    echo "💡 Agora você pode reiniciar o servidor e testar a validação de scripts."
else
    echo ""
    echo "❌ Erro ao instalar Chrome. Tente executar manualmente:"
    echo "   npx puppeteer browsers install chrome"
    exit 1
fi

