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
        }))
        // NOTE: gameTime er ikke længere inkluderet i save data
    };

    return encodeGameData(saveData);
}

