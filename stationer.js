// stationer.js

// Funktion til at tilføje en ny station til spillet og kortet
function addStationToMap(latlng) {
    const stationName = prompt("Indtast navn for den nye brandstation:");
    if (!stationName) {
        alert("Stationsnavnet må ikke være tomt.");
        return;
    }

    const newStation = {
        id: `station_${Date.now()}`, // Unik ID baseret på timestamp
        navn: stationName,
        position: latlng,
        køretøjer: [], // Tomt array til køretøjer
        marker: null // Reference til Leaflet markøren
    };

    // Opret markør for stationen
    newStation.marker = createStationMarker(newStation.position, newStation.navn, newStation);
    
    Game.stations.push(newStation); // Tilføj stationen til Game.stations arrayet
    Game.updateStatusPanels(); // Opdater statuspanelerne for at vise den nye station
    alert(`${stationName} er blevet oprettet.`);
}

// Funktion til at vise stationsdetaljer i sidepanelet
function displayStationPanel(station, allStations) {
    const panel = document.getElementById("stationPanel");
    panel.innerHTML = `
        <button class="close-btn" onclick="Game.hideAllPanels()">X</button>
        <h3>${station.navn}</h3>
        <p>ID: ${station.id}</p>
        <p>Position: ${station.position.lat.toFixed(4)}, ${station.position.lng.toFixed(4)}</p>
        
        <div class="station-actions">
            <button onclick="addVehicleToSelectedStation()">➕ Opret nyt køretøj</button>
            <button onclick="renameSelectedStation()">Omdøb station</button>
            <button class="danger-button" onclick="deleteSelectedStation()">Slet station</button>
        </div>

        <h4>Køretøjer (${station.køretøjer.length})</h4>
        <div class="vehicle-list">
            ${station.køretøjer.map((vehicle, vIdx) => `
                <div>
                    <span>${vehicle.navn} (${vehicle.type}) - ${vehicle.status}</span>
                    <div class="vehicle-actions">
                        <button onclick="editVehicleInStation(${Game.stations.indexOf(station)}, ${vIdx})">Rediger</button>
                        <button class="danger-button" onclick="deleteVehicleFromStation(${Game.stations.indexOf(station)}, ${vIdx})">Slet</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    panel.style.display = 'block';
}

// Funktion til at tilføje et køretøj til en specifik station
function addVehicleToStation(station, mapInstance) {
    const vehicleName = prompt("Indtast køretøjets navn:");
    if (!vehicleName) {
        alert("Køretøjets navn må ikke være tomt.");
        return; // Afbryd, hvis navnet er tomt
    }

    const vehicleType = prompt("Indtast køretøjets type (f.eks. Brandbil, Ambulance):");
    if (!vehicleType) {
        alert("Køretøjets type må ikke være tom.");
        return; // Afbryd, hvis typen er tom
    }

    const newVehicle = {
        id: `vehicle_${Date.now()}`, // Unik ID
        navn: vehicleName,
        type: vehicleType,
        station: station, // Reference til hjemstationen
        status: 'standby', // Standardstatus
        position: { lat: station.position.lat, lng: station.position.lng }, // Starter ved stationens position
        marker: null, // Leaflet markør objekt
        targetPosition: null, // Destination for rute
        routeControl: null, // Routing Machine kontrol
        travelTime: 0, // Tid i bevægelse
        distanceTraveled: 0 // Tilbagelagt distance
    };
    station.køretøjer.push(newVehicle);

    // Opret markøren for det nye køretøj på kortet
    newVehicle.marker = createVehicleMarker(newVehicle.position, newVehicle.navn, newVehicle.type, newVehicle);
    
    // Opdater den globale Game.vehicles liste (hvis den eksisterer og bruges)
    // if (Game.vehicles) Game.vehicles.push(newVehicle); 

    alert(`${vehicleName} (${vehicleType}) er tilføjet til ${station.navn}.`);
}


// Funktion til at slette et køretøj fra en station
function deleteVehicle(station, vehicleIndex, mapInstance) {
    if (confirm(`Er du sikker på, at du vil slette ${station.køretøjer[vehicleIndex].navn}?`)) {
        const vehicleToRemove = station.køretøjer[vehicleIndex];
        
        // Fjern markør fra kortet
        if (vehicleToRemove.marker) {
            mapInstance.removeLayer(vehicleToRemove.marker);
        }
        // Fjern rute, hvis den eksisterer
        if (vehicleToRemove.routeControl) {
            mapInstance.removeControl(vehicleToRemove.routeControl);
        }

        station.køretøjer.splice(vehicleIndex, 1); // Fjern køretøjet fra stationens array
        alert("Køretøj slettet.");
    }
}

// Funktion til at slette en station
function deleteStation(stationToDelete, allStations, mapInstance) {
    if (confirm(`Er du sikker på, at du vil slette stationen ${stationToDelete.navn} og alle dens ${stationToDelete.køretøjer.length} køretøjer?`)) {
        // Fjern alle køretøjers markører og ruter tilhørende denne station
        stationToDelete.køretøjer.forEach(vehicle => {
            if (vehicle.marker) {
                mapInstance.removeLayer(vehicle.marker);
            }
            if (vehicle.routeControl) {
                mapInstance.removeControl(vehicle.routeControl);
            }
        });

        // Fjern stationens markør fra kortet
        if (stationToDelete.marker) {
            mapInstance.removeLayer(stationToDelete.marker);
        }

        // Fjern stationen fra Game.stations arrayet
        const index = allStations.indexOf(stationToDelete);
        if (index > -1) {
            allStations.splice(index, 1);
        }
        alert(`${stationToDelete.navn} og dens køretøjer er slettet.`);
    }
}

// Funktion til at omdøbe en station
function renameStation(station) {
    const newName = prompt("Indtast nyt navn for stationen:", station.navn);
    if (newName && newName.trim() !== "") {
        station.navn = newName.trim();
        // Opdater markør-ikonet, hvis det viser navnet
        if (station.marker && typeof updateStationMarkerIcon === 'function') {
            updateStationMarkerIcon(station);
        }
        alert(`${station.navn} er nu omdøbt.`);
    } else if (newName !== null) { // If user pressed Cancel, newName is null
        alert("Navneændring annulleret eller ugyldigt navn indtastet.");
    }
}


// Funktion til at vise listen over tilgængelige køretøjer for udsendelse
function displayVehicleSelectionPanel(stations) {
    const panel = document.getElementById("køretøjsPanel");
    panel.innerHTML = `
        <button class="close-btn" onclick="Game.hideAllPanels()">X</button>
        <h3>Vælg køretøjer til udsendelse</h3>
        <p>Vælg et eller flere køretøjer, og klik derefter på "Send valgte".</p>
        <div class="vehicle-selection-list">
            ${stations.map((station, sIdx) => `
                <h4>${station.navn}</h4>
                ${station.køretøjer.map((vehicle, vIdx) => `
                    <label>
                        <input type="checkbox" onchange="selectVehicleForDispatch(${sIdx}, ${vIdx})" ${Game.selectedVehicles.includes(vehicle) ? 'checked' : ''}>
                        ${vehicle.navn} (${vehicle.type}) - ${vehicle.status}
                    </label><br>
                `).join('')}
            `).join('')}
        </div>
        <button onclick="Game.chooseAlarmAndDispatch()">Send valgte køretøjer</button>
    `;
    panel.style.display = 'block';
}