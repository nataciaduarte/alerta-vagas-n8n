// Recebe todas as vagas do vagas.json (uma vaga por item)
// e separa as que foram coletadas nas últimas 24 horas.
const INSTRUCOES = "Você classifica vagas de estágio para uma candidata. Perfil da candidata:\n- Estudante de Tecnólogo em Inteligência Artificial e Machine Learning (1º semestre, conclusão prevista em 12/2028).\n- Busca estágio em IA aplicada, automação, análise de dados ou machine learning. Aceita outras áreas só se o trabalho envolver dados, sistemas ou ferramentas digitais.\n- Experiência anterior: conferência, controle de estoque e registro de dados em farmácia hospitalar; administração de negócio próprio por quase 9 anos.\n- Usa agentes de IA na prática. Python e SQL em desenvolvimento. Excel básico. Não fala inglês.\n- Mora no Rio de Janeiro. Aceita remoto, híbrido ou presencial no Centro do Rio ou em Duque de Caxias. Turnos de manhã e tarde.\n\nPara cada vaga recebida, atribua:\n- \"alta\": estágio ligado a IA, dados, automação, sistemas ou tecnologia, sem exigência que ela claramente não cumpre.\n- \"media\": estágio administrativo, de negócios ou operações em que dados ou ferramentas digitais têm papel relevante.\n- \"baixa\": área sem relação (por exemplo direito, engenharia civil, saúde, vendas de balcão) ou exigência que ela não cumpre (inglês fluente, curso específico diferente do dela, local fora do Rio).\n\nRegras obrigatórias:\n- Se a vaga exigir curso específico diferente do dela (por exemplo Administração, Engenharia, Psicologia, Direito, Arquitetura, mestrado ou curso técnico), classifique como \"baixa\", mesmo que as atividades envolvam dados. Exceção: se o curso exigido for próximo (Ciência de Dados, Computação, Sistemas, Estatística ou Matemática), use no máximo \"media\" e diga no motivo que o curso pedido é diferente.\n- Se não for estágio e também não for vaga de tecnologia ou dados, classifique como \"baixa\".\n- Se a descrição não trouxer atividades nem requisitos, use no máximo \"media\" e escreva \"descrição sem detalhes\" no motivo.\n- Baseie-se apenas no título, empresa, local e descrição recebidos. Nunca deduza atividades, ferramentas ou requisitos que não estejam escritos.\nResponda somente com JSON no formato {\"vagas\": [{\"id\": \"...\", \"aderencia\": \"alta|media|baixa\", \"motivo\": \"frase curta em português\"}]}, com uma entrada para cada vaga recebida e o id exatamente igual ao recebido.";

const agora = Date.now();
const umDia = 24 * 60 * 60 * 1000;

const novas = $input.all()
  .map(item => item.json)
  .filter(v => v.coletada_em &&
    agora - new Date(v.coletada_em.replace(' ', 'T') + 'Z').getTime() <= umDia);
const totalNovas = novas.length;

// Regra fixa, sem IA: descarta vagas que pedem ensino médio ou curso técnico.
// Esses casos são objetivos, e a IA errou neles nos testes.
const PEDE_OUTRO_NIVEL = /ensino m[eé]dio|(curso|n[ií]vel|est[aá]gio) t[eé]cnico|\bt[eé]c\b/i;
const descartadas = novas.filter(v => PEDE_OUTRO_NIVEL.test(v.titulo || ''));
const elegiveis = novas.filter(v => !PEDE_OUTRO_NIVEL.test(v.titulo || ''));
novas.length = 0;
novas.push(...elegiveis);
novas.splice(25); // até 25 vagas por dia, para caber no plano gratuito do Groq

if (novas.length === 0) {
  return [{ json: { total: 0, vagas: [] } }];
}

// Só o necessário vai para a IA, com a descrição encurtada
const lista = novas.map(v => ({
  id: String(v.id),
  titulo: v.titulo,
  empresa: v.empresa,
  local: v.local,
  descricao: (v.descricao || '').slice(0, 200),
}));

return [{
  json: {
    total: novas.length,
    total_novas: totalNovas,
    descartadas_por_regra: descartadas.length,
    vagas: novas,
    requisicao: {
      model: 'openai/gpt-oss-120b',
      reasoning_effort: 'low',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: INSTRUCOES },
        { role: 'user', content: JSON.stringify(lista) },
      ],
    },
  },
}];
