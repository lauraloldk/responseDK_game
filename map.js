// map.js

// alarmIcon konstanten er nu irrelevant, da createAlarmMarker opretter ikonet dynamisk.
// Du kan slette den helt, men jeg lader den stå kommenteret ud for at vise det.
/*
const alarmIcon = L.divIcon({
    className: 'alarm-ikon',
    html: '<div class="blink-lampe"></d    // Håndter popup lukning
    vehicle.marker.once('popupclose', () => {
        // Hvis køretøjet stadig patrouillerer og var pauseret, genoptag
        if (vehicle.status === 'patrouillerer' && vehicle.animationPaused) {
            setTimeout(async () => {
                if (vehicle.status === 'patrouillerer') {
                    await moveToRandomPatrolPoint(vehicle);
                    vehicle.animationPaused = false;
                }
            }, 1000); // Kort pause før genoptagelse
        }
    });conSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -5]
});
*/

// Store references to all markers and routing controls currently on the map.
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
function createStationMarker(position, name, stationObject) {
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
function createVehicleMarker(position, name, type, vehicleObject) {
    // Bestem ikonfarve baseret på status
    let iconColor = 'rgb(11, 255, 0)'; // Standard for standby - bright green
    if (vehicleObject.status === 'undervejs') {
        iconColor = 'rgb(0,255,249)';
    } else if (vehicleObject.status === 'ved alarm') {
        iconColor = 'red';
    } else if (vehicleObject.status === 'på vej hjem') {
        iconColor = 'yellow';
    }

    // Bestem køretøjsikon baseret på type
    let vehicleSymbol = '🚗'; // Standard bil ikon for "andet"
    if (type && type.toLowerCase().includes('helikopter')) {
        vehicleSymbol = '🚁'; // Helikopter ikon
    } else if (type && (type.toLowerCase().includes('brandvæsen') || type.toLowerCase().includes('brand'))) {
        vehicleSymbol = '🚒'; // Brandbil ikon
    } else if (type && type.toLowerCase().includes('politi')) {
        vehicleSymbol = '🚓'; // Politibil ikon
    } else if (type && type.toLowerCase().includes('ambulance')) {
        vehicleSymbol = '🚑'; // Ambulance ikon
    } else if (type && (type.toLowerCase().includes('flatbed') || type.toLowerCase().includes('fejeblad') || type.toLowerCase().includes('bergning') || type.toLowerCase().includes('autohjælp'))) {
        vehicleSymbol = '🚛'; // Flatbed/tow truck ikon
    }

    // Bestem click-område baseret på status
    let clickableSize = [70, 45];
    let clickableClass = 'vehicle-ikon';
    if (vehicleObject.status === 'patrouillerer' || vehicleObject.status === 'undervejs') {
        clickableSize = [90, 60]; // Større clickable område
        clickableClass = 'moving-vehicle';
    }

    // Opretter ikonet dynamisk, så navnet kan inkluderes direkte i HTML'en
    const dynamicVehicleIcon = L.divIcon({
        className: clickableClass,
        html: `
            <div style='text-align:center; position: relative;'>
                <div style='width:12px;height:12px;background:${iconColor};border:2px solid #444;margin:auto;border-radius:4px;'></div>
                <div style='font-size:12px;margin-top:-2px;'>${vehicleSymbol}</div>
                <div style='font-size:10px;background:white;color:black;padding:2px 6px;border-radius:4px;margin-top:2px;width:60px;white-space: nowrap; overflow: hidden; text-overflow: ellipsis;'>${name}</div>
            </div>`,
        iconSize: clickableSize,
        iconAnchor: [clickableSize[0]/2, clickableSize[1]/2],
        popupAnchor: [0, -7]
    });

    const marker = L.marker(position, { icon: dynamicVehicleIcon }).addTo(Game.map);
    
    // Link the marker back to the vehicle object for easy lookup (good for popups/interactions)
    marker.vehicleObject = vehicleObject;

    // Tilføj enkel click-event til køretøjsmarkøren
    marker.on('click', function(e) {
        // Hvis køretøjet patrouillerer og bevægelsen er pauseret, genoptag ikke automatisk
        if (vehicleObject.animationPaused) {
            vehicleObject.animationPaused = false; // Permanent stop af auto-genoptagelse
        }
        showVehicleMenu(vehicleObject);
    });
    
    allMarkers.push(marker); // Keep track of this marker
    return marker;
}

function updateVehicleMarkerIcon(vehicle) {
    if (!vehicle.marker) return;

    let iconColor = 'rgb(11, 255, 0)'; // Standby - bright green
    if (vehicle.status === 'undervejs') {
        iconColor = 'rgb(0,255,249)';
    } else if (vehicle.status === 'ved alarm') {
        iconColor = 'red';
    } else if (vehicle.status === 'på vej hjem') {
        iconColor = 'yellow';
    } else if (vehicle.status === 'patrouillerer') {
        iconColor = 'orange';
    }

    // Bestem køretøjsikon baseret på type
    let vehicleSymbol = '🚗'; // Standard bil ikon for "andet"
    if (vehicle.type && vehicle.type.toLowerCase().includes('helikopter')) {
        vehicleSymbol = '🚁'; // Helikopter ikon
    } else if (vehicle.type && (vehicle.type.toLowerCase().includes('brandvæsen') || vehicle.type.toLowerCase().includes('brand'))) {
        vehicleSymbol = '🚒'; // Brandbil ikon
    } else if (vehicle.type && vehicle.type.toLowerCase().includes('politi')) {
        vehicleSymbol = '🚓'; // Politibil ikon
    } else if (vehicle.type && vehicle.type.toLowerCase().includes('ambulance')) {
        vehicleSymbol = '🚑'; // Ambulance ikon
    } else if (vehicle.type && (vehicle.type.toLowerCase().includes('flatbed') || vehicle.type.toLowerCase().includes('fejeblad') || vehicle.type.toLowerCase().includes('bergning') || vehicle.type.toLowerCase().includes('autohjælp'))) {
        vehicleSymbol = '🚛'; // Flatbed/tow truck ikon
    }

    // Bestem click-område baseret på status
    let clickableSize = [70, 45];
    let clickableClass = 'vehicle-ikon';
    if (vehicle.status === 'patrouillerer' || vehicle.status === 'undervejs') {
        clickableSize = [90, 60]; // Større clickable område
        clickableClass = 'moving-vehicle';
    }

    // Opretter et nyt L.divIcon for at opdatere markøren
    const newIcon = L.divIcon({
        className: clickableClass,
        html: `
            <div style='text-align:center; position: relative;'>
                <div style='width:12px;height:12px;background:${iconColor};border:2px solid #444;margin:auto;border-radius:4px;'></div>
                <div style='font-size:12px;margin-top:-2px;'>${vehicleSymbol}</div>
                <div style='font-size:10px;background:white;color:black;padding:2px 6px;border-radius:4px;margin-top:2px;width:60px;white-space: nowrap; overflow: hidden; text-overflow: ellipsis;'>${vehicle.navn}</div>
            </div>`,
        iconSize: clickableSize,
        iconAnchor: [clickableSize[0]/2, clickableSize[1]/2],
        popupAnchor: [0, -7]
    });
    vehicle.marker.setIcon(newIcon);

    // Fjern alle eksisterende event listeners først
    vehicle.marker.off('click');
    vehicle.marker.off('mousedown');
    vehicle.marker.off('mouseup');
    
    // Tilføj ny enkel event listener
    vehicle.marker.on('click', function(e) {
        // Hvis køretøjet patrouillerer og bevægelsen er pauseret, genoptag ikke automatisk
        if (vehicle.animationPaused) {
            vehicle.animationPaused = false; // Permanent stop af auto-genoptagelse
        }
        showVehicleMenu(vehicle);
    });
}

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

// Opret alarmmarkør med ID og type (opdateret for at vise tekst)
function createAlarmMarker(position, id, type, alarmObject) {
    // Opretter ikonet dynamisk for at inkludere ID og type
    const dynamicAlarmIcon = L.divIcon({
        className: 'alarm-ikon', // Bruges til den blinkende effekt
        html: `
            <div style='text-align:center;'>
                <div class="blink-lampe" style="margin:auto;"></div>
                <div style='font-size:10px;font-weight:bold;color:white;background:rgba(0,0,0,0.7);padding:2px 4px;border-radius:3px;margin-top:2px;white-space: nowrap;'>#${id} (${type})</div>
            </div>`,
        iconSize: [80, 40], // Justeret størrelse for at give plads til tekst
        iconAnchor: [40, 20], // Justeret anker
        popupAnchor: [0, -10] // Justeret popup anker
    });

    const marker = L.marker(position, { icon: dynamicAlarmIcon }).addTo(Game.map);
    marker.bindPopup(`<b>Alarm #${id}</b><br>${type}<br><button onclick="Game.showVehicleSelectionPanel()">Send køretøj</button><br><button class="danger-button" onclick="resolveAlarmManually(Game.alarms.find(a => a.id === ${id}))">Afslut alarm</button>`);
    
    // Store alarm object reference in the marker for easy lookup
    marker.alarmObject = alarmObject;

    allMarkers.push(marker); // Keep track of this marker
    return marker;
}

// Toggle synlighed af stationsmarkører
function toggleStationMarkers(stations) {
    if (typeof Game !== 'undefined' && Game.map) { 
        if (typeof Game.stationsSynlige === 'undefined') {
            Game.stationsSynlige = true; // Antag synlig ved start
        }

        Game.stationsSynlige = !Game.stationsSynlige; // Toggle status
        stations.forEach(st => {
            if (st.marker) {
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
}

// Funktion til at vise køretøjsmenu med popup
function showVehicleMenu(vehicle) {
    if (!vehicle.marker) return;
    
    // Hvis køretøjet patrouillerer og bevægelsen er pauseret, genoptag ikke automatisk
    if (vehicle.animationPaused) {
        vehicle.animationPaused = false; // Permanent stop af auto-genoptagelse
    }
    
    let menuHTML = `<b>${vehicle.navn}</b><br>`;
    menuHTML += `Type: ${vehicle.type}<br>`;
    menuHTML += `Status: ${vehicle.status}<br>`;
    menuHTML += `Station: ${vehicle.station.navn}<br><br>`;
    
    // Vis forskellige knapper baseret på køretøjets status
    if (vehicle.status === 'standby') {
        menuHTML += `<button onclick="startVehiclePatrolling('${vehicle.id}')">🚶 Patruljer</button><br>`;
    } else if (vehicle.status === 'patrouillerer') {
        menuHTML += `<button onclick="stopVehiclePatrolling('${vehicle.id}')">🛑 Stop patrouillering</button><br>`;
        menuHTML += `<button onclick="sendVehicleToHome('${vehicle.id}')">🏠 Send hjem til station</button><br>`;
    } else if (vehicle.status === 'undervejs') {
        menuHTML += `<button onclick="sendVehicleToHome('${vehicle.id}')">🏠 Send hjem til station</button><br>`;
    } else if (vehicle.status === 'på vej hjem') {
        menuHTML += `<button onclick="startVehiclePatrolling('${vehicle.id}')">🚶 Start patrouljering</button><br>`;
        menuHTML += `<button onclick="sendVehicleToHome('${vehicle.id}')">🏠 Fortsæt hjem til station</button><br>`;
    }
    
    menuHTML += `<button onclick="showStationDetails(Game.stations.find(s => s.id === '${vehicle.station.id}'))">🏢 Vis station</button>`;
    
    vehicle.marker.bindPopup(menuHTML).openPopup();
    
    // Håndter popup lukning
    vehicle.marker.once('popupclose', () => {
        // Hvis køretøjet stadig patrouillerer og var pauseret, genoptag
        if (vehicle.status === 'patrouillerer' && vehicle.animationPaused) {
            setTimeout(() => {
                if (vehicle.status === 'patrouillerer') {
                    moveToRandomPatrolPoint(vehicle);
                    vehicle.animationPaused = false;
                }
            }, 1000); // Kort pause før genoptagelse
        }
    });
}

// Funktion til at opdatere køretøjsmenu hvis popup'en er åben
function updateVehicleMenuIfOpen(vehicle) {
    if (vehicle.marker && vehicle.marker.isPopupOpen()) {
        showVehicleMenu(vehicle);
    }
}
