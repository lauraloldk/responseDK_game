// utils.js - Hjælpefunktioner og utilities til brandsimulering

// Find køretøj ved ID
function findVehicleById(vehicleId) {
    for (const station of Game.stations) {
        for (const vehicle of station.køretøjer) {
            if (vehicle.id === vehicleId) {
                return vehicle;
            }
        }
    }
    return null;
}

// Patrulje kontrolfunktioner med UI opdatering
function startVehiclePatrolling(vehicleId) {
    startPatrolling(vehicleId);
    // Opdater stationspanel hvis det er åbent
    updateStationPanelIfOpen();
    // Opdater køretøjspanel hvis det er åbent
    updateVehiclePanelIfOpen();
}

function stopVehiclePatrolling(vehicleId) {
    stopPatrolling(vehicleId);
    // Opdater stationspanel hvis det er åbent
    updateStationPanelIfOpen();
    // Opdater køretøjspanel hvis det er åbent
    updateVehiclePanelIfOpen();
}

function sendVehicleToHome(vehicleId) {
    sendVehicleHome(vehicleId);
    // Opdater stationspanel hvis det er åbent
    updateStationPanelIfOpen();
    // Opdater køretøjspanel hvis det er åbent
    updateVehiclePanelIfOpen();
}

// Hjælpefunktion til at opdatere stationspanel hvis det er åbent
function updateStationPanelIfOpen() {
    const stationPanel = document.getElementById("stationPanel");
    if (stationPanel.style.display === 'block' && Game.selectedStation) {
        displayStationPanel(Game.selectedStation, Game.stations);
    }
}

// Hjælpefunktion til at opdatere køretøjspanel hvis det er åbent
function updateVehiclePanelIfOpen() {
    const vehiclePanel = document.getElementById("køretøjsPanel");
    if (vehiclePanel.style.display === 'block') {
        // Tjek om panelet viser køretøjsvalg (ikke adressesøgning eller andre ting)
        const vehicleSelectionList = document.getElementById("vehicleSelectionList");
        if (vehicleSelectionList) {
            displayVehicleSelectionPanel(Game.stations);
        }
    }
}

// Globale funktioner til brug i HTML onclick handlers
function sendKøretøjerTilAlarm(alarmIndex) {
    Game.sendSelectedVehiclesToAlarm(alarmIndex);
}

function selectVehicleForDispatch(stationIdx, vehicleIdx) {
    const vehicle = Game.stations[stationIdx].køretøjer[vehicleIdx];
    const index = Game.selectedVehicles.indexOf(vehicle);
    if (index > -1) Game.selectedVehicles.splice(index, 1);
    else Game.selectedVehicles.push(vehicle);
}

// Save/Load panel funktioner
function showSaveLoadPanel(mode) {
    Game.hideAllPanels(); // Hide other panels first
    const panel = document.getElementById('saveLoadPanel');
    const panelTitle = document.getElementById('panelTitle');
    const saveContent = document.getElementById('saveContent');
    const loadContent = document.getElementById('loadContent');
    
    panel.style.display = 'block';

    if (mode === 'save') {
        panelTitle.textContent = "Gem spil";
        saveContent.style.display = 'block';
        loadContent.style.display = 'none';
        document.getElementById('saveCodeOutput').value = generateSaveCode(Game); // Call save function
        document.getElementById('saveCodeOutput').select(); // Select text for easy copying
    } else if (mode === 'load') {
        panelTitle.textContent = "Indlæs spil";
        saveContent.style.display = 'none';
        loadContent.style.display = 'block';
        document.getElementById('loadCodeInput').value = ''; // Clear previous input
    }
}

function hideSaveLoadPanel() {
    document.getElementById('saveLoadPanel').style.display = 'none';
}

function copySaveCode() {
    const saveCodeOutput = document.getElementById('saveCodeOutput');
    saveCodeOutput.select();
    document.execCommand('copy');
    alert("Kode kopieret til udklipsholder!");
}
