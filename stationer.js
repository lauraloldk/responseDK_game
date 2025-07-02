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
            ${station.køretøjer.map((vehicle, vIdx) => {
                // Bestem patrulje-knap tekst og funktion baseret på køretøjets status
                let patrolButton = '';
                if (vehicle.status === 'standby') {
                    patrolButton = `<button onclick="startVehiclePatrolling('${vehicle.id}')" style="background:#4CAF50; color:white; margin-left:5px; padding:4px 8px; font-size:12px; border:none; border-radius:3px; cursor:pointer;" title="Start patrouljering">🚶 Start patrulje</button>`;
                } else if (vehicle.status === 'patrouillerer') {
                    patrolButton = `<button onclick="stopVehiclePatrolling('${vehicle.id}')" style="background:#ff6b6b; color:white; margin-left:5px; padding:4px 8px; font-size:12px; border:none; border-radius:3px; cursor:pointer;" title="Stop patrouljering">🛑 Stop patrulje</button>`;
                } else if (vehicle.status === 'på vej hjem') {
                    patrolButton = `<button onclick="startVehiclePatrolling('${vehicle.id}')" style="background:#FFA500; color:white; margin-left:5px; padding:4px 8px; font-size:12px; border:none; border-radius:3px; cursor:pointer;" title="Start patrouljering">🚶 Start patrulje</button>`;
                }
                
                return `
                <div>
                    <span>${vehicle.navn} (${vehicle.type}) - ${vehicle.status}</span>
                    <div class="vehicle-actions">
                        <button onclick="editVehicleInStation(${Game.stations.indexOf(station)}, ${vIdx})">Rediger</button>
                        <button class="danger-button" onclick="deleteVehicleFromStation(${Game.stations.indexOf(station)}, ${vIdx})">Slet</button>
                        ${patrolButton}
                    </div>
                </div>
                `;
            }).join('')}
        </div>
    `;
    panel.style.display = 'block';
}

// Funktion til at tilføje et køretøj til en specifik station
function addVehicleToStation(station, mapInstance) {
    // Spørg om antal køretøjer
    const vehicleCountStr = prompt("Hvor mange køretøjer vil du tilføje?", "1");
    if (!vehicleCountStr) return; // Afbryd hvis annulleret
    
    const vehicleCount = parseInt(vehicleCountStr);
    if (isNaN(vehicleCount) || vehicleCount < 1 || vehicleCount > 20) {
        alert("Indtast venligst et gyldigt antal mellem 1 og 20.");
        return;
    }

    // Spørg om køretøjstype (samme for alle)
    const vehicleType = prompt("Indtast køretøjets type (f.eks. Brandbil, Ambulance):");
    if (!vehicleType) {
        alert("Køretøjets type må ikke være tom.");
        return;
    }

    // Generer køretøjer med standardnavne
    const newVehicles = [];
    for (let i = 1; i <= vehicleCount; i++) {
        const defaultName = `${vehicleType} ${i}`;
        
        const newVehicle = {
            id: `vehicle_${Date.now()}_${i}`, // Unik ID
            navn: defaultName,
            type: vehicleType,
            station: station, // Reference til hjemstationen
            status: 'standby', // Standardstatus
            position: { lat: station.position.lat, lng: station.position.lng }, // Starter ved stationens position
            marker: null, // Leaflet markør objekt
            targetPosition: null, // Destination for rute
            routeControl: null, // Routing Machine kontrol
            animationInterval: null, // Reference til alarm-rute animation interval
            homeAnimationInterval: null, // Reference til hjem-rute animation interval
            travelTime: 0, // Tid i bevægelse
            distanceTraveled: 0, // Tilbagelagt distance
            // Nye patrol-relaterede felter
            patrolling: false, // Om køretøjet patrouillerer
            patrolDestination: null, // Destination for patrouiljering
            patrolRouteControl: null, // Routing control for patrouljering
            animationPaused: false, // Om animationen er pauseret
            alarm: null, // Reference til aktuel alarm
            lastDispatchedAlarmId: null // ID på senest udsendte alarm
        };
        
        // Opret markøren for det nye køretøj på kortet
        newVehicle.marker = createVehicleMarker(newVehicle.position, newVehicle.navn, newVehicle.type, newVehicle);
        
        station.køretøjer.push(newVehicle);
        newVehicles.push(newVehicle);
        
        // Lille forsinkelse for at sikre unikke timestamps
        if (i < vehicleCount) {
            // Ingen delay nødvendig da vi tilføjer _${i} til ID'et
        }
    }

    // Hvis flere end ét køretøj, tilbyd at omdøbe dem individuelt
    if (vehicleCount > 1) {
        const rename = confirm(`${vehicleCount} køretøjer af typen "${vehicleType}" er blevet tilføjet med standardnavne.\n\nVil du omdøbe dem individuelt nu?`);
        if (rename) {
            renameMultipleVehicles(newVehicles, station);
        }
    }

    alert(`${vehicleCount} køretøj(er) af typen "${vehicleType}" er tilføjet til ${station.navn}.`);
}

// Ny funktion til at omdøbe flere køretøjer individuelt
function renameMultipleVehicles(vehicles, station) {
    for (let i = 0; i < vehicles.length; i++) {
        const vehicle = vehicles[i];
        const newName = prompt(`Omdøb køretøj ${i + 1}/${vehicles.length}:`, vehicle.navn);
        
        if (newName && newName.trim() !== "") {
            vehicle.navn = newName.trim();
            // Opdater markør-ikonet med det nye navn
            if (vehicle.marker && typeof updateVehicleMarkerIcon === 'function') {
                updateVehicleMarkerIcon(vehicle);
            }
        }
        // Hvis brugeren annullerer eller efterlader tomt, behold det gamle navn
    }
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
        // Stop animation intervals
        if (vehicleToRemove.animationInterval) {
            clearInterval(vehicleToRemove.animationInterval);
        }
        if (vehicleToRemove.homeAnimationInterval) {
            clearInterval(vehicleToRemove.homeAnimationInterval);
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
            // Stop animation intervals
            if (vehicle.animationInterval) {
                clearInterval(vehicle.animationInterval);
            }
            if (vehicle.homeAnimationInterval) {
                clearInterval(vehicle.homeAnimationInterval);
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

// Funktion til at redigere et køretøj (navn og type)
function editVehicleInStation(stationIdx, vehicleIdx) {
    const station = Game.stations[stationIdx];
    const vehicle = station.køretøjer[vehicleIdx];
    
    if (!vehicle) {
        alert("Køretøj ikke fundet.");
        return;
    }
    
    // Rediger navn
    const newName = prompt("Indtast nyt navn for køretøjet:", vehicle.navn);
    if (newName === null) return; // Bruger annullerede
    
    if (newName.trim() === "") {
        alert("Køretøjets navn må ikke være tomt.");
        return;
    }
    
    // Rediger type
    const newType = prompt("Indtast ny type for køretøjet:", vehicle.type);
    if (newType === null) return; // Bruger annullerede
    
    if (newType.trim() === "") {
        alert("Køretøjets type må ikke være tom.");
        return;
    }
    
    // Opdater køretøjets egenskaber
    vehicle.navn = newName.trim();
    vehicle.type = newType.trim();
    
    // Opdater markør-ikonet med de nye oplysninger
    if (vehicle.marker && typeof updateVehicleMarkerIcon === 'function') {
        updateVehicleMarkerIcon(vehicle);
    }
    
    // Opdater stationspanelet for at vise ændringerne
    displayStationPanel(station, Game.stations);
    
    // Opdater status paneler
    Game.updateStatusPanels();
    
    alert(`${vehicle.navn} er blevet opdateret.`);
}

// --- GLOBALE FUNKTIONER FLYTTET FRA INDEX.HTML ---

// Funktion til at vise stationsdetaljer (kaldt fra både HTML og JavaScript)
function showStationDetails(station) {
    const panel = document.getElementById("stationPanel");
    // If the same station is clicked again and panel is visible, hide it
    if (Game.selectedStation === station && panel.style.display === 'block') {
        panel.style.display = 'none';
        Game.selectedStation = null;
    } else {
        Game.selectedStation = station; // Set current selected station
        Game.hideAllPanels(); // Hide all other panels
        displayStationPanel(station, Game.stations); // Populate and display the station panel
        panel.style.display = 'block'; // Show the station panel
    }
}

// Funktion til at tilføje køretøj til den valgte station
function addVehicleToSelectedStation() {
    if (Game.selectedStation) {
        // Kald addVehicleToStation funktionen direkte fra stationer.js
        // Denne funktion håndterer selv prompts for navn og type.
        addVehicleToStation(Game.selectedStation, Game.map); 
        // Opdater visningen af stationens panel for at vise det nye køretøj
        displayStationPanel(Game.selectedStation, Game.stations); 
        // Opdater den globale statusoversigt
        Game.updateStatusPanels(); 
    }
}

// Funktion til at slette køretøj fra station (kaldt fra HTML)
function deleteVehicleFromStation(stationIdx, vehicleIdx) {
    const station = Game.stations[stationIdx];
    deleteVehicle(station, vehicleIdx, Game.map); 
    displayStationPanel(station, Game.stations); 
    Game.updateStatusPanels(); // Update status after deleting vehicle
}

// Funktion til at slette den valgte station
function deleteSelectedStation() {
    if (Game.selectedStation) {
        deleteStation(Game.selectedStation, Game.stations, Game.map); 
        Game.hideAllPanels(); 
        Game.selectedStation = null;
        Game.updateStatusPanels(); // Update status after deleting station
    }
}

// Funktion til at omdøbe den valgte station
function renameSelectedStation() {
    if (Game.selectedStation) {
        renameStation(Game.selectedStation); 
        displayStationPanel(Game.selectedStation, Game.stations); 
        Game.updateStatusPanels(); // Update status after renaming station
    }
}

// Funktion til at vise listen over tilgængelige køretøjer for udsendelse
function displayVehicleSelectionPanel(stations) {
    const panel = document.getElementById("køretøjsPanel");
    panel.innerHTML = `
        <button class="close-btn" onclick="Game.hideAllPanels()">X</button>
        <h3>Vælg køretøjer til udsendelse</h3>
        <p>Vælg et eller flere køretøjer, og klik derefter på "Send valgte".</p>
        <p><small><strong>Note:</strong> Køretøjer der er "på vej hjem" kan omdirigeres til nye alarmer.</small></p>
        <div style="margin-bottom: 10px;">
            <input type="text" id="vehicleSearchInput" placeholder="Søg efter køretøjer (navn, type eller status)..." 
                   style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--button-bg); color: var(--text);"
                   oninput="filterVehicles()">
        </div>
        <div class="vehicle-selection-list" id="vehicleSelectionList">
            ${stations.map((station, sIdx) => `
                <div class="station-group" data-station-name="${station.navn.toLowerCase()}">
                    <h4>${station.navn}</h4>
                    ${station.køretøjer.map((vehicle, vIdx) => {
                        // Allow selection of vehicles that are standby, returning home, or patrolling
                        const canDispatch = vehicle.status === 'standby' || vehicle.status === 'på vej hjem' || vehicle.status === 'patrouillerer';
                        let statusText = vehicle.status;
                        if (vehicle.status === 'på vej hjem') {
                            statusText = `${vehicle.status} (kan omdirigeres)`;
                        } else if (vehicle.status === 'patrouillerer') {
                            statusText = `${vehicle.status} (kan omdirigeres)`;
                        }
                        
                        if (canDispatch) {
                            let cssClass = 'vehicle-item';
                            if (vehicle.status === 'på vej hjem' || vehicle.status === 'patrouillerer') {
                                cssClass = 'vehicle-item vehicle-redirectable';
                            }
                            return `
                                <label class="${cssClass}" data-vehicle-name="${vehicle.navn.toLowerCase()}" data-vehicle-type="${vehicle.type.toLowerCase()}" data-vehicle-status="${vehicle.status.toLowerCase()}">
                                    <input type="checkbox" onchange="selectVehicleForDispatch(${sIdx}, ${vIdx})" ${Game.selectedVehicles.includes(vehicle) ? 'checked' : ''}>
                                    ${vehicle.navn} (${vehicle.type}) - ${statusText}
                                    ${vehicle.status === 'patrouillerer' ? `
                                        <button onclick="stopVehiclePatrolling('${vehicle.id}')" style="margin-left:10px; padding:2px 6px; font-size:11px; background:#ff6b6b; color:white; border:none; border-radius:3px; cursor:pointer;" title="Stop patrouillering">
                                            🛑
                                        </button>
                                    ` : ''}
                                </label><br>
                            `;
                        } else {
                            return `
                                <div class="vehicle-item-disabled" data-vehicle-name="${vehicle.navn.toLowerCase()}" data-vehicle-type="${vehicle.type.toLowerCase()}" data-vehicle-status="${vehicle.status.toLowerCase()}" style="color: #888; font-style: italic;">
                                    ${vehicle.navn} (${vehicle.type}) - ${vehicle.status} (ikke tilgængelig)
                                </div><br>
                            `;
                        }
                    }).join('')}
                        }
                    }).join('')}
                </div>
            `).join('')}
        </div>
        <button onclick="Game.chooseAlarmAndDispatch()">Send valgte køretøjer</button>
    `;
    panel.style.display = 'block';
}

// Filter function for vehicle search
function filterVehicles() {
    const searchInput = document.getElementById('vehicleSearchInput');
    const searchTerm = searchInput.value.toLowerCase().trim();
    const vehicleList = document.getElementById('vehicleSelectionList');
    const stationGroups = vehicleList.querySelectorAll('.station-group');
    
    stationGroups.forEach(stationGroup => {
        const stationName = stationGroup.getAttribute('data-station-name');
        const vehicleItems = stationGroup.querySelectorAll('.vehicle-item, .vehicle-item-disabled');
        let hasVisibleVehicles = false;
        
        // Check if station name matches search term
        const stationMatches = stationName.includes(searchTerm);
        
        vehicleItems.forEach(vehicleItem => {
            const vehicleName = vehicleItem.getAttribute('data-vehicle-name');
            const vehicleType = vehicleItem.getAttribute('data-vehicle-type');
            const vehicleStatus = vehicleItem.getAttribute('data-vehicle-status');
            
            // Check if vehicle matches search term (name, type, status, or station)
            const vehicleMatches = vehicleName.includes(searchTerm) || 
                                   vehicleType.includes(searchTerm) || 
                                   vehicleStatus.includes(searchTerm) ||
                                   stationMatches;
            
            if (vehicleMatches || searchTerm === '') {
                vehicleItem.style.display = '';
                hasVisibleVehicles = true;
            } else {
                vehicleItem.style.display = 'none';
            }
        });
        
        // Hide station header if no vehicles are visible and search term doesn't match station
        if (hasVisibleVehicles || searchTerm === '') {
            stationGroup.style.display = '';
        } else {
            stationGroup.style.display = 'none';
        }
    });
}