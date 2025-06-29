// stationer.js

function addStationToMap(latlng) {
    const name = prompt("Navn på station:");
    if (!name) return;

    const station = { 
        id: Game.stations.length + 1, // Giv stationen et unikt ID
        navn: name, 
        position: latlng, 
        marker: null, 
        køretøjer: [] 
    };
    // Korrekt kald til createStationMarker fra map.js
    station.marker = createStationMarker(latlng, name, station); 
    Game.stations.push(station); // Tilføj til Game-objektets stationsarray
}

function addVehicleToStation(station, mapInstance) {
    const kNavn = prompt("Navn på køretøj:");
    if (!kNavn) return;
    const type = prompt("Type (f.eks. brand, ambulance, politi, Andet):");
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
    // RETTET: Korrekt kald til createVehicleMarker fra map.js
    vehicle.marker = createVehicleMarker(station.position, vehicle.navn, vehicle.type, vehicle);
    station.køretøjer.push(vehicle);
    // Genopfrisk stationspanelet efter tilføjelse
    displayStationPanel(station, Game.stations); 
}

function deleteVehicle(station, vehicleIdx, mapInstance) {
    const vehicle = station.køretøjer[vehicleIdx];
    if (confirm(`Er du sikker på, at du vil slette køretøj ${vehicle.navn}?`)) {
        if (vehicle.marker) {
            mapInstance.removeLayer(vehicle.marker);
            // Fjern markøren fra allMarkers array'et
            allMarkers = allMarkers.filter(m => m !== vehicle.marker);
        }
        if (vehicle.routeControl) { // Fjern eventuel aktiv rute
            mapInstance.removeControl(vehicle.routeControl);
            // Fjern routeControl fra allRouteControls array'et
            allRouteControls = allRouteControls.filter(rc => rc !== vehicle.routeControl);
        }
        station.køretøjer.splice(vehicleIdx, 1);
        displayStationPanel(station, Game.stations); // Opdater panelet
    }
}

function deleteStation(station, stationsArray, mapInstance) {
    if (confirm(`Er du sikker på, at du vil slette station ${station.navn} og alle dens ${station.køretøjer.length} køretøjer?`)) {
        if (station.marker) {
            mapInstance.removeLayer(station.marker);
            // Fjern stationens markør fra allMarkers
            allMarkers = allMarkers.filter(m => m !== station.marker);
        }
        station.køretøjer.forEach(v => {
            if (v.marker) {
                mapInstance.removeLayer(v.marker);
                // Fjern køretøjets markør fra allMarkers
                allMarkers = allMarkers.filter(m => m !== v.marker);
            }
            if (v.routeControl) { // Fjern eventuel aktiv rute for køretøjer
                mapInstance.removeControl(v.routeControl);
                // Fjern routeControl fra allRouteControls array'et
                allRouteControls = allRouteControls.filter(rc => rc !== v.routeControl);
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
        // BRUGER NU: updateStationMarkerIcon fra map.js for konsistent opdatering
        updateStationMarkerIcon(station); 
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