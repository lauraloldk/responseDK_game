// save.js

/**
 * Encodes game data into a base64 string.
 * This makes the generated save code look a bit more "code-like" and handles special characters.
 * @param {object} data - The game data object to encode.
 * @returns {string} The base64 encoded string.
 */
function encodeGameData(data) {
    const jsonString = JSON.stringify(data);
    return btoa(jsonString); // btoa encodes a string in base64
}

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
 * Gathers the relevant game state and generates a save code.
 * @param {object} Game - The global Game object containing stations, vehicles, etc.
 * @returns {string} The generated save code.
 */
function generateSaveCode(Game) {
    const saveData = {
        stations: Game.stations.map(station => ({
            id: station.id,
            name: station.navn, // Brug 'navn' her, da det er hvad dit stationsobjekt bruger
            position: station.position,
            vehicleConfigs: station.køretøjer.map(vehicle => ({ // Save vehicle configs, not current state
                id: vehicle.id,
                name: vehicle.navn,
                type: vehicle.type,
                stationId: station.id // Keep track of which station it belongs to
            }))
        })),
        gameTime: Game.gameTime // Now saving gameTime
    };

    return encodeGameData(saveData);
}

/**
 * Loads game state from a save code.
 * @param {string} saveCode - The save code string.
 * @param {object} Game - The global Game object to update.
 * @param {object} mapInstance - The Leaflet map instance.
 * @param {Function} updateVehicleMarkerIcon - Function from map.js to update vehicle icons.
 * @param {Function} createStationMarker - Function from map.js to create station markers.
 * @param {Function} createVehicleMarker - Function from map.js to create vehicle markers.
 * @param {Function} clearAllMapElements - A new function we'll add to map.js to clear markers/routes.
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
    Game.gameTime = decodedData.gameTime || 0;

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
                routeControl: null
            };
            vehicle.marker = createVehicleMarker(vehicle.station.position, vehicle.navn, vehicle.type, vehicle);
            updateVehicleMarkerIcon(vehicle);
            newStation.køretøjer.push(vehicle);
        });
    });

    console.log("Game loaded successfully!");
    alert("Spillet er indlæst!");

    hideSaveLoadPanel();
}