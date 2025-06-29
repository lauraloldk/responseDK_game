// map.js
let map; // Gør kortobjektet globalt inden for dette modul

function initMap() {
    map = L.map('map').setView([55.6761, 12.5683], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    return map; // Returner kortobjektet, så det kan bruges i Game.init
}

function createVehicleIcon(status, name, alarmId = null) {
    let color = 'lightgreen';
    let statusText = status;
    if (status === 'undervejs') {
        color = 'rgb(93, 226, 231)';
        if (alarmId) statusText = `Undv. (Alarm #${alarmId})`;
    } else if (status === 'ved alarm') {
        color = 'red';
        if (alarmId) statusText = `Ved Alarm #${alarmId}`;
    } else if (status === 'på vej hjem') {
        color = 'yellow';
        statusText = `Hjem (fra Alarm #${alarmId})`;
    }
    return L.divIcon({ html: `
        <div style='text-align:center;'>
            <div style='width:12px;height:12px;background:${color};border:2px solid #444;margin:auto;border-radius:4px;'></div>
            <div style='font-size:10px;background:white;color:black;padding:2px 6px;border-radius:4px;margin-top:2px;width:60px;white-space: nowrap; overflow: hidden; text-overflow: ellipsis;'>${name}</div>
        </div>` 
    });
}

function updateVehicleMarkerIcon(vehicle) {
    if (vehicle.marker) {
        vehicle.marker.setIcon(createVehicleIcon(vehicle.status, vehicle.navn, vehicle.alarm ? vehicle.alarm.id : null));
    }
}

function createStationMarker(latlng, name, stationObject) {
    const marker = L.marker(latlng, {
        icon: L.divIcon({
            html: `<div class='station-ikon'>🏢 ${name}</div>`,
            className: ''
        })
    }).addTo(map);
    marker.on('click', () => showStationDetails(stationObject)); // Kalder en global funktion i index.html
    return marker;
}

function toggleStationMarkers(stations) {
    // Bemærk: Du skal vedligeholde en "stationsSynlige" status i Game-objektet
    // For nu antager vi, at Game.stationsSynlige er tilgængelig
    if (typeof Game !== 'undefined' && Game.map) { // Tjek for at sikre Game-objektet er defineret
        Game.stationsSynlige = !Game.stationsSynlige;
        stations.forEach(st => {
            if (Game.stationsSynlige) Game.map.addLayer(st.marker);
            else Game.map.removeLayer(st.marker);
        });
    }
}

function createAlarmMarker(latlng, id, type, alarmObject) {
    const ikonHtml = `<div class="blink-lampe"></div><div style='font-size:10px;text-align:center;margin-top:2px;'>Alarm #${id}<br>${type}</div>`; 
    const marker = L.marker([latlng.lat, latlng.lng], {
        icon: L.divIcon({ html: ikonHtml })
    }).addTo(map).on('click', () => {
        if (confirm(`Fjern alarm #${id}: ${type} manuelt?`)) {
            resolveAlarmManually(alarmObject); // Kalder en funktion i alarmer.js
        }
    });
    return marker;
}

function distanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}