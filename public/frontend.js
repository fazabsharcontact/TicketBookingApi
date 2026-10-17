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
            const seatMap = document.getElementById('seat-map');
            seatMap = innerHTML = ''; // Bersihkan loader

            result.data.seats.forEach(seat => {
                const button = document.createElement('button');
                button.ClassName = `seat ${seat.status}`;
                button.innerText = seat.label;
                button.dataset.id = seat.id;
                button.dataset.status = seat.status;

                // Jika kursi sudah terjual, matikan fungsi klik-nya
                if (seat.status === 'sold') {
                    button.disabled = true;
                } else {
                    button.addEventListener('click', () => pilihKursi(button));
                }

                seatMap.appendChild(button);
            });
        }
    } catch (error) {
        tampilkanPesan('Gagal memuat data dari server backend.', 'error');
    };
};

// Logika pemilihan kursi secara virtual
function pilihKursi(tombolKursi) {
    // Batalkan pilihan kursi sebelumnya jika ada
    const kursiAktifSebelumnya = document.querySelector('.seat.selected');
    if (kursiAktifSebelumnya) {
        kursiAktifSebelumnya.classList.remove('selected');
    }

    // Tandai kursi yang baru diklik
    tombolKursi.classList.add('selected');
    kursiTerpilihId = parseInt(tombolKursi.dataset.id);

    // Masukan id kursi ke input form
    document.getElementById('selected-seat-id').value = tombolKursi.innerText;

    // Aktifkan tombol pesan
    document.getElementById('btn-pesan').disabled = false;
};

// Logika pengiriman request pemesanan tiket (POST);
function setupEventListeners() {
    const btnPesan = document.getElementById('btn-pesan');

    btnPesan.addEventListener('click', async () => {
        const emailInput = document.getElementById('user-email').value;
        const msgDiv = document.getElementById('response-message');

        if (!kursiTerpilihId) return;

        const dataPemesanan = {
            seat_id: kursiTerpilihId,
            user_email: emailInput,
            idempotency_key: `key-web-${Math.random().toString(36).substring(2, 9)}`
        };

        btnPesan.disabled = true;
        tampilkanPesan('Memproses transaksi ke database...', 'info');

        try {
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataPemesanan)
            });

            const result = await response.json();

            if (response.status === 201) {
                tampilkanPesan(`Sukses! Kursi berhasil anda amankan! ID BOOKING: ${result.data[0].id}`, 'success');
            } else if (response.status === 409) {
                tampilkanPesan(`GAGAL: ${result.message || 'Kursi sudah terjual ke orang lain!', 'error'}`);
            } else {
                tampilkanPesan(`Terjadi kesalahan: ${result.message}`, 'error');
            }
        } catch (error) {
            tampilkanPesan('Gangguan koneksi ke server.', 'error');
        } finally {
            // Refresh denah kursi untuk melihat status warna terbaru
            muatInformasiEventDanKursi();
            document.getElementById('selected-seat-id').value = '';
        }
    });
}

// helper untuk menampilkan pesan
function tampilkanPesan(teks, tipe) {
    const msgDiv = document.getElementById('response-message');
    msgDiv,innerText = teks;
    msgDiv.style.display = 'block';

    if (tipe === 'success') {
        msgDiv.style.backgroundColor = '#d4edda';
        msgDiv.style.color = '#155724';
    } else if (tipe === 'error') {
        msgDiv.style.backgroundColor = '#f8d7da';
        msgDiv.style.color = '#721c24';
    } else {
        msgDiv.style.backgroundColor = '#e2e3e5';
        msgDiv.style.color = '#383d41';
    }
}