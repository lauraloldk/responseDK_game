// stationer.js

function addStationToMap(latlng) {
    const name = prompt("Navn på station:");
    if (!name) return;

    // Game.stations vil være et globalt array, der indeholder alle stationer
    // Vi antager, at Game.map er tilgængelig fra map.js
    const station = { 
        id: Game.stations.length + 1, // Giv stationen et unikt ID
        navn: name, 
        position: latlng, 
        marker: null, 
        køretøjer: [] 
    };
    station.marker = createStationMarker(latlng, name, station); // Opret markør via map.js
    Game.stations.push(station); // Tilføj til Game-objektets stationsarray
}

function addVehicleToStation(station, mapInstance) {
    const kNavn = prompt("Navn på køretøj:");
    if (!kNavn) return;
    const type = prompt("Type: brand, ambulance, politi, Andet");
    if (!type) return;

    const vehicle = { 
        navn: kNavn, 
        type: type, 
        status: 'standby', 
        station: station, 
        alarm: null,
        marker: null,
        routeControl: null // Tilføj dette for at kunne fjerne ruter senere
    };
    // Marker needs to be created at the station's position
    vehicle.marker = L.marker(station.position, { icon: createVehicleIcon(vehicle.status, vehicle.navn) }).addTo(mapInstance);
    station.køretøjer.push(vehicle);
    // Genopfrisk stationspanelet efter tilføjelse
    displayStationPanel(station, Game.stations); 
}

function deleteVehicle(station, vehicleIdx, mapInstance) {
    const vehicle = station.køretøjer[vehicleIdx];
    if (confirm(`Er du sikker på, at du vil slette køretøj ${vehicle.navn}?`)) {
        if (vehicle.marker) {
            mapInstance.removeLayer(vehicle.marker);
        }
        if (vehicle.routeControl) { // Fjern eventuel aktiv rute
            mapInstance.removeControl(vehicle.routeControl);
        }
        station.køretøjer.splice(vehicleIdx, 1);
        displayStationPanel(station, Game.stations); // Opdater panelet
    }
}

function deleteStation(station, stationsArray, mapInstance) {
    if (confirm(`Er du sikker på, at du vil slette station ${station.navn} og alle dens ${station.køretøjer.length} køretøjer?`)) {
        if (station.marker) {
            mapInstance.removeLayer(station.marker);
        }
        station.køretøjer.forEach(v => {
            if (v.marker) {
                mapInstance.removeLayer(v.marker);
            }
            if (v.routeControl) { // Fjern eventuel aktiv rute for køretøjer
                mapInstance.removeControl(v.routeControl);
            }
        });
        // Fjern stationen fra det globale stationsarray i Game
        const index = stationsArray.indexOf(station);
        if (index > -1) {
            stationsArray.splice(index, 1);
        }
        Game.hideAllPanels(); // Skjul panelet efter sletning
        Game.selectedStation = null; // Ryd den valgte station
    }
}

function renameStation(station) {
    const newName = prompt(`Omdøb station "${station.navn}" til:`, station.navn);
    if (newName && newName.trim() !== "") {
        station.navn = newName.trim();
        station.marker.setIcon(L.divIcon({
            html: `<div class='station-ikon'>🏢 ${station.navn}</div>`,
            className: ''
        }));
        displayStationPanel(station, Game.stations); // Opdater panelet
    }
}


// --- Panel visningslogik ---

function displayVehicleSelectionPanel(stations) {
    const panel = document.getElementById("køretøjsPanel");
    panel.innerHTML = "<b>Vælg køretøjer:</b><br>";
    panel.style.display = 'block';
    Game.selectedVehicles = []; // Nulstil valgte køretøjer

    if (stations.length === 0) {
        panel.innerHTML += "Ingen stationer med køretøjer at vælge fra.";
        return;
    }

    stations.forEach((st, sidx) => {
        panel.innerHTML += `<hr><b>${st.navn}</b><br>`;
        const standbyVehicles = st.køretøjer.filter(k => k.status === 'standby');
        if (standbyVehicles.length === 0) {
            panel.innerHTML += "Ingen ledige køretøjer.<br>";
        } else {
            standbyVehicles.forEach((k, kidx) => {
                // Find den rigtige index i det originale stations.køretøjer array
                const originalKidx = st.køretøjer.indexOf(k);
                panel.innerHTML += `<label><input type='checkbox' onchange='selectVehicleForDispatch(${sidx},${originalKidx})'> ${k.navn} (${k.type})</label><br>`;
            });
        }
    });
    // Denne linje er VIGTIG - den kalder nu Game.chooseAlarmAndDispatch, som er defineret i index.html
    panel.innerHTML += `<br><button onclick='Game.chooseAlarmAndDispatch()'>Afsend valgte</button>`;
}

// *** Fjernet: Game.chooseAlarmAndDispatch funktionen var her, men er nu flyttet til index.html ***


function displayStatusPanel(stations) {
    const panel = document.getElementById("statusPanel");
    panel.innerHTML = '<b>Status for alle køretøjer:</b><br>';
    panel.style.display = 'block';
    if (stations.length === 0) {
        panel.innerHTML += "Ingen stationer at vise status for.";
        return;
    }
    stations.forEach(st => {
        panel.innerHTML += `<hr><b>${st.navn}</b><br>`;
        if (st.køretøjer.length === 0) {
            panel.innerHTML += "Ingen køretøjer ved denne station.<br>";
        } else {
            st.køretøjer.forEach(k => {
                let statusInfo = k.status;
                if (k.alarm) {
                    statusInfo += ` (Alarm #${k.alarm.id}: ${k.alarm.type})`;
                }
                panel.innerHTML += `${k.navn} (${k.type}) - ${statusInfo}<br>`;
            });
        }
    });
}

function displayStationPanel(station, allStations) {
    const panel = document.getElementById("stationPanel");
    panel.dataset.stationId = station.id; 
    panel.innerHTML = `<h3>${station.navn}</h3>
        <div class="station-actions">
            <button onclick="renameSelectedStation()">Omdøb station</button>
            <button class="danger-button" onclick="deleteSelectedStation()">Slet station & køretøjer</button>
        </div>
        <h4>Køretøjer:</h4>
        <div class="vehicle-list"></div>
        <button onclick="addVehicleToSelectedStation()">Tilføj nyt køretøj</button>`;
    
    const vehicleListDiv = panel.querySelector('.vehicle-list');
    if (station.køretøjer.length === 0) {
        vehicleListDiv.innerHTML = "<p>Ingen køretøjer ved denne station.</p>";
    } else {
        station.køretøjer.forEach((k, kidx) => {
            const vehicleDiv = document.createElement('div');
            let statusText = k.status;
            if (k.alarm) {
                statusText += ` (Alarm #${k.alarm.id}: ${k.alarm.type})`;
            }
            vehicleDiv.innerHTML = `
                <span>${k.navn} (${k.type}) - <b>${statusText}</b></span>
                <div>
                    <button onclick="editVehicleInStation(${allStations.indexOf(station)}, ${kidx})">Rediger</button>
                    <button class="danger-button" onclick="deleteVehicleFromStation(${allStations.indexOf(station)}, ${kidx})">Slet</button>
                </div>`;
            vehicleListDiv.appendChild(vehicleDiv);
        });
    }
    panel.style.display = 'block'; 
}