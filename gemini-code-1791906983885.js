// ==========================================
// ESTADO GLOBAL DO CALENDÁRIO
// ==========================================
let currentDate = new Date();
let reservasData = {}; // Estrutura: { 'YYYY-MM-DD': { nome, telefone, obs } }
let selectedDateStr = "";

const DIAS_SEMANA = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// Elementos da DOM
const monthYearTitle = document.getElementById("monthYearTitle");
const calendarGrid = document.getElementById("calendarGrid");
const btnPrev = document.getElementById("btnPrev");
const btnNext = document.getElementById("btnNext");

// Modal de Reserva
const modalReserva = document.getElementById("modalReserva");
const modalDateInfo = document.getElementById("modalDateInfo");
const formReserva = document.getElementById("formReserva");
const inputNome = document.getElementById("inputNome");
const inputTelefone = document.getElementById("inputTelefone");
const inputObs = document.getElementById("inputObs");
const btnFecharModal = document.getElementById("btnFecharModal");

// Modal de Detalhes
const modalDetalhes = document.getElementById("modalDetalhes");
const detalhesData = document.getElementById("detalhesData");
const detalhesNome = document.getElementById("detalhesNome");
const detalhesTelefone = document.getElementById("detalhesTelefone");
const detalhesObs = document.getElementById("detalhesObs");
const btnWhatsapp = document.getElementById("btnWhatsapp");
const btnCancelarReserva = document.getElementById("btnCancelarReserva");
const btnFecharDetalhes = document.getElementById("btnFecharDetalhes");

// ==========================================
// CARREGAR E SALVAR NO LOCALSTORAGE
// ==========================================
function carregarReservas() {
  const dadosSalvos = localStorage.getItem("reservas_salao");
  if (dadosSalvos) {
    reservasData = JSON.parse(dadosSalvos);
  }
}

function salvarReservas() {
  localStorage.setItem("reservas_salao", JSON.stringify(reservasData));
}

// ==========================================
// RENDERIZAÇÃO DO CALENDÁRIO
// ==========================================
function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  monthYearTitle.innerText = `${MESES[month]} ${year}`;
  calendarGrid.innerHTML = "";

  // 1. Renderiza cabeçalhos dos dias da semana
  DIAS_SEMANA.forEach(dia => {
    const headerCell = document.createElement("div");
    headerCell.className = "weekday-header";
    headerCell.innerText = dia;
    calendarGrid.appendChild(headerCell);
  });

  // 2. Cálculo de dias do mês
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  // Dias do mês anterior
  for (let i = firstDayIndex; i > 0; i--) {
    const dayNum = prevMonthTotalDays - i + 1;
    calendarGrid.appendChild(createCell(dayNum, true));
  }

  // Dias do mês atual
  for (let day = 1; day <= totalDays; day++) {
    const formattedMonth = String(month + 1).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");
    const dateKey = `${year}-${formattedMonth}-${formattedDay}`;

    calendarGrid.appendChild(createCell(day, false, dateKey));
  }

  // Dias do próximo mês para fechar a grade
  const totalCellsSoFar = firstDayIndex + totalDays;
  const nextDaysNeed = totalCellsSoFar > 35 ? 42 - totalCellsSoFar : 35 - totalCellsSoFar;

  for (let i = 1; i <= nextDaysNeed; i++) {
    calendarGrid.appendChild(createCell(i, true));
  }
}

// Criar Célula Individual
function createCell(dayNumber, isOtherMonth, dateKey = null) {
  const cell = document.createElement("div");
  cell.className = "day-cell";

  if (isOtherMonth) {
    cell.classList.add("other-month");
    cell.innerHTML = `<span class="day-number">${dayNumber}</span>`;
    return cell;
  }

  const reserva = dateKey ? reservasData[dateKey] : null;

  if (reserva) {
    // RESERVADO -> BLOCO VERMELHO AUTOMÁTICO
    cell.classList.add("reserved");
    cell.innerHTML = `
      <span class="day-number">${dayNumber}</span>
      <div class="status-tag">RESERVADO</div>
      <div class="person-name">${reserva.nome}</div>
    `;
    cell.addEventListener("click", () => abrirModalDetalhes(dateKey, reserva));
  } else {
    // LIVRE -> FUNDO BRANCO
    cell.classList.add("free");
    cell.innerHTML = `
      <span class="day-number">${dayNumber}</span>
      <div class="status-tag">LIVRE</div>
    `;
    cell.addEventListener("click", () => abrirModalReserva(dateKey));
  }

  return cell;
}

// ==========================================
// MODAIS E AÇÕES DE RESERVA
// ==========================================
function abrirModalReserva(dateKey) {
  selectedDateStr = dateKey;
  const [year, month, day] = dateKey.split("-");
  modalDateInfo.innerText = `Data: ${day}/${month}/${year}`;
  formReserva.reset();
  modalReserva.classList.remove("hidden");
}

function fecharModalReserva() {
  modalReserva.classList.add("hidden");
}

function abrirModalDetalhes(dateKey, reserva) {
  selectedDateStr = dateKey;
  const [year, month, day] = dateKey.split("-");
  detalhesData.innerText = `Data: ${day}/${month}/${year}`;
  detalhesNome.innerText = reserva.nome || "Não informado";
  detalhesTelefone.innerText = reserva.telefone || "Não informado";
  detalhesObs.innerText = reserva.obs || "Nenhuma";

  const numLimpo = (reserva.telefone || "").replace(/\D/g, "");
  if (numLimpo) {
    btnWhatsapp.href = `https://wa.me/55${numLimpo}?text=Olá%20${encodeURIComponent(reserva.nome)},%20falo%20sobre%20a%20reserva%20do%20salão%20dia%20${day}/${month}`;
    btnWhatsapp.style.display = "block";
  } else {
    btnWhatsapp.style.display = "none";
  }

  modalDetalhes.classList.remove("hidden");
}

function fecharModalDetalhes() {
  modalDetalhes.classList.add("hidden");
}

// Confirmar Reserva
formReserva.addEventListener("submit", (e) => {
  e.preventDefault();
  const nome = inputNome.value.trim();
  const telefone = inputTelefone.value.trim();
  const obs = inputObs.value.trim();

  if (!nome || !telefone) return;

  reservasData[selectedDateStr] = {
    nome,
    telefone,
    obs,
    criadoEm: new Date().toISOString()
  };

  salvarReservas();
  renderCalendar();
  fecharModalReserva();
});

// Cancelar Reserva
btnCancelarReserva.addEventListener("click", () => {
  if (!confirm("Tem certeza que deseja cancelar e liberar esta data?")) return;

  delete reservasData[selectedDateStr];
  salvarReservas();
  renderCalendar();
  fecharModalDetalhes();
});

// Controles de Navegação de Mês
btnPrev.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
});

btnNext.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
});

btnFecharModal.addEventListener("click", fecharModalReserva);
btnFecharDetalhes.addEventListener("click", fecharModalDetalhes);

window.addEventListener("click", (e) => {
  if (e.target === modalReserva) fecharModalReserva();
  if (e.target === modalDetalhes) fecharModalDetalhes();
});

// Iniciar Aplicação
carregarReservas();
renderCalendar();