// map.js

// Disse globale ikonkonstanter er ikke længere nødvendige, da ikonerne oprettes dynamisk
// const stationIcon = L.divIcon({ ... });
// const vehicleIcon = L.divIcon({ ... });
const alarmIcon = L.divIcon({ // Denne kan forblive global, da den ikke indeholder dynamisk tekst
    className: 'alarm-ikon',
    html: '<div class="blink-lampe"></div>', // Blinking red circle
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -5]
});

// Store references to all markers and routing controls currently on the map.
// This makes it easy to clear them.
let allMarkers = [];
let allRouteControls = []; // Track routing controls if any lines were drawn

function initMap() {
    const map = L.map('map').setView([55.70, 12.50], 10); // Centered near Copenhagen
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    return map;
}

// Opret ikon for stationer
function createStationMarker(position, name, stationObject) { // Tilføjet stationObject parameter
    // Opretter ikonet dynamisk, så navnet kan inkluderes direkte i HTML'en
    const dynamicStationIcon = L.divIcon({
        html: `<div class='station-ikon'>🏢 ${name}</div>`, // Inkluder navnet direkte i ikonet
        className: '', // Hold denne tom, da styling kommer fra 'station-ikon' klassen
        iconSize: [80, 40], // Juster størrelse for at give plads til tekst
        iconAnchor: [40, 20], // Juster anker for at centrere ikonet
        popupAnchor: [0, -10]
    });

    const marker = L.marker(position, { icon: dynamicStationIcon }).addTo(Game.map);
    
    // Bind en popup eller event for at vise stationsdata
    // showStationDetails er nu defineret i index.html og forventer stationObject
    marker.on('click', () => showStationDetails(stationObject)); 
    
    allMarkers.push(marker); // Keep track of this marker
    return marker;
}

// Opret ikon for køretøjer baseret på status og type
function createVehicleMarker(position, name, type, vehicleObject) { // Tilføjet vehicleObject parameter
    // Bestem ikonfarve baseret på status
    let iconColor = 'blue'; // Standard for standby
    if (vehicleObject.status === 'undervejs') {
        iconColor = 'orange';
    } else if (vehicleObject.status === 'ved alarm') {
        iconColor = 'red';
    } else if (vehicleObject.status === 'på vej hjem') {
        iconColor = 'purple';
    }

    // Opretter ikonet dynamisk, så navnet kan inkluderes direkte i HTML'en
    const dynamicVehicleIcon = L.divIcon({
        className: 'vehicle-ikon',
        html: `
            <div style='text-align:center;'>
                <div style='width:12px;height:12px;background:${iconColor};border:2px solid #444;margin:auto;border-radius:4px;'></div>
                <div style='font-size:10px;background:white;color:black;padding:2px 6px;border-radius:4px;margin-top:2px;width:60px;white-space: nowrap; overflow: hidden; text-overflow: ellipsis;'>${name}</div>
            </div>`, // Inkluder navnet direkte i ikonet
        iconSize: [70, 40], // Juster størrelse for at give plads til tekst
        iconAnchor: [35, 20], // Juster anker
        popupAnchor: [0, -7]
    });

    const marker = L.marker(position, { icon: dynamicVehicleIcon }).addTo(Game.map);
    
    // Link the marker back to the vehicle object for easy lookup (good for popups/interactions)
    marker.vehicleObject = vehicleObject;
    marker.bindPopup(`<b>${name}</b> (${type})<br>Status: ${vehicleObject.status}`);
    
    allMarkers.push(marker); // Keep track of this marker
    return marker;
}

function updateVehicleMarkerIcon(vehicle) {
    if (!vehicle.marker) return;

    let iconColor = 'blue'; // Standby
    if (vehicle.status === 'undervejs') {
        iconColor = 'orange';
    } else if (vehicle.status === 'ved alarm') {
        iconColor = 'red';
    } else if (vehicle.status === 'på vej hjem') {
        iconColor = 'purple';
    }

    // Opretter et nyt L.divIcon for at opdatere markøren
    const newIcon = L.divIcon({
        className: 'vehicle-ikon',
        html: `
            <div style='text-align:center;'>
                <div style='width:12px;height:12px;background:${iconColor};border:2px solid #444;margin:auto;border-radius:4px;'></div>
                <div style='font-size:10px;background:white;color:black;padding:2px 6px;border-radius:4px;margin-top:2px;width:60px;white-space: nowrap; overflow: hidden; text-overflow: ellipsis;'>${vehicle.navn}</div>
            </div>`, // Brug vehicle.navn her
        iconSize: [70, 40],
        iconAnchor: [35, 20],
        popupAnchor: [0, -7]
    });
    vehicle.marker.setIcon(newIcon);
    vehicle.marker.setPopupContent(`<b>${vehicle.navn}</b> (${vehicle.type})<br>Status: ${vehicle.status}`);
}

// Tilføj denne funktion til din map.js
function updateStationMarkerIcon(station) {
    if (!station.marker) return;

    const newIcon = L.divIcon({
        html: `<div class='station-ikon'>🏢 ${station.navn}</div>`,
        className: '', // Hold denne tom, da styling kommer fra 'station-ikon' klassen
        iconSize: [80, 40], // Skal matche størrelsen brugt i createStationMarker
        iconAnchor: [40, 20], // Skal matche ankeret brugt i createStationMarker
        popupAnchor: [0, -10]
    });
    station.marker.setIcon(newIcon);
    // Genopfrisk popup'en også, hvis den indeholder navnet
    station.marker.setPopupContent(`<b>${station.navn}</b><br><button onclick="showStationDetails(Game.stations.find(s => s.marker === this.__parent__))">Detaljer</button>`);
}

function createAlarmMarker(position, id, type, alarmObject) {
    const marker = L.marker(position, { icon: alarmIcon }).addTo(Game.map);
    marker.bindPopup(`<b>Alarm #${id}</b><br>${type}<br><button onclick="Game.showVehicleSelectionPanel()">Send køretøj</button><br><button class="danger-button" onclick="resolveAlarmManually(Game.alarms.find(a => a.id === ${id}))">Afslut alarm</button>`);
    
    // Store alarm object reference in the marker for easy lookup
    marker.alarmObject = alarmObject;

    allMarkers.push(marker); // Keep track of this marker
    return marker;
}

// Toggle synlighed af stationsmarkører
function toggleStationMarkers(stations) {
    // Bemærk: Du skal vedligeholde en "stationsSynlige" status i Game-objektet
    if (typeof Game !== 'undefined' && Game.map) { 
        // Initialiser Game.stationsSynlige hvis den ikke findes
        if (typeof Game.stationsSynlige === 'undefined') {
            Game.stationsSynlige = true; // Antag synlig ved start
        }

        Game.stationsSynlige = !Game.stationsSynlige; // Toggle status
        stations.forEach(st => {
            if (st.marker) { // Sørg for at markøren eksisterer
                if (Game.stationsSynlige) {
                    st.marker.addTo(Game.map); // Vis markør
                } else {
                    Game.map.removeLayer(st.marker); // Skjul markør
                }
            }
        });
    }
}

// New function to clear all elements from the map
function clearAllMapElements(mapInstance) {
    // Clear all markers
    allMarkers.forEach(marker => {
        if (mapInstance.hasLayer(marker)) {
            mapInstance.removeLayer(marker);
        }
    });
    allMarkers = []; // Reset the array

    // Clear all routing controls (if any are active)
    allRouteControls.forEach(control => {
        if (mapInstance.hasControl(control)) { // Use hasControl for routing controls
            mapInstance.removeControl(control);
        }
    });
    allRouteControls = []; // Reset the array
    
    // Optionally, if you have other custom layers or polygons, clear them here as well.
}

// distanceKm er flyttet til alarmer.js, så den skal ikke være her.
// Hvis den stadig er i din map.js, bør den fjernes for at undgå duplikering.
// function distanceKm(lat1, lon1, lat2, lon2) { ... }