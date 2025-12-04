#!/usr/bin/env node

/**
 * Script para verificar se o build foi executado corretamente
 * Executa o build automaticamente se necessário
 */

import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const requiredFiles = [
    'dist/server.js',
    'dist/entry-server.js',
    'dist/assets'
];

console.log('🔍 Verificando build...\n');

let buildNeeded = false;

for (const file of requiredFiles) {
    const filePath = join(projectRoot, file);
    if (!existsSync(filePath)) {
        console.log(`❌ Arquivo não encontrado: ${file}`);
        buildNeeded = true;
    } else {
        console.log(`✅ Arquivo encontrado: ${file}`);
    }
}

if (buildNeeded) {
    console.log('\n⚠️  Build incompleto detectado!');
    console.log('🔨 Executando build...\n');
    
    try {
        process.chdir(projectRoot);
        execSync('pnpm run build', { 
            stdio: 'inherit',
            cwd: projectRoot
        });
        console.log('\n✅ Build concluído com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erro ao executar build:', error.message);
        process.exit(1);
    }
} else {
    console.log('\n✅ Build verificado e completo!');
    process.exit(0);
}

