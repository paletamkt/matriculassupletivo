/* ─────────────────────────────────────────────
   SUPLETIVO DO NORTE · Dashboard v3
   Configuração, dados, gráficos e render
───────────────────────────────────────────── */

const SUPABASE_URL = "https://ieshyaiudxjrdwllbdai.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imllc2h5YWl1ZHhqcmR3bGxiZGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNzAwMDcsImV4cCI6MjA5Mjc0NjAwN30.ilWUJDdfrm1R6umsUEu1_Z3iId3ejCNGeeE0sEPs9z8";

/* ── Formatadores ── */
function fmt(v) {
  return 'R$ ' + Number(v).toLocaleString('pt-BR');
}

function fmtK(v) {
  if (v >= 1_000_000) return 'R$ ' + (v / 1_000_000).toFixed(2).replace('.', ',') + 'M';
  if (v >= 1_000)     return 'R$ ' + (v / 1_000).toFixed(0) + 'k';
  return fmt(v);
}

function varPct(atual, anterior) {
  if (!anterior || anterior === 0) return null;
  return ((atual - anterior) / anterior * 100).toFixed(1);
}

function deltaHTML(pct) {
  if (pct === null) return '';
  const sign = pct >= 0 ? '+' : '';
  const cls  = pct > 0 ? 'delta-up' : pct < 0 ? 'delta-down' : 'delta-flat';
  return `<span class="delta ${cls}">${sign}${pct}%</span>`;
}

function badgeVar(pct) {
  if (pct === null) return '<span class="badge-var delta-flat" style="background:transparent;color:var(--muted)">—</span>';
  const sign = pct >= 0 ? '+' : '';
  const cls  = pct > 0 ? 'delta-up' : pct < 0 ? 'delta-down' : 'delta-flat';
  return `<span class="badge-var ${cls}">${sign}${pct}%</span>`;
}

/* ── Chart defaults ── */
const chartDefaults = {
  plugins: {
    legend: {
      labels: { color: '#6b7fa3', font: { family: 'Sora', size: 11 } }
    }
  },
  scales: {
    x: {
      ticks: { color: '#6b7fa3', font: { size: 10 } },
      grid:  { color: 'rgba(255,255,255,0.03)' }
    },
    y: {
      ticks: { color: '#6b7fa3', font: { size: 10 } },
      grid:  { color: 'rgba(255,255,255,0.05)' }
    }
  }
};

let charts = {};

/* ── Sazonalidade ── */
function checkSazonalidade() {
  const hoje = new Date();
  const mes  = hoje.getMonth(); // 0-based
  const dia  = hoje.getDate();

  const alertEl = document.getElementById('alertSazo');
  let icon = '', titulo = '', texto = '';

  if ((mes === 11 && dia >= 22) || (mes === 0 && dia <= 4)) {
    icon = '⚠️'; titulo = 'Período de Baixa — Virada de Ano';
    texto = 'Histórico mostra queda para R$ 7.800–8.650/sem entre 22/dez e 04/jan. Momento de ajustar expectativas e focar em captação para a retomada.';
  } else if (mes === 1 && dia >= 24 && dia <= 28) {
    icon = '🎭'; titulo = 'Atenção — Semana de Carnaval';
    texto = 'Carnaval derrubou 58% do faturamento em 2026 (R$ 11.000). A semana seguinte recuperou forte para R$ 23.000 — prepare ação de captação antecipada.';
  } else if (mes === 2 && dia >= 1 && dia <= 7) {
    icon = '🚀'; titulo = 'Janela de Retomada Pós-Carnaval';
    texto = 'Forte recuperação histórica logo após o carnaval. Semana estratégica para captação agressiva.';
  } else if (mes === 0 && dia >= 5 && dia <= 11) {
    icon = '🚀'; titulo = 'Janela de Retomada Pós-Virada';
    texto = 'Início de janeiro 2026 registrou o maior salto do histórico: +195% em uma semana. Aproveite o momento.';
  }

  if (titulo) {
    alertEl.classList.add('show');
    document.getElementById('alertSazoIcon').textContent   = icon;
    document.getElementById('alertSazoTitulo').textContent = titulo;
    document.getElementById('alertSazoTexto').textContent  = texto;
  }
}

/* ── Render principal ── */
function render(data) {
  const labels = data.map(d => {
    const dt = new Date(d.semana_inicio + 'T00:00:00');
    return `${dt.getDate().toString().padStart(2,'0')}/${(dt.getMonth()+1).toString().padStart(2,'0')}`;
  });

  const fats   = data.map(d => d.faturamento    || 0);
  const alunos = data.map(d => d.alunos          || 0);
  const provas = data.map(d => d.provas          || 0);
  const certs  = data.map(d => d.cert_solicitados || 0);

  const ultima    = data[data.length - 1];
  const penultima = data.length >= 2 ? data[data.length - 2] : null;

  /* ── Hero KPIs ── */

  // Provas — DESTAQUE PRINCIPAL
  const provasAtual = ultima.provas || 0;
  const provasAnt   = penultima ? (penultima.provas || 0) : null;
  const provasVar   = varPct(provasAtual, provasAnt);

  document.getElementById('heroProvasVal').textContent  = provasAtual;
  document.getElementById('heroProvasPer').textContent  = ultima.periodo || '—';
  document.getElementById('heroProvasVar').innerHTML    = deltaHTML(provasVar);

  const totalProvas  = provas.reduce((a, b) => a + b, 0);
  const mediaProvas  = provas.filter(Boolean).length
    ? Math.round(totalProvas / provas.filter(Boolean).length)
    : 0;
  document.getElementById('heroProvasSub').textContent = `Média: ${mediaProvas} provas/sem · Total 2026: ${totalProvas}`;

  // Faturamento semana
  const fatAtual = ultima.faturamento;
  const fatAnt   = penultima ? penultima.faturamento : null;
  const fatVar   = varPct(fatAtual, fatAnt);

  document.getElementById('heroFatVal').textContent = fmt(fatAtual);
  document.getElementById('heroFatPer').textContent = ultima.periodo || '—';
  document.getElementById('heroFatVar').innerHTML   = deltaHTML(fatVar);

  // Alunos semana
  const alunosAtual = ultima.alunos || 0;
  const alunosAnt   = penultima ? (penultima.alunos || 0) : null;
  const alunosVar   = varPct(alunosAtual, alunosAnt);
  const totalAlunos = alunos.filter(Boolean).reduce((a, b) => a + b, 0);
  const mediaAlunos = alunos.filter(Boolean).length
    ? Math.round(totalAlunos / alunos.filter(Boolean).length)
    : 0;

  document.getElementById('heroAlunosVal').textContent = alunosAtual;
  document.getElementById('heroAlunosPer').textContent = ultima.periodo || '—';
  document.getElementById('heroAlunosVar').innerHTML   = deltaHTML(alunosVar);
  document.getElementById('heroAlunosSub').textContent = `Média: ${mediaAlunos} alunos/sem`;

  /* ── KPIs Secundários ── */
  const totalFat = fats.reduce((a, b) => a + b, 0);
  const mediaFat = Math.round(totalFat / data.length);
  const melhorIdx = fats.indexOf(Math.max(...fats));
  const totalCerts = certs.reduce((a, b) => a + b, 0);

  document.getElementById('secFatMedia').textContent   = fmt(mediaFat);
  document.getElementById('secFatMelhor').textContent  = fmt(fats[melhorIdx]);
  document.getElementById('secFatMelhorPer').textContent = data[melhorIdx].periodo || '—';
  document.getElementById('secCertUlt').textContent    = ultima.cert_solicitados || '—';
  document.getElementById('secCertTotal').textContent  = `Total 2026: ${totalCerts}`;
  document.getElementById('secSemanas').textContent    = data.length;

  /* ── Resumo Anual ── */
  const projecao = Math.round(mediaFat * 52);
  document.getElementById('annualFat').textContent    = fmtK(totalFat);
  document.getElementById('annualProj').textContent   = fmtK(projecao);
  document.getElementById('annualAlunos').textContent = totalAlunos.toLocaleString('pt-BR');
  document.getElementById('annualProvas').textContent = totalProvas.toLocaleString('pt-BR');
  document.getElementById('annualCerts').textContent  = totalCerts.toLocaleString('pt-BR');

  /* ── Last update ── */
  const ultima_dt = new Date(ultima.semana_inicio + 'T00:00:00');
  document.getElementById('lastUpdate').textContent =
    'Atualizado: ' + ultima_dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  /* ── Sazonalidade ── */
  checkSazonalidade();

  /* ── Gráfico: Provas por semana (PRINCIPAL) ── */
  if (charts.provas) charts.provas.destroy();
  charts.provas = new Chart(document.getElementById('chartProvas'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Provas vendidas',
        data: provas,
        backgroundColor: provas.map(v =>
          v >= mediaProvas ? 'rgba(0,212,255,0.7)' : 'rgba(45,110,245,0.55)'
        ),
        borderRadius: 5,
      }]
    },
    options: {
      ...chartDefaults,
      plugins: {
        ...chartDefaults.plugins,
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} provas` } }
      },
      scales: {
        x: { ...chartDefaults.scales.x },
        y: { ...chartDefaults.scales.y }
      }
    }
  });

  /* ── Gráfico: Faturamento semanal ── */
  if (charts.fat) charts.fat.destroy();
  charts.fat = new Chart(document.getElementById('chartFat'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Faturamento',
        data: fats,
        backgroundColor: 'rgba(45,110,245,0.65)',
        borderRadius: 5,
      }]
    },
    options: {
      ...chartDefaults,
      plugins: { legend: { display: false } },
      scales: {
        x: { ...chartDefaults.scales.x },
        y: {
          ...chartDefaults.scales.y,
          ticks: { ...chartDefaults.scales.y.ticks, callback: v => 'R$' + (v / 1000) + 'k' }
        }
      }
    }
  });

  /* ── Gráfico: Alunos por semana ── */
  if (charts.alunos) charts.alunos.destroy();
  charts.alunos = new Chart(document.getElementById('chartAlunos'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Alunos',
        data: alunos,
        borderColor: 'rgba(0,212,255,0.85)',
        backgroundColor: 'rgba(0,212,255,0.07)',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: 'rgba(0,212,255,1)',
        tension: 0.35,
        fill: true
      }]
    },
    options: { ...chartDefaults, plugins: { legend: { display: false } } }
  });

  /* ── Gráfico: Faturamento mensal ── */
  const mesesMap = {};
  data.forEach(d => {
    const dt  = new Date(d.semana_inicio + 'T00:00:00');
    const key = dt.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    mesesMap[key] = (mesesMap[key] || 0) + d.faturamento;
  });

  if (charts.mensal) charts.mensal.destroy();
  charts.mensal = new Chart(document.getElementById('chartMensal'), {
    type: 'bar',
    data: {
      labels:   Object.keys(mesesMap),
      datasets: [{
        label: 'Faturamento Mensal',
        data:  Object.values(mesesMap),
        backgroundColor: 'rgba(0,212,255,0.45)',
        borderRadius: 6
      }]
    },
    options: {
      ...chartDefaults,
      plugins: { legend: { display: false } },
      scales: {
        x: { ...chartDefaults.scales.x },
        y: {
          ...chartDefaults.scales.y,
          ticks: { ...chartDefaults.scales.y.ticks, callback: v => 'R$' + (v / 1000) + 'k' }
        }
      }
    }
  });

  /* ── Tabela ── */
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = [...data].reverse().map((d, i) => {
    const idx = data.length - 1 - i;
    const prev = idx > 0 ? data[idx - 1] : null;

    const varFat    = prev ? varPct(d.faturamento, prev.faturamento) : null;
    const varProvas = prev ? varPct(d.provas || 0, prev.provas || 0) : null;
    const varAlunos = prev ? varPct(d.alunos || 0, prev.alunos || 0) : null;

    return `<tr>
      <td class="periodo-cell">${d.periodo || d.semana_inicio}</td>
      <td>${d.provas || '—'}</td>
      <td>${badgeVar(varProvas)}</td>
      <td>${d.alunos || '—'}</td>
      <td>${badgeVar(varAlunos)}</td>
      <td>${fmt(d.faturamento)}</td>
      <td>${badgeVar(varFat)}</td>
      <td>${d.cert_solicitados || '—'}</td>
    </tr>`;
  }).join('');
}

/* ── Load Supabase ── */
async function loadData() {
  document.getElementById('loadingBadge').classList.add('show');

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/sn_semanas?select=*&order=semana_inicio.asc`,
      {
        headers: {
          apikey:        SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);

    const data = await res.json();

    if (!data.length) throw new Error('Nenhum dado encontrado na tabela sn_semanas.');

    document.getElementById('loadingBadge').classList.remove('show');
    render(data);

  } catch (e) {
    document.getElementById('loadingBadge').classList.remove('show');
    const err = document.getElementById('errorMsg');
    err.style.display = 'block';
    err.textContent = '⚠️ Erro ao carregar dados: ' + e.message +
      '. Verifique se a tabela sn_semanas existe no Supabase e se as credenciais estão corretas.';
  }
}

/* ── Init ── */
loadData();