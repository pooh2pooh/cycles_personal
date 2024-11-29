const cycles = {
    intellectual: {
        label: 'Интеллектуальный',
        color: '#007bff',
        description: '33-дневный биоритм, который определяет творческую способность личности.',
    },
    emotional: {
        label: 'Эмоциональный',
        color: '#dc3545',
        description: '28-дневный биоритм, который влияет на настроение и эмоциональное состояние.',
    },
    physical: {
        label: 'Физический',
        color: '#28a745',
        description: '23-дневный цикл, отражающий физическое состояние организма.',
    },
    blood: {
        label: 'Цикл крови',
        color: '#ffc107',
        description: 'Определяет особенности изменений в состоянии кровеносной системы.',
    },
    fate: {
        label: 'Судьбы и воли',
        color: '#17a2b8',
        description: 'Методика на основе знания о 12-летнем цикле судьбы и воли человека.',
    },
    jupiter: {
        label: 'Цикл Юпитера (12 лет)',
        color: '#6f42c1',
        description: 'Каждые 12 лет человек начинает новый жизненный этап. Важно учитывать ключевые годы.',
    },
    lunarNodes: {
        label: 'Лунные узлы (19 лет)',
        color: '#e83e8c',
        description: 'Основные кармические задачи, происходящие каждые 18-19 лет.',
    },
    saturn: {
        label: 'Цикл Сатурна (29,5 лет)',
        color: '#343a40',
        description: 'Цикл зрелости, кризиса и нового этапа жизни, повторяется раз в 29,5 лет.',
    },
    sunMacro: {
        label: 'Макроцикл Солнца (11 лет)',
        color: '#fd7e14',
        description: 'Обозначает важные 11-летние социальные и карьерные периоды.',
    },
};

let startDate = new Date();
let partnerCount = 1;
let charts = {};

document.addEventListener('DOMContentLoaded', () => {
    generateCheckboxes();
    updateWeekRange();
});

function generateCheckboxes() {
    const container = document.getElementById('checkboxContainer');
    for (const [id, cycle] of Object.entries(cycles)) {
        container.innerHTML += `
            <div class="form-check">
                <input type="checkbox" class="form-check-input" id="${id}" onchange="toggleCycle(this)">
                <label class="form-check-label" for="${id}">
                    ${cycle.label} <span class="cycle-line" style="background-color: ${cycle.color};"></span>
                </label>
            </div>`;
    }
}

function formatDate(date) {
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function updateWeekRange() {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7);
    document.getElementById('weekRange').innerText = `${formatDate(startDate)} — ${formatDate(endDate)}`;
}

function prevWeek() {
    startDate.setDate(startDate.getDate() - 7);
    updateWeekRange(); // Обновляем диапазон дат
    updateCharts(); // Обновляем графики для новой недели
}

function nextWeek() {
    startDate.setDate(startDate.getDate() + 7);
    updateWeekRange(); // Обновляем диапазон дат
    updateCharts(); // Обновляем графики для новой недели
}

// Обновление графика
function updateCharts() {
    const selectedCycles = Object.keys(cycles).filter(id => document.getElementById(id)?.checked);

    // Для каждого графика партнера обновляем данные
    Object.entries(charts).forEach(([chartId, { chart, birthDate }]) => {
        const series = selectedCycles.flatMap(cycleId => {
            const data = generateCycleData(cycleId, 7, birthDate, startDate); // Передаем startDate для корректного расчета

            if (cycleId === 'fate') {
                return [
                    { name: 'Судьба', data: data.fate, color: '#17a2b8' },
                    { name: 'Воля', data: data.will, color: '#6f42c1' },
                ];
            } else {
                return {
                    name: cycles[cycleId].label,
                    data: data, // Данные только на 7 дней
                    color: cycles[cycleId].color,
                };
            }
        });

        if (chart) {
            chart.updateOptions({
                series,
                xaxis: {
                    categories: Array.from({ length: 7 }, (_, i) => `День ${i + 1}`), // Ось X с днями
                    tickAmount: 6, // Равномерное распределение меток
                    labels: {
                        show: true,
                        rotate: 0,
                        style: { fontSize: '12px' },
                    },
                },
            });
        } else {
            console.error(`Chart with id ${chartId} not found`);
        }
    });
}

// Функция генерации данных для цикла с учетом startDate
function generateCycleData(cycleId, days, birthDate, startDate) {
    const periods = {
        intellectual: 33,
        emotional: 28,
        physical: 23,
        blood: 37,
        fate: 12 * 365, // 12 лет
        jupiter: 12 * 365, // 12 лет
        lunarNodes: 19 * 365, // 19 лет
        saturn: 29.5 * 365, // 29.5 лет
        sunMacro: 11 * 365, // 11 лет
    };

    const period = periods[cycleId];
    if (!period) return []; // Если период не найден

    const daysSinceBirth = Math.floor((startDate - birthDate) / (1000 * 60 * 60 * 24)); // Дни с даты рождения относительно startDate

    // Для цикла Судьбы и Воли генерируем две линии
    if (cycleId === 'fate') {
        return {
            fate: Array.from({ length: days }, (_, day) => {
                const x = day;
                const y = Math.sin((2 * Math.PI * (daysSinceBirth + day)) / (12 * 365)) * 100;
                return { x, y: y.toFixed(2) };
            }),
            will: Array.from({ length: days }, (_, day) => {
                const x = day;
                const y = Math.cos((2 * Math.PI * (daysSinceBirth + day)) / (12 * 365)) * 100;
                return { x, y: y.toFixed(2) };
            }),
        };
    }

    // Для остальных циклов одна линия
    return Array.from({ length: days }, (_, day) => {
        const x = day;
        const y = Math.sin((2 * Math.PI * (daysSinceBirth + day)) / period) * 100;
        return { x, y: y.toFixed(2) };
    });
}

function toggleCycle(checkbox) {
    const descContainer = document.getElementById('cycleDescriptions');
    const cycleId = checkbox.id;
    const descId = `desc-${cycleId}`;

    if (checkbox.checked) {
        descContainer.innerHTML += `<p id="${descId}"><b>${cycles[cycleId].label}</b>: ${cycles[cycleId].description}</p>`;
    } else {
        const desc = document.getElementById(descId);
        if (desc) desc.remove();
    }
    updateCharts();
}

function openAddModal() {
    $('#addModal').modal('show');
}

function closeAddModal() {
    $('#addModal').modal('hide');
}

function addPartner() {
    const name = document.getElementById('partnerName').value || `Партнер ${partnerCount++}`;
    const birthDate = new Date(document.getElementById('birthDate').value);
    const sanitizedName = name.replace(/\s+/g, '-');
    const chartsContainer = document.getElementById('chartsContainer');

    // Создаем контейнер для графика
    const chartContainer = document.createElement('div');
    chartContainer.id = sanitizedName;
    chartContainer.style.height = '200px';
    chartsContainer.appendChild(chartContainer);

    // Проверяем, что контейнер успешно добавлен
    if (!document.getElementById(sanitizedName)) {
        console.error('Контейнер для графика не создан!');
        return;
    }

    // Инициализируем график
    const chart = new ApexCharts(chartContainer, {
        chart: { type: 'line', animations: { enabled: true } },
        xaxis: {
            categories: Array.from({ length: 7 }, (_, i) => `День ${i + 1}`), // Метки для 7 дней
            tickAmount: 6, // Равномерное распределение меток
            labels: {
                show: true,
                rotate: 0, // Отключаем вращение меток
                style: {
                    fontSize: '12px',
                },
            },
        },
        series: []
    });

    chart.render().then(() => {
        charts[sanitizedName] = { chart, birthDate }; // Сохраняем дату рождения партнера
        updateCharts();
    }).catch(err => console.error('Ошибка создания графика:', err));

    closeAddModal();
}
