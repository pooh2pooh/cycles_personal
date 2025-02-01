const cycles = {
    intellectual: { label: 'Интеллектуальный', color: '#007bff', description: '33-дневный биоритм.' },
    emotional: { label: 'Эмоциональный', color: '#dc3545', description: '28-дневный биоритм.' },
    physical: { label: 'Физический', color: '#28a745', description: '23-дневный биоритм.' },
    blood: { label: 'Кровь', color: '#ffc107', description: 'Цикл крови.' },
    fate: { label: 'Судьбы и воли', color: '#17a2b8', description: 'Цикл судьбы.' },
    // hormones: { label: 'Гормоны', color: '#e83e8c', description: 'Цикл гормонов (только для женщин).' },
};

let startDate = new Date();
let charts = {};
let previousCycle = null;

const FATE_PERIOD_YEARS = 12;
const DAYS_IN_YEAR = 365.25;
const DAYS_IN_WEEK = 7;

const SATURN_PERIOD_YEARS = 29.5; // Цикл Сатурна

// Добавляем константу для периода Судьбы и Воли в днях
const FATE_PERIOD_DAYS = FATE_PERIOD_YEARS * DAYS_IN_YEAR;  // 12 лет в днях
const SATURN_PERIOD_DAYS = SATURN_PERIOD_YEARS * DAYS_IN_YEAR;  // 29.5 лет в днях

let startYear = new Date().getFullYear(); // Начальный год, который будем менять




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

function toggleAdditionalDateField() {
    const genderFemale = document.getElementById('genderFemale');
    const additionalDateField = document.getElementById('additionalDateField');

    console.log('Gender Female checked:', genderFemale.checked);  // Логируем состояние радио-кнопки

    if (genderFemale.checked) {
        additionalDateField.style.display = 'block'; // Показываем поле
    } else {
        additionalDateField.style.display = 'none'; // Скрываем поле
    }
}




function formatFullDate(date) {
    const day = date.getDate().toString().padStart(2, '0');  // Добавляем ведущий ноль к дню
    const month = (date.getMonth() + 1).toString().padStart(2, '0');  // Добавляем ведущий ноль к месяцу
    const year = date.getFullYear();  // Год
    return `${day}.${month}.${year}`;  // Форматируем как ДД.ММ.ГГГГ
}

function formatDate(date) {
    const day = date.getDate().toString().padStart(2, '0');  // Добавляем ведущий ноль к дню
    const month = (date.getMonth() + 1).toString().padStart(2, '0');  // Добавляем ведущий ноль к месяцу
    return `${day}.${month}`;
}

// Обновляем диапазон времени
function updateWeekRange() {
    const endDate = new Date(startDate);

    // Если активен график Судьбы или Воли, то диапазон обновляется на 12 лет
    if (document.getElementById('fate').checked) {
        // Переключение диапазона для Судьбы и Воли
        const yearsRange = 12;  // 12 лет для Судьбы и Воли
        endDate.setFullYear(startDate.getFullYear() + yearsRange);
    } else {
        // Для обычных циклов (например, Эмоциональный, Интеллектуальный и т. д.) переключение на 1 месяц
        endDate.setMonth(startDate.getMonth() + 1);
    }

    document.getElementById('weekRange').innerText = `${formatFullDate(startDate)} — ${formatFullDate(endDate)}`;
    updateCharts();  // Обновляем графики при изменении диапазона
}

// Сдвиг диапазона на предыдущую неделю
function prevWeek() {
    if (document.getElementById('fate').checked) {
        startDate.setFullYear(startDate.getFullYear() - 12);  // Для Судьбы сдвигаем на 12 лет
    } else {
        startDate.setDate(startDate.getDate() - 7);  // Для обычных циклов сдвигаем на 7 дней
    }
    updateWeekRange();  // Обновляем диапазон
}

// Сдвиг диапазона на следующую неделю
function nextWeek() {
    if (document.getElementById('fate').checked) {
        startDate.setFullYear(startDate.getFullYear() + 12);  // Для Судьбы сдвигаем на 12 лет
    } else {
        startDate.setDate(startDate.getDate() + 7);  // Для обычных циклов сдвигаем на 7 дней
    }
    updateWeekRange();  // Обновляем диапазон
}

function openAddModal() {
    $('#addModal').modal('show');
}

function closeAddModal() {
    $('#addModal').modal('hide');
}

//
function renderGender(gender) {
    if (gender == 'male') {
        return '🙎‍♂️';
    } else {
        return '🙎‍♀️';
    }
}

function addPartner() {
    const name = document.getElementById('partnerName').value || `Партнёр ${Object.keys(charts).length + 1}`;
    const birthDate = document.getElementById('birthDate').value;
    const gender = document.querySelector('input[name="gender"]:checked').value;
    const additionalDate = document.getElementById('additionalDate').value;
    const chartId = `chart-${name.replace(/\s/g, '-')}`;
    const chartsContainer = document.getElementById('chartsContainer');

    const chartContainer = document.createElement('div');
    chartContainer.id = chartId;
    chartContainer.style.height = '250px';
    chartContainer.classList.add('chart-container');

    const title = document.createElement('h5');
    title.textContent = renderGender(gender) + ' ' + name;

    const detailsButton = document.createElement('button');
    detailsButton.className = 'btn btn-lg ml-4';
    detailsButton.innerHTML = '<i class="bi bi-info-circle"></i>';
    detailsButton.onclick = () => openMacroCycleModal(name, birthDate, gender, additionalDate);

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

    charts[chartId] = { chart, name, birthDate, gender, additionalDate };
    closeAddModal();

    // ✅ Автоматическое сохранение, если чекбокс включён
    savePartners();
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
    updateWeekRange();
}

function updateCharts() {
    const activeCycles = Object.keys(cycles).filter(id => document.getElementById(id).checked);
    Object.entries(charts).forEach(([chartId, { chart, birthDate, gender }]) => {
        const filteredCycles = activeCycles.filter(cycleId => !(cycleId === 'blood' && gender === 'male'));

        if (activeCycles.includes('fate')) {
            const fateData = generateFateData('fate', startDate, FATE_PERIOD_YEARS, birthDate);
            const willData = generateFateData('will', startDate, FATE_PERIOD_YEARS, birthDate);

            // Генерируем годы с учётом startDate
            const years = Array.from({ length: FATE_PERIOD_YEARS }, (_, i) => startDate.getFullYear() + i);

            chart.updateOptions({
                xaxis: { 
                    categories: years,
                    labels: { 
                        style: {
                            fontSize: '12px',
                        },
                        formatter: (val) => Math.round(val) // Отображаем только целые года
                    }
                },
                yaxis: { min: -1, max: 1, decimalsInFloat: 2 }
            });

            chart.updateSeries([
                {
                    name: 'Судьбы',
                    data: fateData.map(data => data.value),
                    color: cycles.fate.color
                },
                {
                    name: 'Воли',
                    data: willData.map(data => data.value),
                    color: '#6c757d'
                },
            ]);
        } else {
            const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
            const dates = Array.from({ length: daysInMonth }, (_, i) => {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + i);
                return formatDate(currentDate);
            });

            const series = filteredCycles.map(cycleId => ({
                name: cycles[cycleId].label,
                data: generateCycleData(cycleId, daysInMonth, birthDate),
                color: cycles[cycleId].color,
            }));

            chart.updateOptions({
                xaxis: { categories: dates },
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

// Генерация данных для Судьбы и Воли с динамическим диапазоном времени
function generateFateData(type, startDate, yearsRange, birthDate) {
    const cycleLength = type === 'fate' ? FATE_PERIOD_YEARS : SATURN_PERIOD_YEARS; // 12 лет для судьбы, 29.5 лет для воли
    const birthDateObj = new Date(birthDate);

    // Рассчитываем, сколько лет прошло с даты рождения
    const yearOffset = Math.floor((startDate.getFullYear() - birthDateObj.getFullYear()) / cycleLength);

    return Array.from({ length: yearsRange }, (_, i) => {
        const year = birthDateObj.getFullYear() + i;
        const value = Math.sin((2 * Math.PI * (i + yearOffset)) / cycleLength); // Генерация значений для цикла

        return {
            year: year,
            value: value
        };
    });
}

function openMacroCycleModal(name, birthDate, gender, additionalDate) {
    const birthDateObj = new Date(birthDate);
    const additionalDateObj = new Date(additionalDate);
    const today = new Date();
    
    const macroCycles = [
        { name: 'Юпитер', period: 12, duration: 4 },
        { name: 'Лунные узлы', period: 9 },
        { name: 'Северный узел + Южный узел', period: 19 },
        { name: 'Сатурн', period: 29.5 },
        { name: 'Макроцикл Солнца', period: 11 }
    ];
    
    function calculateRemainingTime(nextOccurrenceDate) {
        const diff = nextOccurrenceDate - today;
        const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
        const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30));
        const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24));
        return `${years} лет, ${months} месяцев, ${days} дней`;
    }
    
    function getNextOccurrences(birthDateObj, cycle) {
        const nextOccurrenceYear = birthDateObj.getFullYear() + Math.ceil((today.getFullYear() - birthDateObj.getFullYear()) / cycle.period) * cycle.period;
        const nextOccurrenceDate = new Date(birthDateObj);
        nextOccurrenceDate.setFullYear(nextOccurrenceYear);
        return { year: nextOccurrenceYear, date: nextOccurrenceDate, remainingTime: calculateRemainingTime(nextOccurrenceDate) };
    }
    

    let additionalDateText = '';
    if (!isNaN(additionalDateObj)) {
        additionalDateText = '<strong>Окончание месячных:</strong> ' + formatFullDate(additionalDateObj);

        // Создаём новый объект Date, чтобы не изменять исходную дату
        let additionalDateObj2 = new Date(additionalDateObj);
        additionalDateObj2.setDate(additionalDateObj2.getDate() + 14); // Прибавляем 14 дней

        // Отображаем дату ПМС
        additionalDateText += '<br><button type="button" class="btn btn-light btn-sm w-100" data-bs-toggle="modal" data-bs-target="#modalFemale1"><strong>Предменструальная фаза (ПМС) — Лютеиновая фаза:</strong> ' + formatFullDate(additionalDateObj2) + '</button>';

        // Создаём новый объект Date, чтобы не изменять исходную дату
        let additionalDateObj3 = new Date(additionalDateObj);
        additionalDateObj3.setDate(additionalDateObj3.getDate() - 7);
        let additionalDateObj4 = new Date(additionalDateObj);
        additionalDateObj4.setDate(additionalDateObj4.getDate() + 7);

        // Отображаем дату периода Овуляции
        additionalDateText += '<br><button type="button" class="btn btn-light btn-sm w-100" data-bs-toggle="modal" data-bs-target="#modalFemale2"><strong>Овуляторная фаза:</strong> ' + formatFullDate(additionalDateObj3) + ' — ' + formatFullDate(additionalDateObj4) + '</button>';

        // Создаём новый объект Date, чтобы не изменять исходную дату
        let additionalDateObj5 = new Date(additionalDateObj);
        additionalDateObj5.setDate(additionalDateObj5.getDate() + 36);

        // Отображаем дату периода Овуляции
        additionalDateText += '<br><button type="button" class="btn btn-light btn-sm w-100" data-bs-toggle="modal" data-bs-target="#modalFemale3"><strong>Постменструальная (эстрогенная) фаза — Фолликулярная фаза:</strong> ' + formatFullDate(additionalDateObj5) + '</button>';

        // Создаём новый объект Date, чтобы не изменять исходную дату
        let additionalDateObj6 = new Date(additionalDateObj);
        additionalDateObj6.setDate(additionalDateObj6.getDate() + 30);

        // Отображаем дату периода Овуляции
        additionalDateText += '<br><button type="button" class="btn btn-light btn-sm w-100" data-bs-toggle="modal" data-bs-target="#modalFemale4"><strong>Менструальная фаза:</strong> ' + formatFullDate(additionalDateObj6) + '</button>';
    }

    let modalContent = `<h5 class="text-danger">Макроциклы для: ${name}</h5><p><strong>Дата рождения:</strong> ${formatFullDate(birthDateObj)}<br><strong>Пол:</strong> ${gender}<br>${additionalDateText}</p><ul>`;
    
    macroCycles.forEach(cycle => {
        const nextOccurrence = getNextOccurrences(birthDateObj, cycle);
        modalContent += `<li><strong>${cycle.name}:</strong> цикл ${cycle.period} лет. Следующее наступление: ${formatFullDate(nextOccurrence.date)} (${nextOccurrence.remainingTime})</li>`;
    });
    modalContent += `</ul>`;
    
    if (Object.keys(charts).length > 1) {
        modalContent += `<h5 class="text-danger pt-4">Сравнение с другими партнёрами:</h5><ul>`;
        Object.entries(charts).forEach(([chartId, partner]) => {
            if (partner.name !== name) {
                modalContent += `<li><strong>${partner.name}:</strong> (${partner.gender})<ul>`;
                macroCycles.forEach(cycle => {
                    const nextOccurrence = getNextOccurrences(new Date(partner.birthDate), cycle);
                    modalContent += `<li>${cycle.name}: ${formatFullDate(nextOccurrence.date)} (${nextOccurrence.remainingTime})</li>`;
                });
                modalContent += `</ul></li>`;
            }
        });
        modalContent += `</ul>`;
    }
    
    document.getElementById('macroModalBody').innerHTML = `<div class='modal-content'><div class='modal-header border-0'><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div><div class='modal-body'>${modalContent}</div></div>`;
    $('#macroModal').modal('show');
}


// Функция сохранения партнёров в localStorage
function savePartners() {
    const checkbox = document.getElementById('savePartnersCheckbox');

    if (checkbox.checked) {
        const partnersData = Object.values(charts).map(({ name, birthDate, gender, additionalDate }) => ({
            name,
            birthDate,
            gender,
            additionalDate
        }));

        localStorage.setItem('savedPartners', JSON.stringify(partnersData));
    } else {
        localStorage.removeItem('savedPartners');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    generateCheckboxes();
    updateWeekRange();

    const savedPartners = localStorage.getItem('savedPartners');
    if (savedPartners) {
        JSON.parse(savedPartners).forEach(({ name, birthDate, gender, additionalDate }) => {
            addPartnerFromStorage(name, birthDate, gender, additionalDate);
        });

        // Устанавливаем чекбокс в активное состояние
        document.getElementById('savePartnersCheckbox').checked = true;
    }

    // Вызовем toggle сразу при загрузке страницы для установки состояния
    toggleAdditionalDateField();
});

function addPartnerFromStorage(name, birthDate, gender, additionalDate) {
    const chartId = `chart-${name.replace(/\s/g, '-')}`;
    const chartsContainer = document.getElementById('chartsContainer');

    const chartContainer = document.createElement('div');
    chartContainer.id = chartId;
    chartContainer.style.height = '250px';
    chartContainer.classList.add('chart-container');

    const title = document.createElement('h5');
    title.textContent = renderGender(gender) + ' ' + name;

    const detailsButton = document.createElement('button');
    detailsButton.className = 'btn btn-lg ml-4';
    detailsButton.innerHTML = '<i class="bi bi-info-circle"></i>';
    detailsButton.onclick = () => openMacroCycleModal(name, birthDate, gender, additionalDate);

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

    charts[chartId] = { chart, name, birthDate, gender, additionalDate };
}
