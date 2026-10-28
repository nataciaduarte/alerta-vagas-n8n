// Junta a classificação da IA com os dados de cada vaga
// e monta o texto do resumo em HTML, para o Telegram (Parse Mode: HTML).
const resposta = JSON.parse($json.choices[0].message.content);
const selecao = $('Selecionar vagas novas').first().json;
const vagas = selecao.vagas;
const porId = Object.fromEntries(vagas.map(v => [String(v.id), v]));

const classificadas = (resposta.vagas || [])
  .filter(c => porId[String(c.id)])
  .map(c => ({ ...porId[String(c.id)], aderencia: c.aderencia, motivo: c.motivo }));

const ordem = { alta: 0, media: 1, baixa: 2 };
const destaque = classificadas
  .filter(v => v.aderencia === 'alta' || v.aderencia === 'media')
  .sort((a, b) => ordem[a.aderencia] - ordem[b.aderencia]);

// Escapa caracteres especiais do HTML para o Telegram não quebrar a mensagem
const esc = t => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Remove os parâmetros de rastreamento do link
const linkLimpo = l => String(l || '').split('?')[0];

let texto = `<b>Vagas novas nas últimas 24 horas:</b> ${selecao.total_novas}\n`;
if (selecao.descartadas_por_regra) {
  texto += `Descartadas por regra fixa (ensino médio ou curso técnico): ${selecao.descartadas_por_regra}\n`;
}
texto += `Analisadas pela IA: ${vagas.length}\n`;
texto += `<b>Combinam com seu perfil:</b> ${destaque.length}\n\n`;
let omitidas = 0;
for (const v of destaque) {
  if (texto.length > 3600) { omitidas++; continue; } // limite de 4096 caracteres do Telegram
  const nivel = v.aderencia === 'alta' ? 'ALTA' : 'MÉDIA';
  texto += `<b>${nivel}</b> | ${esc(v.titulo)} | ${esc(v.empresa)}\n`;
  texto += `<i>${esc(v.motivo)}</i>\n`;
  texto += `<a href="${esc(linkLimpo(v.link))}">Ver vaga</a>\n\n`;
}
if (omitidas) {
  texto += `E mais ${omitidas} vaga(s) que não couberam nesta mensagem.\n`;
}
if (destaque.length === 0) {
  texto += 'Nenhuma vaga nova com boa aderência hoje.';
}

return [{ json: { texto, total_novas: selecao.total_novas, destaque: destaque.length, classificadas } }];
