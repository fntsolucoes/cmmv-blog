/**
 * Extrai texto do PDF da tabela CNAE e gera seed SQL.
 * Uso: tsx src/scripts/parse-cnae-from-pdf.ts "caminho/para/tabela-cnae.pdf" > seed-simples-nacional-cnae.sql
 * Requer: pnpm add -D pdf-parse-new
 */

import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfModule = require('pdf-parse-new');
const pdf =
    typeof pdfModule === 'function'
        ? (pdfModule as (buffer: Buffer) => Promise<{ text: string }>)
        : (pdfModule as { default: (buffer: Buffer) => Promise<{ text: string }> }).default;

const CODE_REG = /^(\d{4}-\d{1,2}\/\d{0,2})\s+/;

function extractAnnexFromEnd(line: string): { annex: string | null; suffixLength: number } {
    const t = line.trimEnd();
    const patterns: { re: RegExp; annex: string | null }[] = [
        { re: /\s+I\s+4,00%?\s*$/, annex: 'I' },
        { re: /\s+II\s+4,50%?\s*$/, annex: 'II' },
        { re: /\s+III\s+6,00%?\s*$/, annex: 'III' },
        { re: /\s+IV\s+4,50%?\s*$/, annex: 'IV' },
        { re: /\s+V\s+19,5%?\s*(\([^)]*\))?\s*$/, annex: 'V' },
        { re: /\s+VI\s+16,93%?\s*$/, annex: 'VI' },
        { re: /\s+Impeditiva\s*$/i, annex: null },
        { re: /\s+II\s*-\s*III\s+Variável\s*$/i, annex: 'II' },
        { re: /\s+II\s*-\s*III\s+Impeditiva\s*$/i, annex: null },
        { re: /\s+II\s*-\s*III\s*$/, annex: 'II' },
    ];
    for (const { re, annex } of patterns) {
        const m = t.match(re);
        if (m) {
            const suffixLength = m[0].length;
            return { annex, suffixLength };
        }
    }
    return { annex: undefined as unknown as string | null, suffixLength: 0 };
}

function escapeSql(s: string): string {
    return s.replace(/'/g, "''").trim();
}

function toId(code: string): string {
    return 'cnae-' + code.replace(/\//g, '-');
}

function parseLinesToRows(input: string): { code: string; denominacao: string; annex_code: string | null }[] {
    const lines = input.split(/\r?\n/).filter((l) => {
        const t = l.trim();
        if (!t) return false;
        if (/^--\s*\d+\s+of\s+\d+\s*--/.test(t)) return false;
        if (/^Código\s*$|^CNAE\s*$|^Denominação\s*$|^ANEXO\s*$/i.test(t)) return false;
        if (/^Alíquota\s*\(/i.test(t)) return false;
        if (/^Tabela de CNAEs/i.test(t)) return false;
        return true;
    });
    const rows: { code: string; denominacao: string; annex_code: string | null }[] = [];
    let currentCode = '';
    let currentDenom: string[] = [];
    let currentAnnex: string | null = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const codeMatch = line.match(CODE_REG);
        if (codeMatch) {
            if (currentCode) {
                const denom = currentDenom.join(' ').trim();
                if (denom) rows.push({ code: currentCode, denominacao: denom, annex_code: currentAnnex });
            }
            currentCode = codeMatch[1];
            const rest = line.slice(codeMatch[0].length);
            const { annex, suffixLength } = extractAnnexFromEnd(rest);
            currentAnnex = suffixLength > 0 ? annex : (undefined as unknown as string | null);
            const denomPart = suffixLength > 0 ? rest.slice(0, rest.length - suffixLength).trim() : rest.trim();
            currentDenom = denomPart ? [denomPart] : [];
        } else if (currentCode && line.trim()) {
            const { annex, suffixLength } = extractAnnexFromEnd(line);
            if (suffixLength > 0) {
                currentAnnex = annex;
                const denomPart = line.slice(0, line.length - suffixLength).trim();
                if (denomPart) currentDenom.push(denomPart);
            } else {
                currentDenom.push(line.trim());
            }
        }
    }
    if (currentCode) {
        const denom = currentDenom.join(' ').trim();
        if (denom) rows.push({ code: currentCode, denominacao: denom, annex_code: currentAnnex });
    }
    return rows;
}

async function main(): Promise<void> {
    let pdfPath = process.argv[2];
    if (!pdfPath) {
        console.error('Uso: tsx parse-cnae-from-pdf.ts "caminho/para/tabela-cnae.pdf"');
        process.exit(1);
    }
    // No WSL/Linux, caminhos no estilo Windows (ex.: c:\Users\...) nao sao absolutos; converter para /mnt/c/...
    if (process.platform === 'linux' && /^[a-zA-Z]:[\\/]/.test(pdfPath)) {
        pdfPath = '/mnt/' + pdfPath[0].toLowerCase() + pdfPath.slice(2).replace(/\\/g, '/');
    }
    const fullPath = path.isAbsolute(pdfPath) ? pdfPath : path.join(process.cwd(), pdfPath);
    if (!fs.existsSync(fullPath)) {
        console.error('Arquivo nao encontrado:', fullPath);
        process.exit(1);
    }

    const dataBuffer = fs.readFileSync(fullPath);
    try {
        const data = await pdf(dataBuffer);
        const rows = parseLinesToRows(data.text);
        console.log('-- Seed CNAE Simples Nacional (gerado por parse-cnae-from-pdf.ts)');
        console.log(
            'INSERT OR IGNORE INTO sas_simples_nacional_cnae (id, code, denominacao, annex_code, createdAt, updatedAt) VALUES'
        );
        const values = rows.map((r) => {
            const id = toId(r.code);
            const annex =
                r.annex_code == null || r.annex_code === undefined ? 'NULL' : `'${r.annex_code}'`;
            return `('${id}', '${escapeSql(r.code)}', '${escapeSql(r.denominacao)}', ${annex}, datetime('now'), datetime('now'))`;
        });
        console.log(values.join(',\n') + ';');
    } catch (err) {
        console.error('Erro ao ler PDF:', err instanceof Error ? err.message : String(err));
        process.exit(1);
    }
}

main();
