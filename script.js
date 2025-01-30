const cycles = {
    intellectual: { label: 'Интеллектуальный', color: '#007bff', description: '33-дневный биоритм.' },
    emotional: { label: 'Эмоциональный', color: '#dc3545', description: '28-дневный биоритм.' },
    physical: { label: 'Физический', color: '#28a745', description: '23-дневный биоритм.' },
    blood: { label: 'Кровь', color: '#ffc107', description: 'Цикл крови.' },
    fate: { label: 'Судьбы и воли', color: '#17a2b8', description: 'Цикл судьбы.' },
    hormones: { label: 'Гормоны', color: '#e83e8c', description: 'Цикл гормонов (только для женщин).' },
};

let startDate = new Date();
let charts = {};
let previousCycle = null;

const FATE_PERIOD_YEARS = 12;
const DAYS_IN_YEAR = 365.25;
const DAYS_IN_WEEK = 7;

const SATURN_PERIOD_YEARS = 29.5; // Цикл Сатурна

// События при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    generateCheckboxes();
    updateWeekRange();
});

function generateCheckboxes() {
    const container = document.getElementById('checkboxContainer');
    Object.entries(cycles).forEach(([id, cycle]) => {
        container.innerHTML += `
            <div class="form-check cycle-checkbox">
                <input type="checkbox" class="form-check-input" id="${id}" onchange="toggleCycle(this)">
                <label class="form-check-label" for="${id}">
                    ${cycle.label} <span class="cycle-line" style="background-color: ${cycle.color};"></span>
                </label>
            </div>`;
    });
}

function formatDate(date) {
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function updateWeekRange() {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    document.getElementById('weekRange').innerText = `${formatDate(startDate)} — ${formatDate(endDate)}`;
}

function prevWeek() {
    startDate.setDate(startDate.getDate() - 7);
    updateWeekRange();
    updateCharts();
}

function nextWeek() {
    startDate.setDate(startDate.getDate() + 7);
    updateWeekRange();
    updateCharts();
}

function openAddModal() {
    $('#addModal').modal('show');
}

function closeAddModal() {
    $('#addModal').modal('hide');
}

function addPartner() {
    const name = document.getElementById('partnerName').value || `Партнёр ${Object.keys(charts).length + 1}`;
    const birthDate = document.getElementById('birthDate').value;
    const gender = document.querySelector('input[name="gender"]:checked').value;
    const chartId = `chart-${name.replace(/\s/g, '-')}`;
    const chartsContainer = document.getElementById('chartsContainer');

    const chartContainer = document.createElement('div');
    chartContainer.id = chartId;
    chartContainer.style.height = '250px';
    chartContainer.classList.add('chart-container');

    const title = document.createElement('h5');
    title.textContent = name + ' (' + gender + ')';

    const detailsButton = document.createElement('button');
    detailsButton.className = 'btn btn-lg ml-4';
    detailsButton.innerHTML = '<i class="bi bi-info-circle"></i>';
    detailsButton.onclick = () => openMacroCycleModal(name, birthDate, gender);

    const header = document.createElement('div');
    header.className = 'd-flex justify-content-end align-items-center mb-2';
    header.appendChild(title);
    header.appendChild(detailsButton);

    chartsContainer.appendChild(header);
    chartsContainer.appendChild(chartContainer);

    const chart = new ApexCharts(chartContainer, {
        chart: { type: 'line', animations: { enabled: true } },
        xaxis: { categories: Array.from({ length: 7 }, (_, i) => `День ${i + 1}`) },
        yaxis: { min: -1, max: 1, decimalsInFloat: 2 },
        series: [],
    });
    chart.render();

    charts[chartId] = { chart, name, birthDate, gender };
    closeAddModal();
}

function toggleCycle(checkbox) {
    if (checkbox.id === 'fate') {
        if (checkbox.checked) {
            previousCycle = [...document.querySelectorAll('.cycle-checkbox input:not(#fate):checked')].map(input => input.id);
            document.querySelectorAll('.cycle-checkbox input:not(#fate)').forEach(input => {
                input.checked = false;
                input.disabled = true;
            });
        } else {
            document.querySelectorAll('.cycle-checkbox input:not(#fate)').forEach(input => (input.disabled = false));
            previousCycle.forEach(id => document.getElementById(id).checked = true);
        }
    }
    updateCharts();
}

function updateCharts() {
    const activeCycles = Object.keys(cycles).filter(id => document.getElementById(id).checked);
    Object.entries(charts).forEach(([chartId, { chart, birthDate, gender }]) => {
        // Проверка, чтобы не строить график для 'blood', если пол 'male'
        const filteredCycles = activeCycles.filter(cycleId => !(cycleId === 'blood' && gender === 'male'));

        if (activeCycles.includes('fate')) {
            const years = Array.from({ length: FATE_PERIOD_YEARS }, (_, i) => `Год ${i + 1}`);
            const fateSeries = [
                {
                    name: 'Судьбы',
                    data: generateFateData('fate', FATE_PERIOD_YEARS, birthDate),
                    color: cycles.fate.color
                },
                {
                    name: 'Воли',
                    data: generateFateData('will', FATE_PERIOD_YEARS, birthDate),
                    color: '#6c757d'
                },
            ];
            chart.updateOptions({ 
                xaxis: { categories: years },
                yaxis: { min: -1, max: 1, decimalsInFloat: 2 }
            });
            chart.updateSeries(fateSeries);
        } else {
            const series = filteredCycles.map(cycleId => ({
                name: cycles[cycleId].label,
                data: generateCycleData(cycleId, DAYS_IN_WEEK, birthDate),
                color: cycles[cycleId].color,
            }));
            chart.updateOptions({ 
                xaxis: { categories: Array.from({ length: 7 }, (_, i) => `День ${i + 1}`) },
                yaxis: { min: -1, max: 1, decimalsInFloat: 2 }
            });
            chart.updateSeries(series);
        }
    });
}

function generateCycleData(cycleId, days, birthDate) {
    const startDay = new Date(startDate);
    const cycleLength = { physical: 23, emotional: 28, intellectual: 33, blood: 35, fate: 40, hormones: 32 }[cycleId];
    return Array.from({ length: days }, (_, i) => {
        const dayOffset = Math.floor((new Date(startDay).getTime() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24)) + i;
        return Math.sin((2 * Math.PI * dayOffset) / cycleLength);
    });
}

function generateFateData(type, years, birthDate) {
    const cycleLength = type === 'fate' ? FATE_PERIOD_YEARS : SATURN_PERIOD_YEARS; // 12 лет для судьбы, 29.5 лет для воли
    const startDay = new Date(birthDate);
    return Array.from({ length: years }, (_, i) => {
        const yearOffset = i * DAYS_IN_YEAR;
        return Math.sin((2 * Math.PI * (yearOffset + startDay.getTime() / (1000 * 60 * 60 * 24))) / (cycleLength * DAYS_IN_YEAR));
    });
}

function openMacroCycleModal(name, birthDate, gender) {
    const birthDateObj = new Date(birthDate);
    const macroCycles = [
        { name: 'Юпитер', period: 12 },
        { name: 'Сатурн', period: 29.5 },
        { name: 'Уран', period: 84 },
        { name: 'Нептун', period: 165 }
    ];

    const macroModalContent = macroCycles.map(cycle => {
        const nextOccurrenceYear = birthDateObj.getFullYear() + Math.ceil((new Date().getFullYear() - birthDateObj.getFullYear()) / cycle.period) * cycle.period;
        const nextOccurrenceDate = new Date(birthDateObj);
        nextOccurrenceDate.setFullYear(nextOccurrenceYear);
        return `
            <li>
                <strong>${cycle.name}:</strong> цикл длится ${cycle.period} лет. Следующее наступление: ${formatDate(nextOccurrenceDate)}
            </li>`;
    }).join('');

    const modalBody = document.getElementById('macroModalBody');
    modalBody.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h5>Макроциклы для: ${name}</h5>
            </div>
            <div class="modal-body">        
                <p><strong>Дата рождения:</strong> ${formatDate(new Date(birthDate))}<br><strong>Пол:</strong> ${gender}</p>
                <ul>${macroModalContent}</ul>
            </div>
        </div>
    `;

    $('#macroModal').modal('show');
}
