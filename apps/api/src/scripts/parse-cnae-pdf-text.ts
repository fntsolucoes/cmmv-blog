/**
 * Gera seed SQL (INSERT) a partir do texto extraido do PDF da tabela CNAE Simples Nacional.
 * Uso: tsx src/scripts/parse-cnae-pdf-text.ts < caminho/para/tabela-cnae.txt > seed-simples-nacional-cnae.sql
 * Ou: tsx src/scripts/parse-cnae-pdf-text.ts caminho/para/tabela-cnae.txt
 *
 * Exporte o PDF para texto (copiar/colar ou ferramenta) e salve em tabela-cnae.txt.
 */

import * as fs from 'fs';
import * as path from 'path';

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

function main() {
    const args = process.argv.slice(2);
    let input: string;
    if (args[0]) {
        const filePath = path.isAbsolute(args[0]) ? args[0] : path.join(process.cwd(), args[0]);
        input = fs.readFileSync(filePath, 'utf-8');
    } else {
        input = fs.readFileSync(0, 'utf-8');
    }
    const lines = input.split(/\r?\n/).filter(l => {
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
            currentAnnex = suffixLength > 0 ? annex : undefined as unknown as string | null;
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

    console.log('-- Seed CNAE Simples Nacional (gerado por parse-cnae-pdf-text.ts)');
    console.log('INSERT OR IGNORE INTO sas_simples_nacional_cnae (id, code, denominacao, annex_code, createdAt, updatedAt) VALUES');
    const values = rows.map((r) => {
        const id = toId(r.code);
        const annex = (r.annex_code == null || r.annex_code === undefined) ? 'NULL' : `'${r.annex_code}'`;
        return `('${id}', '${escapeSql(r.code)}', '${escapeSql(r.denominacao)}', ${annex}, datetime('now'), datetime('now'))`;
    });
    console.log(values.join(',\n') + ';');
}

main();
