// alarmer.js
let nextAlarmId = 1; // Denne tæller skal kun tælle opad.

/**
 * Opretter en ny alarm på kortet.
 * @param {Array<Object>} stations - Array af alle stationer.
 * @param {Array<Object>} alarmsArray - Det globale array, der indeholder alle aktive alarmer (Game.alarms).
 * @param {HTMLAudioElement} alarmSound - Lyden der skal afspilles ved ny alarm.
 * @param {number} spawnRadiusKm - Radius i km omkring en station, hvor alarmen kan opstå.
 */
function createAlarm(stations, alarmsArray, alarmSound, spawnRadiusKm) { 
    if (stations.length === 0) return;

    const randomStationIndex = Math.floor(Math.random() * stations.length);
    const station = stations[randomStationIndex];

    let lat, lng, dist;
    // Sikrer at alarmen spawnes inden for den specificerede radius
    do {
        lat = station.position.lat + (Math.random() - 0.5) * (spawnRadiusKm / 111.32); // Ca. grader pr. KM
        lng = station.position.lng + (Math.random() - 0.5) * (spawnRadiusKm / (111.32 * Math.cos(station.position.lat * Math.PI / 180)));
        dist = distanceKm(station.position.lat, station.position.lng, lat, lng);
    } while (dist > spawnRadiusKm);

    const type = alarmTypes[Math.floor(Math.random() * alarmTypes.length)];
    // Bruger den globale, inkrementerende tæller for unikke ID'er
    const id = nextAlarmId++; 
    
    const alarm = { 
        id, 
        type, 
        position: { lat, lng }, 
        marker: null, 
        dispatchedVehiclesCount: 0, // NY: Tæller sendte køretøjer til denne alarm
        resolvedVehiclesCount: 0,  // NY: Tæller ankomne køretøjer til denne alarm
        creationTime: Game.gameTime // NY: Gemmer spiltidspunktet for alarmens oprettelse
    };
    // Antager createAlarmMarker funktionen er defineret et andet sted (f.eks. map.js)
    alarm.marker = createAlarmMarker({ lat, lng }, id, type, alarm); 
    
    alarmsArray.push(alarm);
    alarmSound.play().catch(() => {}); // Afspiller alarmlyd, fanger fejl hvis lyden ikke kan afspilles
    Game.updateStatusPanels(); // Vigtigt: Opdater UI når en ny alarm er oprettet
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
        // Dette er nødvendigt for redirection fra "på vej hjem" status
        if (vehicle.routeControl) { 
            mapInstance.removeControl(vehicle.routeControl);
            vehicle.routeControl = null; 
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
 * (Denne funktion skal være tilgængelig globalt eller i en utils.js fil)
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
// - getRandomAlarmType() // Bruges i createAlarm, men den hardcoded liste her betyder den ikke nødvendigvis er nødvendig
// - getRandomLocationNearStations(stations, radius) // Kan erstattes af logikken i createAlarm

// Disse funktioner skal enten inkluderes direkte i denne fil, 
// eller være tilgængelige fra andre script-filer, der er indlæst før denne.