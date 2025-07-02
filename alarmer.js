// alarmer.js
let nextAlarmId = 1; // Denne tæller skal kun tælle opad.

// Cache for vand-lokationer for at reducere API-kald
const waterLocationCache = new Map();

/**
 * Simpel heuristik til at bestemme om koordinater sandsynligvis er på vand
 * Baseret på danske geografiske karakteristika
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} - True hvis sandsynligvis vand
 */
function isLikelyWaterLocation(lat, lng) {
    // Danmark er omgivet af vand, så punkter uden for hovedland er ofte vand
    const danmarkMainland = {
        minLat: 54.8, maxLat: 57.1,
        minLng: 9.5, maxLng: 12.7
    };
    
    // Hvis uden for hovedland Danmark, højere chance for vand
    if (lat < danmarkMainland.minLat || lat > danmarkMainland.maxLat || 
        lng < danmarkMainland.minLng || lng > danmarkMainland.maxLng) {
        return true; // Antag vand hvis uden for hovedland
    }
    
    // Indre Danmark, antag land medmindre andet bevises
    return false;
}

/**
 * Tjekker om et sæt koordinater er på vand ved hjælp af en ekstern service
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<boolean>} - True hvis lokationen er på vand, false hvis på land
 */
async function isLocationOnWater(lat, lng) {
    // Først, tjek cachen
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (waterLocationCache.has(cacheKey)) {
        const cachedResult = waterLocationCache.get(cacheKey);
        console.log(`Cache hit for ${lat.toFixed(4)}, ${lng.toFixed(4)}: ${cachedResult ? 'VAND' : 'LAND'}`);
        return cachedResult;
    }
    
    try {
        // Tilføj en lille delay for at respektere API rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Bruger OpenStreetMap Nominatim til reverse geocoding
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&extratags=1`);
        const data = await response.json();
        
        // Først: Tjek error eller manglende data
        if (data.error || !data.display_name) {
            // Hvis der ikke er data, brug geografisk heuristik i stedet for tilfældigt gæt
            const isWater = isLikelyWaterLocation(lat, lng);
            waterLocationCache.set(cacheKey, isWater);
            setTimeout(() => waterLocationCache.delete(cacheKey), 1000 * 60 * 30); // Cache i 30 minutter
            console.log(`API returnerede ingen data for ${lat.toFixed(4)}, ${lng.toFixed(4)} - bruger heuristik: ${isWater ? 'VAND' : 'LAND'}`);
            return isWater;
        }
        
        // Tjek place_type eller class først (mest pålidelig)
        if (data.class === 'natural') {
            const waterTypes = ['water', 'bay', 'coastline', 'beach', 'reef', 'strait', 'fjord'];
            if (waterTypes.includes(data.type)) {
                waterLocationCache.set(cacheKey, true);
                setTimeout(() => waterLocationCache.delete(cacheKey), 1000 * 60 * 60); // Cache i 1 time
                console.log(`✓ Bekræftet VAND ved ${lat.toFixed(4)}, ${lng.toFixed(4)} - klasse: ${data.class}, type: ${data.type}`);
                return true;
            }
        }
        
        if (data.class === 'waterway') {
            waterLocationCache.set(cacheKey, true);
            setTimeout(() => waterLocationCache.delete(cacheKey), 1000 * 60 * 60); // Cache i 1 time
            console.log(`✓ Bekræftet VAND ved ${lat.toFixed(4)}, ${lng.toFixed(4)} - vandvej: ${data.type}`);
            return true; // Floder, kanaler, etc.
        }
        
        // Tjek display_name for vand-indikatorer
        if (data.display_name) {
            const displayName = data.display_name.toLowerCase();
            const waterKeywords = [
                'ocean', 'sea', 'lake', 'river', 'bay', 'strait', 'sound', 'fjord', 'pond', 'reservoir',
                'hav', 'sø', 'å', 'bugt', 'fjord', 'sund', 'vand', 'water', 'kanal', 'canal',
                'øresund', 'kattegat', 'skagerrak', 'bælt', 'belt', 'marina', 'havn', 'harbor', 'port'
            ];
            
            if (waterKeywords.some(keyword => displayName.includes(keyword))) {
                waterLocationCache.set(cacheKey, true);
                setTimeout(() => waterLocationCache.delete(cacheKey), 1000 * 60 * 60); // Cache i 1 time
                console.log(`✓ Bekræftet VAND ved ${lat.toFixed(4)}, ${lng.toFixed(4)} - navnebeskrivelse indeholder vand-nøgleord`);
                return true;
            }
        }
        
        // Tjek extraTags for vand-indikatorer
        if (data.extratags) {
            if (data.extratags.water || data.extratags.waterway || data.extratags.natural === 'water') {
                waterLocationCache.set(cacheKey, true);
                setTimeout(() => waterLocationCache.delete(cacheKey), 1000 * 60 * 60); // Cache i 1 time
                console.log(`✓ Bekræftet VAND ved ${lat.toFixed(4)}, ${lng.toFixed(4)} - extratags indeholder vand`);
                return true;
            }
        }
        
        // Hvis der ikke er adresse-komponenter, brug mere pålidelig logik
        if (!data.address || Object.keys(data.address).length <= 1) {
            // Brug heuristik baseret på danske koordinater
            const isWater = isLikelyWaterLocation(lat, lng);
            waterLocationCache.set(cacheKey, isWater);
            setTimeout(() => waterLocationCache.delete(cacheKey), 1000 * 60 * 30); // Cache i 30 minutter
            console.log(`Ingen adressedata for ${lat.toFixed(4)}, ${lng.toFixed(4)} - bruger heuristik: ${isWater ? 'VAND' : 'LAND'}`);
            return isWater;
        }
        
        // Hvis vi kommer hertil, har vi en gyldig adresse = det er land
        waterLocationCache.set(cacheKey, false);
        setTimeout(() => waterLocationCache.delete(cacheKey), 1000 * 60 * 60); // Cache i 1 time
        console.log(`✓ Bekræftet LAND ved ${lat.toFixed(4)}, ${lng.toFixed(4)} - fundet gyldig adresse: ${data.display_name}`);
        return false;
    } catch (error) {
        console.log('Fejl ved kontrol af vand-lokation:', error);
        // Hvis API'et fejler, brug heuristik i stedet for tilfældigt gæt
        const isWater = isLikelyWaterLocation(lat, lng);
        waterLocationCache.set(cacheKey, isWater);
        setTimeout(() => waterLocationCache.delete(cacheKey), 1000 * 60 * 10); // Cache i 10 minutter ved fejl
        console.log(`API-fejl for ${lat.toFixed(4)}, ${lng.toFixed(4)} - bruger heuristik: ${isWater ? 'VAND' : 'LAND'}`);
        return isWater;
    }
}

/**
 * Ekstraherer spawn-regel fra alarm-teksten
 * @param {string} alarmText - Teksten for alarmen
 * @returns {string} - 'only-water', 'can-spawn-on-water', eller 'land-only' (standard)
 */
function getSpawnRule(alarmText) {
    if (alarmText.includes('#only-on-water#')) {
        return 'only-water';
    } else if (alarmText.includes('#can-spawn-on-water#')) {
        return 'can-spawn-on-water';
    }
    return 'land-only';
}

/**
 * Renser alarm-teksten for spawn-regel tags
 * @param {string} alarmText - Den originale alarm-tekst
 * @returns {string} - Alarm-tekst uden tags
 */
function cleanAlarmText(alarmText) {
    return alarmText.replace(/#only-on-water#/g, '').replace(/#can-spawn-on-water#/g, '').trim();
}

/**
 * Opretter en ny alarm på kortet.
 * @param {Array<Object>} stations - Array af alle stationer.
 * @param {Array<Object>} alarmsArray - Det globale array, der indeholder alle aktive alarmer (Game.alarms).
 * @param {HTMLAudioElement} alarmSound - Lyden der skal afspilles ved ny alarm.
 * @param {number} spawnRadiusKm - Radius i km omkring en station, hvor alarmen kan opstå.
 */
async function createAlarm(stations, alarmsArray, alarmSound, spawnRadiusKm) { 
    if (stations.length === 0) return false;

    const randomStationIndex = Math.floor(Math.random() * stations.length);
    const station = stations[randomStationIndex];

    let selectedAlarmType = null;
    let lat, lng, dist;
    let maxAttempts = 20;
    let alarmAttempts = 0;

    // Først vælg en alarm-type, derefter find en passende lokation
    while (alarmAttempts < 5) { // Max 5 alarm-forsøg
        selectedAlarmType = alarmTypes[Math.floor(Math.random() * alarmTypes.length)];
        const spawnRule = getSpawnRule(selectedAlarmType);
        
        console.log(`Forsøger alarm: "${selectedAlarmType}" med regel: ${spawnRule}`);
        
        let locationAttempts = 0;
        let validLocation = false;
        
        // Find en lokation der overholder alarm-reglen
        while (locationAttempts < maxAttempts && !validLocation) {
            // Generér tilfældig lokation inden for radius
            lat = station.position.lat + (Math.random() - 0.5) * (spawnRadiusKm / 111.32);
            lng = station.position.lng + (Math.random() - 0.5) * (spawnRadiusKm / (111.32 * Math.cos(station.position.lat * Math.PI / 180)));
            dist = distanceKm(station.position.lat, station.position.lng, lat, lng);
            
            if (dist <= spawnRadiusKm) {
                // Tjek om lokationen overholder spawn-reglen
                const isOnWater = await isLocationOnWater(lat, lng);
                
                console.log(`Lokation ${lat.toFixed(4)}, ${lng.toFixed(4)} - på vand: ${isOnWater}, regel: ${spawnRule}`);
                
                if (spawnRule === 'only-water' && isOnWater) {
                    validLocation = true;
                    console.log('✓ Valid vand-lokation fundet');
                } else if (spawnRule === 'can-spawn-on-water') {
                    validLocation = true; // Kan spawne både på land og vand
                    console.log('✓ Fleksibel lokation accepteret');
                } else if (spawnRule === 'land-only' && !isOnWater) {
                    validLocation = true;
                    console.log('✓ Valid land-lokation fundet');
                }
            }
            
            locationAttempts++;
        }
        
        if (validLocation) {
            break; // Vi fandt en valid lokation for denne alarm
        }
        
        alarmAttempts++;
    }
    
    // Hvis vi ikke kunne finde en valid lokation efter alle forsøg, fallback til standard metode
    if (alarmAttempts >= 5) {
        console.log('Kunne ikke finde en passende lokation efter 5 alarm-forsøg. Bruger fallback...');
        // Fallback: Vælg en land-only alarm og placer den på land
        const landOnlyAlarms = alarmTypes.filter(alarm => getSpawnRule(alarm) === 'land-only');
        if (landOnlyAlarms.length === 0) {
            console.log('Ingen land-only alarmer fundet til fallback!');
            return false; // Kan ikke oprette alarm
        }
        selectedAlarmType = landOnlyAlarms[Math.floor(Math.random() * landOnlyAlarms.length)];
        
        // Standard spawn-metode for land-only alarmer
        do {
            lat = station.position.lat + (Math.random() - 0.5) * (spawnRadiusKm / 111.32);
            lng = station.position.lng + (Math.random() - 0.5) * (spawnRadiusKm / (111.32 * Math.cos(station.position.lat * Math.PI / 180)));
            dist = distanceKm(station.position.lat, station.position.lng, lat, lng);
        } while (dist > spawnRadiusKm);
    }

    // Rens alarm-teksten for tags
    const cleanedAlarmType = cleanAlarmText(selectedAlarmType);
    
    // Bruger den globale, inkrementerende tæller for unikke ID'er
    const id = nextAlarmId++; 
    
    const alarm = { 
        id, 
        type: cleanedAlarmType, 
        position: { lat, lng }, 
        marker: null, 
        dispatchedVehiclesCount: 0, // NY: Tæller sendte køretøjer til denne alarm
        resolvedVehiclesCount: 0,  // NY: Tæller ankomne køretøjer til denne alarm
        creationTime: Game.gameTime // NY: Gemmer spiltidspunktet for alarmens oprettelse
    };
    // Antager createAlarmMarker funktionen er defineret et andet sted (f.eks. map.js)
    alarm.marker = createAlarmMarker({ lat, lng }, id, cleanedAlarmType, alarm); 
    
    alarmsArray.push(alarm);
    alarmSound.play().catch(() => {}); // Afspiller alarmlyd, fanger fejl hvis lyden ikke kan afspilles
    Game.updateStatusPanels(); // Vigtigt: Opdater UI når en ny alarm er oprettet
    
    console.log(`✅ Alarm oprettet: "${cleanedAlarmType}" på ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    return true; // Alarm blev oprettet succesfuldt
}

/**
 * Sender de valgte køretøjer til en given alarm og animerer deres bevægelse.
 * @param {Object} alarm - Alarmobjektet køretøjerne skal sendes til.
 * @param {Array<Object>} vehiclesToSend - Array af køretøjsobjekter, der skal sendes.
 * @param {L.Map} mapInstance - Leaflet kortinstansen.
 * @param {number} refreshInterval - Interval (ms) for opdatering af køretøjets position.
 * @param {number} standardTravelTime - Standard rejsetid i sekunder (bruges til at simulere hastighed).
 * @param {Array<Object>} allStations - Reference til alle stationer (bruges til Game.stations).
 * @param {Array<Object>} allAlarms - Reference til alle aktive alarmer (bruges til Game.alarms).
 * @param {Array<Object>} missionLog - Reference til missionsloggen.
 */
function sendVehiclesToAlarm(
    alarm, 
    vehiclesToSend, 
    mapInstance, 
    refreshInterval, 
    standardTravelTime, 
    allStations, 
    allAlarms, 
    missionLog
) {
    // Inkrementer tælleren for sendte køretøjer på alarm-objektet.
    // Dette skal gøres én gang for hele batchen af køretøjer, der udsendes til alarmen.
    alarm.dispatchedVehiclesCount += vehiclesToSend.length; 
    
    vehiclesToSend.forEach(vehicle => {
        if (!vehicle.marker) return;

        // VIGTIGT: Stop alle eksisterende animationer/ruter for dette køretøj
        // Dette er nødvendigt for redirection fra "på vej hjem" status og patrouillering
        if (vehicle.routeControl) { 
            mapInstance.removeControl(vehicle.routeControl);
            vehicle.routeControl = null; 
        }
        
        // Stop patrouillering route control
        if (vehicle.patrolRouteControl) {
            mapInstance.removeControl(vehicle.patrolRouteControl);
            vehicle.patrolRouteControl = null;
        }
        
        // Stop enhver aktiv animation interval hvis køretøjet er i bevægelse
        if (vehicle.animationInterval) {
            clearInterval(vehicle.animationInterval);
            vehicle.animationInterval = null;
        }
        
        // Stop enhver aktiv hjem-animation interval
        if (vehicle.homeAnimationInterval) {
            clearInterval(vehicle.homeAnimationInterval);
            vehicle.homeAnimationInterval = null;
        }
        
        // Stop patrouillering hvis køretøjet patrouillerer
        if (vehicle.patrolling) {
            vehicle.patrolling = false;
            vehicle.patrolDestination = null;
        }

        vehicle.status = "undervejs";
        vehicle.alarm = alarm; // Sæt en reference til den alarm, køretøjet kører til
        vehicle.lastDispatchedAlarmId = alarm.id; // Ny: Gem ID'et for den senest udsendte alarm på køretøjet.
        updateVehicleMarkerIcon(vehicle); // Antager updateVehicleMarkerIcon er defineret

        // Tjek om køretøjet er en helikopter
        if (isHelicopter(vehicle)) {
            // --- DIREKTE LINJE TIL ALARM FOR HELIKOPTERE ---
            const startPos = vehicle.marker.getLatLng();
            const endPos = {lat: alarm.position.lat, lng: alarm.position.lng};
            
            vehicle.animationInterval = animateHelicopterDirectLine(
                vehicle, 
                startPos, 
                endPos, 
                refreshInterval, 
                standardTravelTime,
                () => {
                    // Callback når helikopteren ankommer til alarmen
                    vehicle.status = "ved alarm";
                    updateVehicleMarkerIcon(vehicle);

                    // NYT: Inkrementer tælleren for ankomne køretøjer på alarm-objektet
                    alarm.resolvedVehiclesCount++;
                    // NYT: Tjek om alarmen skal løses, nu hvor endnu et køretøj er ankommet
                    checkAndResolveAlarmIfAllArrived(alarm, allAlarms, missionLog, alarm.creationTime, mapInstance);
                    
                    // Simulerer tid ved alarmsted, før helikopteren flyver hjem
                    setTimeout(() => { 
                        vehicle.status = "på vej hjem"; 
                        updateVehicleMarkerIcon(vehicle);

                        // --- DIREKTE LINJE HJEM FOR HELIKOPTERE ---
                        const alarmPos = {lat: alarm.position.lat, lng: alarm.position.lng};
                        const homePos = vehicle.station.position;
                        
                        vehicle.homeAnimationInterval = animateHelicopterDirectLine(
                            vehicle,
                            alarmPos,
                            homePos,
                            refreshInterval,
                            standardTravelTime,
                            () => {
                                // Callback når helikopteren er hjemme
                                vehicle.status = "standby"; 
                                updateVehicleMarkerIcon(vehicle);
                                vehicle.marker.setLatLng(vehicle.station.position); // Sørg for den ender præcis på stationen
                                vehicle.alarm = null; // Fjerner alarm-referencen når køretøjet er hjemme
                                vehicle.lastDispatchedAlarmId = null; // Nulstil den sidste alarm-ID
                            }
                        );
                    }, Math.floor(Math.random() * (300000 - 5000 + 1)) + 5000); // Simulerer tid ved alarm: Mellem 5 sek og 5 min
                }
            );
        } else {
            // --- RUTE TIL ALARM FOR NORMALE KØRETØJER ---
            const routeControl = L.Routing.control({
                waypoints: [vehicle.marker.getLatLng(), L.latLng(alarm.position.lat, alarm.position.lng)],
                routeWhileDragging: false,
                addWaypoints: false,
                draggableWaypoints: false,
                createMarker: () => null, // Ingen standardmarkører fra routeren
                lineOptions: { styles: [] }, // Ingen visuelle linjer for ruten
                show: false // Skjul rutevejledningspanelet
            });
            
            vehicle.routeControl = routeControl; 
            routeControl// .addTo(mapInstance); // fjernet for at forhindre auto-pan

            routeControl.on('routesfound', function (e) {
                const coords = e.routes[0].coordinates;
                const routeLengthMeters = e.routes[0].summary.totalDistance;
                const simulatedSpeedMps = routeLengthMeters / standardTravelTime; 
                const totalAnimationDurationMs = (routeLengthMeters / simulatedSpeedMps) * 1000;

                const numSteps = Math.ceil(totalAnimationDurationMs / refreshInterval);
                const stepIndexIncrement = Math.max(1, Math.floor(coords.length / numSteps));
                
                let i = 0;

                const interval = setInterval(() => {
                    if (i >= coords.length) {
                        clearInterval(interval); // Stop animationen
                        vehicle.animationInterval = null; // Clear reference
                        vehicle.status = "ved alarm";
                        updateVehicleMarkerIcon(vehicle);

                        // Fjern rute-kontrollen fra kortet, når køretøjet er fremme
                        if (vehicle.routeControl) {
                            mapInstance.removeControl(vehicle.routeControl);
                            vehicle.routeControl = null;
                        }

                        // NYT: Inkrementer tælleren for ankomne køretøjer på alarm-objektet
                        alarm.resolvedVehiclesCount++;
                        // NYT: Tjek om alarmen skal løses, nu hvor endnu et køretøj er ankommet
                        // `alarm.creationTime` sikrer, at vi bruger det oprindelige tidspunkt for logning.
                        checkAndResolveAlarmIfAllArrived(alarm, allAlarms, missionLog, alarm.creationTime, mapInstance);
                        
                        // Simulerer tid ved alarmsted, før den kører hjem
                        setTimeout(() => { 
                            vehicle.status = "på vej hjem"; 
                            updateVehicleMarkerIcon(vehicle);

                            // --- RUTE HJEM ---
                            const homeControl = L.Routing.control({
                                waypoints: [alarm.position, vehicle.station.position], // Fra alarm til hjemstation
                                routeWhileDragging: false,
                                addWaypoints: false,
                                draggableWaypoints: false,
                                createMarker: () => null, 
                                lineOptions: { styles: [] }, 
                                show: false 
                            });
                            vehicle.routeControl = homeControl; 
                            homeControl// .addTo(mapInstance); // fjernet for at forhindre auto-pan

                            homeControl.on('routesfound', function (e2) {
                                const homeCoords = e2.routes[0].coordinates;
                                const homeRouteLengthMeters = e2.routes[0].summary.totalDistance;
                                const homeSimulatedSpeedMps = homeRouteLengthMeters / standardTravelTime;
                                const homeTotalAnimationDurationMs = (homeRouteLengthMeters / homeSimulatedSpeedMps) * 1000;
                                
                                const homeNumSteps = Math.ceil(homeTotalAnimationDurationMs / refreshInterval);
                                const homeStepIndexIncrement = Math.max(1, Math.floor(homeCoords.length / homeNumSteps));
                                
                                let j = 0;
                                const homeInterval = setInterval(() => {
                                    if (j >= homeCoords.length) {
                                        clearInterval(homeInterval); // Stop hjem-animationen
                                        vehicle.homeAnimationInterval = null; // Clear reference
                                        vehicle.status = "standby"; 
                                        updateVehicleMarkerIcon(vehicle);
                                        vehicle.marker.setLatLng(vehicle.station.position); // Sørg for den ender præcis på stationen
                                        if (vehicle.routeControl) { 
                                            mapInstance.removeControl(vehicle.routeControl);
                                            vehicle.routeControl = null;
                                        }
                                        vehicle.alarm = null; // Fjerner alarm-referencen når køretøjet er hjemme
                                        vehicle.lastDispatchedAlarmId = null; // Nulstil den sidste alarm-ID
                                        return;
                                    }
                                    vehicle.marker.setLatLng(homeCoords[j]);
                                    j += homeStepIndexIncrement;
                                }, refreshInterval); 
                                
                                // Store home interval reference for potential cleanup
                                vehicle.homeAnimationInterval = homeInterval; 
                            });
                            homeControl.route(); // Start ruten hjem
                        }, Math.floor(Math.random() * (300000 - 5000 + 1)) + 5000); // Simulerer tid ved alarm: Mellem 5 sek og 5 min
                        return;
                    }
                    vehicle.marker.setLatLng(coords[i]);
                    i += stepIndexIncrement;
                }, refreshInterval); 
                
                // Store interval reference for potential cleanup
                vehicle.animationInterval = interval; 
            });

            routeControl.route(); // Start ruten til alarmen for dette køretøj
        }
    });
    Game.updateStatusPanels(); // Opdater UI med det samme, når køretøjer er sendt
}

/**
 * Tjekker om alle sendte køretøjer er ankommet til en alarm, og løser alarmen, hvis de er.
 * Dette er nu ansvarligt for at kalde `resolveAlarm` korrekt.
 * @param {Object} alarm - Alarmobjektet der skal tjekkes.
 * @param {Array<Object>} allAlarms - Reference til Game.alarms.
 * @param {Array<Object>} missionLog - Reference til missionsloggen.
 * @param {number} alarmCreationTime - Spilletidspunktet da alarmen blev oprettet.
 * @param {L.Map} mapInstance - Leaflet kortinstansen.
 */
function checkAndResolveAlarmIfAllArrived(alarm, allAlarms, missionLog, alarmCreationTime, mapInstance) {
    // Find den faktiske alarm i Game.alarms arrayet for at sikre, vi arbejder på den korrekte reference
    const actualAlarm = allAlarms.find(a => a.id === alarm.id);

    if (actualAlarm && actualAlarm.dispatchedVehiclesCount === actualAlarm.resolvedVehiclesCount) {
        // Alle køretøjer, der blev sendt til denne alarm, er nu ankommet til alarmstedet.
        // Nu kan alarmen betragtes som løst.

        // Find alle køretøjer, der blev sendt til netop denne alarm (bruger lastDispatchedAlarmId)
        const vehiclesInvolved = Game.stations.flatMap(s => s.køretøjer)
                                              .filter(v => v.lastDispatchedAlarmId === actualAlarm.id);
        
        resolveAlarm(actualAlarm, vehiclesInvolved, alarmCreationTime, allAlarms, mapInstance, missionLog);
        
        // Nulstil tællerne for denne alarm efter den er løst (ikke strengt nødvendigt, da alarmen fjernes, men god praksis)
        actualAlarm.dispatchedVehiclesCount = 0;
        actualAlarm.resolvedVehiclesCount = 0;
    }
}

/**
 * Fjerner en alarm fra kortet og loggen. Dette kaldes kun, når en alarm er fuldt løst
 * af alle udsendte køretøjer, eller manuelt.
 * @param {Object} alarm - Alarmobjektet der skal løses.
 * @param {Array<Object>} vehicles - Array af køretøjer, der løste denne alarm (til logning).
 * @param {number} alarmCreationTime - Spilletidspunktet da alarmen blev oprettet.
 * @param {Array<Object>} allAlarms - Reference til Game.alarms.
 * @param {L.Map} mapInstance - Leaflet kortinstansen.
 * @param {Array<Object>} missionLog - Reference til missionsloggen.
 */
function resolveAlarm(alarm, vehicles, alarmCreationTime, allAlarms, mapInstance, missionLog) {
    // Fjern alarmmarkøren fra kortet
    if (alarm.marker) {
        mapInstance.removeLayer(alarm.marker);
    }
    
    // Fjern alarmen fra det globale alarmer-array
    const alarmIndex = allAlarms.findIndex(a => a.id === alarm.id);
    if (alarmIndex > -1) {
        allAlarms.splice(alarmIndex, 1);
    }

    // Beregn responstid baseret på spilletid
    const responseTimeInSeconds = Game.gameTime - alarmCreationTime; 
    const formattedResponseTime = formatTime(responseTimeInSeconds); // Bruger den globale formatTime funktion

    // Tilføj mission til loggen
    missionLog.push({
        alarmId: alarm.id,
        type: alarm.type,
        time: formatTime(Game.gameTime), // Brug spilletid for log
        vehicles: vehicles.map(k => k.navn),
        responseTime: formattedResponseTime
    });

    // Køretøjerne håndterer selv deres rute hjem og statusopdateringer i sendVehiclesToAlarm's logik.
    // Vi behøver ikke at nulstille køretøjer her, da de stadig kan være på vej hjem.
    
    Game.updateStatusPanels(); // Vigtigt: Opdater UI når en alarm er løst
}

/**
 * Muliggør manuel fjernelse af en alarm.
 * @param {Object} alarmToResolve - Alarmobjektet der skal fjernes manuelt.
 */
function resolveAlarmManually(alarmToResolve) {
    if (confirm(`Fjern alarm #${alarmToResolve.id}: ${alarmToResolve.type} manuelt?`)) {
        const alarmIndex = Game.alarms.findIndex(a => a.id === alarmToResolve.id);
        if (alarmIndex > -1) {
            const alarm = Game.alarms[alarmIndex];
            
            if (alarm.marker) {
                Game.map.removeLayer(alarm.marker);
            }
            
            Game.missionLog.push({
                alarmId: alarm.id,
                type: alarm.type,
                time: formatTime(Game.gameTime), // Brug Game.gameTime for log
                vehicles: [], // Ingen køretøjer logges som årsag til manuel løsning
                responseTime: "Manuelt afsluttet"
            });

            Game.alarms.splice(alarmIndex, 1); // Fjern alarmen fra listen

            // Nulstil status for køretøjer, der var på vej til den manuelt lukkede alarm
            Game.stations.forEach(st => {
                st.køretøjer.forEach(k => {
                    if (k.alarm && k.alarm.id === alarmToResolve.id) {
                        // Stop alle animationer og ruter
                        if (k.routeControl) {
                            Game.map.removeControl(k.routeControl); 
                            k.routeControl = null;
                        }
                        if (k.animationInterval) {
                            clearInterval(k.animationInterval);
                            k.animationInterval = null;
                        }
                        if (k.homeAnimationInterval) {
                            clearInterval(k.homeAnimationInterval);
                            k.homeAnimationInterval = null;
                        }
                        
                        k.status = 'standby'; // Sæt direkte til standby
                        k.marker.setLatLng(k.station.position); // Flyt direkte til stationen
                        k.alarm = null; // Fjerner alarm reference
                        k.lastDispatchedAlarmId = null; // Nulstil den sidste alarm-ID
                        updateVehicleMarkerIcon(k); 
                    }
                });
            });
            Game.updateStatusPanels(); // Opdater UI efter manuel løsning
        }
    }
}

/**
 * Starter patrouillering for et køretøj
 * @param {string} vehicleId - ID på køretøjet der skal patrouillere
 */
function startPatrolling(vehicleId) {
    const vehicle = findVehicleById(vehicleId);
    if (!vehicle) {
        console.log('Køretøj ikke fundet');
        return;
    }
    
    // Tjek om køretøjet kan patrouillere (standby eller på vej hjem)
    if (vehicle.status !== 'standby' && vehicle.status !== 'på vej hjem') {
        console.log(`Køretøj kan ikke patrouillere - status: ${vehicle.status}`);
        return;
    }
    
    // Stop eventuelle eksisterende animationer først
    stopVehicleMovement(vehicle);
    
    // Nulstil alarm-relaterede felter hvis køretøjet var på vej hjem fra alarm
    if (vehicle.alarm) {
        vehicle.alarm = null;
        vehicle.lastDispatchedAlarmId = null;
    }
    
    vehicle.status = 'patrouillerer';
    vehicle.patrolling = true;
    vehicle.patrolDestination = null;
    vehicle.animationPaused = false; // Reset pause flag
    
    // Opdater køretøjsikon
    updateVehicleMarkerIcon(vehicle);
    
    // Opdater popup hvis den er åben
    if (typeof updateVehicleMenuIfOpen === 'function') {
        updateVehicleMenuIfOpen(vehicle);
    }
    
    // Start patrouillering
    moveToRandomPatrolPoint(vehicle);
    
    // Opdater UI
    Game.updateStatusPanels();
    
    console.log(`${vehicle.navn} starter patrouljering i 50 km radius omkring ${vehicle.station.navn}`);
}

/**
 * Stopper patrouillering for et køretøj
 * @param {string} vehicleId - ID på køretøjet der skal stoppe patrouillering
 */
function stopPatrolling(vehicleId) {
    const vehicle = findVehicleById(vehicleId);
    if (!vehicle || vehicle.status !== 'patrouillerer') {
        console.log('Køretøj patrouillerer ikke');
        return;
    }
    
    vehicle.status = 'standby';
    vehicle.patrolling = false;
    vehicle.patrolDestination = null;
    
    // Stop alle bevægelser
    stopVehicleMovement(vehicle);
    
    // Flyt køretøjet tilbage til stationen
    if (vehicle.marker) {
        vehicle.marker.setLatLng(vehicle.station.position);
    }
    
    // Opdater køretøjsikon
    updateVehicleMarkerIcon(vehicle);
    
    // Opdater popup hvis den er åben
    if (typeof updateVehicleMenuIfOpen === 'function') {
        updateVehicleMenuIfOpen(vehicle);
    }
    
    // Opdater UI
    Game.updateStatusPanels();
    
    console.log(`${vehicle.navn} stopper patrouillering og vender tilbage til ${vehicle.station.navn}`);
}

/**
 * Flytter et køretøj til et tilfældigt punkt inden for patrouljeringsområdet
 * @param {Object} vehicle - Køretøjsobjektet
 */
async function moveToRandomPatrolPoint(vehicle) {
    if (!vehicle.patrolling || vehicle.status !== 'patrouillerer' || vehicle.animationPaused) {
        return;
    }
    
    const station = vehicle.station;
    const radiusKm = 50; // Fast 50 km radius for patrouljering
    const isVehicleHelicopter = isHelicopter(vehicle);
    
    let lat, lng, dist;
    let validLocation = false;
    let attempts = 0;
    const maxAttempts = 15; // Færre forsøg for patruljering
    
    // Find en passende patrulje-lokation
    while (!validLocation && attempts < maxAttempts) {
        // Generer tilfældig position inden for radius
        do {
            lat = station.position.lat + (Math.random() - 0.5) * (radiusKm / 111.32);
            lng = station.position.lng + (Math.random() - 0.5) * (radiusKm / (111.32 * Math.cos(station.position.lat * Math.PI / 180)));
            dist = distanceKm(station.position.lat, station.position.lng, lat, lng);
        } while (dist > radiusKm);
        
        if (isVehicleHelicopter) {
            // Helikoptere kan flyve hvor som helst (både land og vand)
            validLocation = true;
            console.log(`🚁 Helikopter ${vehicle.navn} flyver til patrulje-punkt: ${lat.toFixed(4)}, ${lng.toFixed(4)} (kan være både land/vand)`);
        } else {
            // Landkøretøjer skal holde sig på land
            try {
                const isOnWater = await isLocationOnWater(lat, lng);
                if (!isOnWater) {
                    validLocation = true;
                    console.log(`🚗 ${vehicle.navn} kører til land-patrulje: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
                } else {
                    console.log(`💧 ${vehicle.navn} springer vand-lokation over: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
                }
            } catch (error) {
                // Hvis vand-tjek fejler, brug heuristik
                const likelyWater = isLikelyWaterLocation(lat, lng);
                if (!likelyWater) {
                    validLocation = true;
                    console.log(`🚗 ${vehicle.navn} bruger heuristik (sandsynligvis land): ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
                } else {
                    console.log(`💧 ${vehicle.navn} springer sandsynlig vand-lokation over (heuristik): ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
                }
            }
        }
        
        attempts++;
    }
    
    // Hvis ingen valid lokation blev fundet, brug en sikker fallback nær stationen
    if (!validLocation) {
        console.log(`⚠️ Kunne ikke finde passende patrulje-lokation for ${vehicle.navn}, bruger fallback nær station`);
        // Fallback: Lille radius omkring stationen (sandsynligvis land)
        const fallbackRadius = 5; // 5 km radius
        lat = station.position.lat + (Math.random() - 0.5) * (fallbackRadius / 111.32);
        lng = station.position.lng + (Math.random() - 0.5) * (fallbackRadius / (111.32 * Math.cos(station.position.lat * Math.PI / 180)));
    }
    
    const destination = { lat, lng };
    vehicle.patrolDestination = destination;
    
    // Animér bevægelse til destinationen
    animateVehicleToDestination(vehicle, destination, () => {
        // Når køretøjet når destinationen, vent lidt og vælg så et nyt punkt
        if (vehicle.patrolling && vehicle.status === 'patrouillerer' && !vehicle.animationPaused) {
            setTimeout(async () => {
                if (!vehicle.animationPaused) {
                    await moveToRandomPatrolPoint(vehicle);
                }
            }, 3000 + Math.random() * 7000); // Vent 3-10 sekunder
        }
    });
}

/**
 * Animerer et køretøj til en destination ved at følge vejene
 * @param {Object} vehicle - Køretøjsobjektet
 * @param {Object} destination - Destinationskoordinater {lat, lng}
 * @param {Function} callback - Callback funktion når destinationen er nået
 */
function animateVehicleToDestination(vehicle, destination, callback) {
    if (!vehicle.marker) return;
    
    const startPos = vehicle.marker.getLatLng();
    const endPos = L.latLng(destination.lat, destination.lng);
    
    // Stop eksisterende routing control
    if (vehicle.patrolRouteControl) {
        Game.map.removeControl(vehicle.patrolRouteControl);
        vehicle.patrolRouteControl = null;
    }
    
    // Opret en routing control for patrouillering
    vehicle.patrolRouteControl = L.Routing.control({
        waypoints: [startPos, endPos],
        routeWhileDragging: false,
        addWaypoints: false,
        createMarker: function() { return null; }, // Skjul rutemarkører
        lineOptions: {
            styles: [] // Ingen visuelle linjer for patrouljeringsruten
        },
        show: false, // Skjul instruktioner
        draggableWaypoints: false,
        fitSelectedRoutes: false
    }).on('routesfound', function(e) {
        const routes = e.routes;
        const route = routes[0];
        
        if (route && route.coordinates) {
            // Start animation langs ruten
            animateAlongRoute(vehicle, route.coordinates, callback);
        } else if (callback) {
            callback();
        }
    }).on('routingerror', function(e) {
        console.log('Routing fejl under patrouillering:', e);
        // Fallback til direkte linje hvis routing fejler
        animateDirectLine(vehicle, destination, callback);
    });
    
    // Gem nuværende zoom og center for at forhindre auto-zoom
    const currentZoom = Game.map.getZoom();
    const currentCenter = Game.map.getCenter();
    
    // Tilføj til kortet og start routing
    vehicle.patrolRouteControl.addTo(Game.map);
    
    // Gendan zoom og center efter routing er tilføjet
    setTimeout(() => {
        Game.map.setView(currentCenter, currentZoom);
    }, 100);
}

/**
 * Animerer køretøj langs en rute
 * @param {Object} vehicle - Køretøjsobjektet
 * @param {Array} coordinates - Array af koordinater langs ruten
 * @param {Function} callback - Callback funktion når destinationen er nået
 */
function animateAlongRoute(vehicle, coordinates, callback) {
    if (!vehicle.marker || !coordinates || coordinates.length === 0) {
        if (callback) callback();
        return;
    }
    
    let currentIndex = 0;
    const totalPoints = coordinates.length;
    const animationSpeed = 500; // ms mellem hver opdatering - hurtigere men stadig langsom
    const stepSize = 1; // Spring kun 1 koordinat ad gangen for jævn bevægelse
    
    // Stop eksisterende animation
    if (vehicle.animationInterval) {
        clearInterval(vehicle.animationInterval);
    }
    
    vehicle.animationInterval = setInterval(() => {
        if (currentIndex >= totalPoints || !vehicle.patrolling || vehicle.status !== 'patrouillerer') {
            clearInterval(vehicle.animationInterval);
            vehicle.animationInterval = null;
            
            // Fjern rutelinjen når animationen er færdig
            if (vehicle.patrolRouteControl) {
                Game.map.removeControl(vehicle.patrolRouteControl);
                vehicle.patrolRouteControl = null;
            }
            
            if (callback) callback();
            return;
        }
        
        const coord = coordinates[currentIndex];
        vehicle.marker.setLatLng([coord.lat, coord.lng]);
        currentIndex += stepSize; // Spring kun 1 koordinat for jævn bevægelse
    }, animationSpeed);
}

/**
 * Fallback animation med direkte linje (bruges hvis routing fejler)
 * @param {Object} vehicle - Køretøjsobjektet
 * @param {Object} destination - Destinationskoordinater {lat, lng}
 * @param {Function} callback - Callback funktion når destinationen er nået
 */
function animateDirectLine(vehicle, destination, callback) {
    if (!vehicle.marker) return;
    
    const startPos = vehicle.marker.getLatLng();
    const endPos = L.latLng(destination.lat, destination.lng);
    
    const totalDistance = startPos.distanceTo(endPos); // Distance i meter
    const duration = Math.max(5000, totalDistance * 0.1); // Minimum 5 sekunder, ellers baseret på distance
    const startTime = Date.now();
    
    // Stop eksisterende animation
    if (vehicle.animationInterval) {
        clearInterval(vehicle.animationInterval);
    }
    
    vehicle.animationInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Interpolér position
        const currentLat = startPos.lat + (endPos.lat - startPos.lat) * progress;
        const currentLng = startPos.lng + (endPos.lng - startPos.lng) * progress;
        
        vehicle.marker.setLatLng([currentLat, currentLng]);
        
        if (progress >= 1) {
            clearInterval(vehicle.animationInterval);
            vehicle.animationInterval = null;
            if (callback) callback();
        }
    }, 100); // Opdater hver 100ms
}

/**
 * Stopper alle bevægelser for et køretøj
 * @param {Object} vehicle - Køretøjsobjektet
 */
function stopVehicleMovement(vehicle) {
    if (vehicle.animationInterval) {
        clearInterval(vehicle.animationInterval);
        vehicle.animationInterval = null;
    }
    
    if (vehicle.homeAnimationInterval) {
        clearInterval(vehicle.homeAnimationInterval);
        vehicle.homeAnimationInterval = null;
    }
    
    if (vehicle.routeControl && Game.map) {
        Game.map.removeControl(vehicle.routeControl);
        vehicle.routeControl = null;
    }
    
    // Stop patrouillering route control
    if (vehicle.patrolRouteControl && Game.map) {
        Game.map.removeControl(vehicle.patrolRouteControl);
        vehicle.patrolRouteControl = null;
    }
}

/**
 * Finder et køretøj baseret på ID
 * @param {string} vehicleId - ID på køretøjet
 * @returns {Object|null} - Køretøjsobjektet eller null hvis ikke fundet
 */
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

/**
 * Sender et køretøj hjem til sin station (stopper alarm/patrouillering)
 * @param {string} vehicleId - ID på køretøjet der skal sendes hjem
 */
function sendVehicleHome(vehicleId) {
    const vehicle = findVehicleById(vehicleId);
    if (!vehicle) {
        console.log('Køretøj ikke fundet');
        return;
    }
    
    // Stop alle bevægelser og animationer
    stopVehicleMovement(vehicle);
    
    // Stop patrouillering hvis køretøjet patrouillerer
    if (vehicle.patrolling) {
        vehicle.patrolling = false;
        vehicle.patrolDestination = null;
        vehicle.animationPaused = false; // Reset pause flag
    }
    
    // Fjern alarm reference hvis køretøjet var på vej til alarm
    if (vehicle.alarm) {
        vehicle.alarm = null;
        vehicle.lastDispatchedAlarmId = null;
    }
    
    // Sæt status til "på vej hjem" og start rute-animation
    vehicle.status = 'på vej hjem';
    
    // Opdater køretøjsikon først
    updateVehicleMarkerIcon(vehicle);
    
    // Start animation hjem med rutefølgning
    animateVehicleHome(vehicle);
    
    // Opdater popup hvis den er åben
    if (typeof updateVehicleMenuIfOpen === 'function') {
        updateVehicleMenuIfOpen(vehicle);
    }
    
    // Opdater UI
    Game.updateStatusPanels();
    
    console.log(`${vehicle.navn} kører hjem til ${vehicle.station.navn}`);
}

/**
 * Animerer et køretøj hjem til sin station ved at følge vejene
 * @param {Object} vehicle - Køretøjsobjektet der skal køre hjem
 */
function animateVehicleHome(vehicle) {
    if (!vehicle.marker) return;
    
    const currentPos = vehicle.marker.getLatLng();
    const homePos = vehicle.station.position;
    
    // Tjek om køretøjet er en helikopter
    if (isHelicopter(vehicle)) {
        // Helikoptere flyver direkte hjem
        vehicle.homeAnimationInterval = animateHelicopterDirectLine(
            vehicle,
            currentPos,
            homePos,
            Game.REFRESH_INTERVAL_MS,
            Game.STANDARD_TRAVEL_TIME_SECONDS,
            () => {
                // Callback når helikopteren er hjemme
                vehicle.status = 'standby';
                updateVehicleMarkerIcon(vehicle);
                vehicle.marker.setLatLng(vehicle.station.position);
                console.log(`${vehicle.navn} er ankommet hjem til ${vehicle.station.navn}`);
            }
        );
    } else {
        // Normale køretøjer følger vejene hjem
        const homeRouteControl = L.Routing.control({
            waypoints: [currentPos, L.latLng(homePos.lat, homePos.lng)],
            routeWhileDragging: false,
            addWaypoints: false,
            draggableWaypoints: false,
            createMarker: () => null, // Ingen markører
            lineOptions: { styles: [] }, // Ingen synlige linjer
            show: false, // Skjul instruktioner
            fitSelectedRoutes: false // Forhindrer auto-zoom
        });
        
        vehicle.routeControl = homeRouteControl;
        
        // Gem nuværende zoom og center for at forhindre auto-zoom
        const currentZoom = Game.map.getZoom();
        const currentCenter = Game.map.getCenter();
        
        homeRouteControl.on('routesfound', function(e) {
            const routes = e.routes;
            const route = routes[0];
            
            if (route && route.coordinates) {
                // Animér langs ruten hjem
                animateVehicleAlongRoute(vehicle, route.coordinates, () => {
                    // Callback når køretøjet er hjemme
                    vehicle.status = 'standby';
                    updateVehicleMarkerIcon(vehicle);
                    vehicle.marker.setLatLng(vehicle.station.position);
                    
                    // Fjern route control
                    if (vehicle.routeControl) {
                        Game.map.removeControl(vehicle.routeControl);
                        vehicle.routeControl = null;
                    }
                    
                    console.log(`${vehicle.navn} er ankommet hjem til ${vehicle.station.navn}`);
                });
            } else {
                // Fallback til direkte flytning hvis routing fejler
                vehicle.status = 'standby';
                vehicle.marker.setLatLng(vehicle.station.position);
                updateVehicleMarkerIcon(vehicle);
                console.log(`${vehicle.navn} er hjemme (routing fejlede)`);
            }
        });
        
        homeRouteControl.on('routingerror', function(e) {
            console.log('Routing fejl ved hjemkørsel:', e);
            // Fallback til direkte flytning
            vehicle.status = 'standby';
            vehicle.marker.setLatLng(vehicle.station.position);
            updateVehicleMarkerIcon(vehicle);
            
            if (vehicle.routeControl) {
                Game.map.removeControl(vehicle.routeControl);
                vehicle.routeControl = null;
            }
        });
        
        // Tilføj til kortet
        homeRouteControl.addTo(Game.map);
        
        // Gendan zoom og center efter routing er tilføjet
        setTimeout(() => {
            Game.map.setView(currentCenter, currentZoom);
        }, 100);
    }
}

/**
 * Animerer køretøj langs en rute hjem
 * @param {Object} vehicle - Køretøjsobjektet
 * @param {Array} coordinates - Array af koordinater langs ruten
 * @param {Function} callback - Callback funktion når destinationen er nået
 */
function animateVehicleAlongRoute(vehicle, coordinates, callback) {
    if (!vehicle.marker || !coordinates || coordinates.length === 0) {
        if (callback) callback();
        return;
    }
    
    let currentIndex = 0;
    const totalPoints = coordinates.length;
    const animationSpeed = 200; // Normal hastighed for hjemkørsel (hurtigere end patrouillering)
    const stepSize = 2; // Færre koordinater springes over for jævnere bevægelse
    
    // Stop eksisterende animation
    if (vehicle.homeAnimationInterval) {
        clearInterval(vehicle.homeAnimationInterval);
    }
    
    vehicle.homeAnimationInterval = setInterval(() => {
        if (currentIndex >= totalPoints || vehicle.status !== 'på vej hjem') {
            clearInterval(vehicle.homeAnimationInterval);
            vehicle.homeAnimationInterval = null;
            
            if (callback) callback();
            return;
        }
        
        const coord = coordinates[currentIndex];
        vehicle.marker.setLatLng([coord.lat, coord.lng]);
        currentIndex += stepSize;
    }, animationSpeed);
}

/**
 * Beregner afstanden mellem to geografiske punkter i kilometer.
 * @param {number} lat1 - Breddegrad for punkt 1.
 * @param {number} lon1 - Længdegrad for punkt 1.
 * @param {number} lat2 - Breddegrad for punkt 2.
 * @param {number} lon2 - Længdegrad for punkt 2.
 * @returns {number} Afstanden i kilometer.
 */
function distanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius af Jorden i kilometer
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Afstand i km
    return d;
}

/**
 * Tjekker om et køretøj er en helikopter baseret på dets type.
 * @param {Object} vehicle - Køretøjsobjektet der skal tjekkes.
 * @returns {boolean} True hvis køretøjet er en helikopter.
 */
function isHelicopter(vehicle) {
    return vehicle.type && vehicle.type.toLowerCase().includes('helikopter');
}

/**
 * Animerer en helikopter i en direkte linje mellem to punkter.
 * @param {Object} vehicle - Helikopter køretøjet der skal animeres.
 * @param {Object} startPos - Start position {lat, lng}.
 * @param {Object} endPos - Slut position {lat, lng}.
 * @param {number} refreshInterval - Interval (ms) for opdatering af køretøjets position.
 * @param {number} standardTravelTime - Standard rejsetid i sekunder.
 * @param {Function} onComplete - Callback funktion der kaldes når animationen er færdig.
 * @returns {number} Interval ID for animationen.
 */
function animateHelicopterDirectLine(vehicle, startPos, endPos, refreshInterval, standardTravelTime, onComplete) {
    // Helikoptere er 90% hurtigere end andre køretøjer (bruger kun 10% af tiden)
    const helicopterTravelTime = standardTravelTime * 0.1;
    const totalSteps = Math.ceil((helicopterTravelTime * 1000) / refreshInterval);
    const latStep = (endPos.lat - startPos.lat) / totalSteps;
    const lngStep = (endPos.lng - startPos.lng) / totalSteps;
    
    let currentStep = 0;
    
    const interval = setInterval(() => {
        if (currentStep >= totalSteps) {
            clearInterval(interval);
            vehicle.animationInterval = null;
            vehicle.marker.setLatLng(endPos); // Sørg for præcis slutposition
            if (onComplete) onComplete();
            return;
        }
        
        const currentLat = startPos.lat + (latStep * currentStep);
        const currentLng = startPos.lng + (lngStep * currentStep);
        vehicle.marker.setLatLng({lat: currentLat, lng: currentLng});
        
        currentStep++;
    }, refreshInterval);
    
    return interval;
}

/**
 * Hjælpefunktion til at formatere totalt antal sekunder til 'MM:SS' format.
 * @param {number} totalSeconds - Det samlede antal sekunder.
 * @returns {string} Formatteret tid i MM:SS format.
 */
function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60); // Brug Math.floor, da sekunder kan være flydende tal
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Bemærk:
// - createAlarmMarker(latlng, id, type, alarmObject)
// - updateVehicleMarkerIcon(vehicle)
// Disse funktioner skal være tilgængelige fra andre script-filer, der er indlæst før denne.