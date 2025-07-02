// load.js

/**
 * Decodes a base64 string back into game data.
 * @param {string} encodedString - The base64 encoded string.
 * @returns {object} The decoded game data object.
 */
function decodeGameData(encodedString) {
    try {
        const jsonString = atob(encodedString); // atob decodes a base64 string
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to decode or parse game data:", e);
        alert("Fejl ved indlæsning af spil: Ugyldig kode.");
        return null;
    }
}

/**
 * Loads game state from a save code.
 * @param {string} saveCode - The save code string.
 * @param {object} Game - The global Game object to update.
 * @param {object} mapInstance - The Leaflet map instance.
 * @param {Function} updateVehicleMarkerIcon - Function from map.js to update vehicle icons.
 * @param {Function} createStationMarker - Function from map.js to create station markers.
 * @param {Function} createVehicleMarker - Function from map.js to create vehicle markers.
 * @param {Function} clearAllMapElements - A function from map.js to clear markers/routes.
 */
function loadGameFromCode(saveCode, Game, mapInstance, updateVehicleMarkerIcon, createStationMarker, createVehicleMarker, clearAllMapElements) {
    const decodedData = decodeGameData(saveCode);

    if (!decodedData) {
        return; // Decoding failed
    }

    // Clear existing game state and map elements
    clearAllMapElements(mapInstance);
    Game.stations = [];
    Game.activeVehicles = [];
    Game.alarms = [];
    Game.missionLog = [];
    // NOTE: Spilletid bliver IKKE nulstillet eller indlæst længere

    // Recreate stations
    decodedData.stations.forEach(savedStation => {
        const newStation = {
            id: savedStation.id,
            navn: savedStation.name, // Brug 'navn' her for at matche dit stationsobjekt
            position: savedStation.position,
            køretøjer: []
        };
        // RETTET: Send 'newStation' som det tredje argument
        newStation.marker = createStationMarker(newStation.position, newStation.navn, newStation);
        Game.stations.push(newStation);

        // Recreate vehicles for this station
        savedStation.vehicleConfigs.forEach(savedVehicle => {
            const vehicle = {
                id: savedVehicle.id,
                navn: savedVehicle.name,
                type: savedVehicle.type,
                station: newStation,
                status: 'standby',
                alarm: null,
                marker: null,
                routeControl: null,
                animationInterval: null,
                homeAnimationInterval: null,
                travelTime: 0,
                distanceTraveled: 0
            };
            vehicle.marker = createVehicleMarker(vehicle.station.position, vehicle.navn, vehicle.type, vehicle);
            updateVehicleMarkerIcon(vehicle);
            newStation.køretøjer.push(vehicle);
        });
    });

    console.log("Game loaded successfully!");
    
    // Hide save/load panel if it exists
    if (typeof hideSaveLoadPanel === 'function') {
        hideSaveLoadPanel();
    }
}

/**
 * Global function for loading game that can be called from HTML
 */
function loadGameAction() {
    const loadCodeInput = document.getElementById('loadCodeInput').value;
    if (loadCodeInput) {
        loadGameFromCode(loadCodeInput, Game, Game.map, updateVehicleMarkerIcon, createStationMarker, createVehicleMarker, clearAllMapElements);
        Game.updateStatusPanels(); // Update UI after loading
        alert("Spillet er indlæst!");
    } else {
        alert("Indsæt venligst en gemt kode.");
    }
}
