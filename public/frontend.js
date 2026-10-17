const EVENT_ID = 5;
let kursiTerpilihId = null;

document.addEventListener('DOMContentLoaded', () => {
    muatInformasiEventDanKursi();
    setupEventListeners();
});

// Mengambil data dari Backend API
async function muatInformasiEventDanKursi() {
    try {
        const response = await fetch(`api/events/${EVENT_ID}/seats`);
        const result = await response.json();

        if (result === 'SUCCESS') {
            const eventInfo = document.getElementById('event-info');
            const eventDate = new Date(result.data.event.start_at).toLocaleString('id-ID');
            eventInfo.innerHTML = `
                <h2>${result.data.event.name}</h2>
                <p><strong>Waktu Acara</strong> ${eventDate}</p>
            `;

            // Render denah kursi
        }
    }
}