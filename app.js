// ==========================================
// CONFIGURAÇÃO DO FIREBASE (NUVEM EM TEMPO REAL)
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAhbmOpnA0NNwMn92RGuPt1ZB3Bz7_ckvM",
  authDomain: "salao-familiar.firebaseapp.com",
  projectId: "salao-familiar",
  storageBucket: "salao-familiar.firebasestorage.app",
  messagingSenderId: "85299228047",
  appId: "1:85299228047:web:5bdbdff1264ffdbd36affa"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==========================================
// ESTADO GLOBAL DO CALENDÁRIO
// ==========================================
let currentDate = new Date();
let reservasData = {}; // Será preenchido automaticamente pelo Firebase
let selectedDateStr = "";

const DIAS_SEMANA = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// ==========================================
// ELEMENTOS DA DOM
// ==========================================
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
// CONEXÃO COM BANCO DE DADOS EM TEMPO REAL
// ==========================================
function iniciarEscutaReservas() {
  // Escuta a coleção 'reservas'. Sempre que alguém adicionar, alterar ou remover
  // uma reserva, esta função roda automaticamente para todos os usuários logados.
  onSnapshot(collection(db, "reservas"), (snapshot) => {
    reservasData = {}; // Limpa o objeto local
    
    snapshot.forEach((documento) => {
      // O ID do documento é a própria data (ex: '2024-05-15')
      reservasData[documento.id] = documento.data(); 
    });
    
    renderCalendar(); // Re-renderiza o calendário com os dados atualizados
  });
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

  // --- NOVA LÓGICA: Verificar se o dia já passou ---
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0); // Zera as horas para comparar apenas o dia
  
  const [ano, mes, dia] = dateKey.split("-");
  const dataDaCelula = new Date(ano, mes - 1, dia); // mes - 1 porque no JavaScript os meses vão de 0 a 11
  dataDaCelula.setHours(0, 0, 0, 0);

  const isPassado = dataDaCelula < hoje; // Retorna true se a data for antes de hoje
  // ------------------------------------------------

  if (reserva) {
    cell.classList.add("reserved");
    if (isPassado) cell.classList.add("past-date"); // Adiciona classe para mudar a cor via CSS se quiser

    cell.innerHTML = `
      <span class="day-number">${dayNumber}</span>
      <div class="status-tag">RESERVADO</div>
      <div class="person-name">${reserva.nome}</div>
    `;
    // Deixamos clicar para ver os detalhes da reserva, mesmo que já tenha passado
    cell.addEventListener("click", () => abrirModalDetalhes(dateKey, reserva));
  } else {
    if (isPassado) {
      // DATA PASSADA SEM RESERVA: Não pode reservar mais
      cell.classList.add("past-date");
      cell.innerHTML = `
        <span class="day-number">${dayNumber}</span>
        <div class="status-tag" style="background-color: #e0e0e0; color: #7a7a7a;">PASSOU</div>
      `;
      // Perceba que NÃO adicionamos o evento de clique (addEventListener) aqui.
      // Assim, quando a pessoa clica, nada acontece.
    } else {
      // DATA FUTURA/HOJE LIVRE: Pode reservar
      cell.classList.add("free");
      cell.innerHTML = `
        <span class="day-number">${dayNumber}</span>
        <div class="status-tag">LIVRE</div>
      `;
      cell.addEventListener("click", () => abrirModalReserva(dateKey));
    }
  }

  return cell;
}

// ==========================================
// MODAIS
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

// ==========================================
// AÇÕES DE RESERVA NO BANCO DE DADOS
// ==========================================

// Criar Reserva
formReserva.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nome = inputNome.value.trim();
  const telefone = inputTelefone.value.trim();
  const obs = inputObs.value.trim();

  if (!nome || !telefone) return;

  const novaReserva = {
    nome,
    telefone,
    obs,
    criadoEm: new Date().toISOString()
  };

  try {
    // Salva no banco de dados usando a data como ID do documento
    await setDoc(doc(db, "reservas", selectedDateStr), novaReserva);
    fecharModalReserva();
  } catch (error) {
    console.error("Erro ao salvar reserva:", error);
    alert("Ocorreu um erro ao salvar sua reserva. Tente novamente.");
  }
});

// Cancelar Reserva
btnCancelarReserva.addEventListener("click", async () => {
  if (!confirm("Tem certeza que deseja cancelar e liberar esta data?")) return;

  try {
    // Exclui a reserva do banco de dados com base na data
    await deleteDoc(doc(db, "reservas", selectedDateStr));
    fecharModalDetalhes();
  } catch (error) {
    console.error("Erro ao cancelar reserva:", error);
    alert("Ocorreu um erro ao cancelar. Tente novamente.");
  }
});

// ==========================================
// NAVEGAÇÃO E EVENTOS DE JANELA
// ==========================================
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

// Iniciar Aplicação: 
// 1. Liga o listener do banco de dados (que também chama o renderCalendar)
iniciarEscutaReservas();
