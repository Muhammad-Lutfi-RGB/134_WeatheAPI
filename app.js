const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/lokasi", async (req, res) => {
    // 1. Ambil nama kota dari query URL (misal: /api/lokasi?kota=bandung)
    const kota = req.query.kota;

    // Jika user tidak memasukkan kota, kembalikan error 400
    if (!kota) {
        return res.status(400).json({ message: "Parameter kota wajib diisi!" });
    }

    const apiKey = "TmW3n2IbOKaZxkghOoYB";
    const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(kota)}.json?key=${apiKey}`;

    try {
        const response = await axios.get(url);
        const data = response.data;

        // Pastikan MapTiler menemukan lokasi yang dicari
        if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            
            const longitude = feature.geometry.coordinates[0];
            const latitude = feature.geometry.coordinates[1];

            // 2. Ekstrak data negara, provinsi, dan kecamatan dari 'context'
            // Ekstrak data
            let negara = "-", provinsi = "-", kabupaten = "-", kecamatan = "-";
            
            if (feature.context) {
                feature.context.forEach(ctx => {
                    if (ctx.id.includes("country")) negara = ctx.text;
                    if (ctx.id.includes("region")) provinsi = ctx.text;
                    // 'county' lebih tepat diterjemahkan sebagai Kabupaten
                    if (ctx.id.includes("county")) kabupaten = ctx.text;
                    // 'city', 'municipality', atau 'locality' biasanya untuk Kota/Kecamatan/Area
                    if (ctx.id.includes("city") || ctx.id.includes("municipality") || ctx.id.includes("locality")) kecamatan = ctx.text;
                });
            }

            // Kirim respons JSON lengkap ke frontend
            res.json({
                kota: feature.text, // Ini biasanya nama spesifik yang dicari (misal: Sampit)
                negara: negara || feature.text,
                provinsi: provinsi,
                kabupaten: kabupaten,
                kecamatan: kecamatan,
                longitude: longitude,
                latitude: latitude
            });
        } else {
            res.status(404).json({ message: "Lokasi tidak ditemukan" });
        }

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Gagal mengambil data dari MapTiler" });
    }
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});