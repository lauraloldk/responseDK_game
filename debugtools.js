// debugtools.js - Test og debug værktøjer til brandsimulering

// Test vand-alarm funktionalitet
async function testWaterAlarm() {
    if (Game.stations.length === 0) {
        alert('Tilføj venligst mindst én station først.');
        return;
    }
    
    console.log('Tester vand-alarm funktionalitet...');
    
    // Gennemtving en vand-alarm til test
    const waterAlarms = alarmTypes.filter(alarm => alarm.includes('#only-on-water#'));
    if (waterAlarms.length === 0) {
        alert('Ingen vand-alarmer fundet i alarmlisten!');
        return;
    }
    
    const selectedWaterAlarm = waterAlarms[Math.floor(Math.random() * waterAlarms.length)];
    console.log(`Forsøger at spawne vand-alarm: "${selectedWaterAlarm}"`);
    
    // Brug createAlarm funktionalitet men med en specifik alarm-type
    await createTestWaterAlarm(Game.stations, Game.alarms, Game.alarmSound, Game.ALARM_SPAWN_RADIUS_KM, selectedWaterAlarm);
}

// Specialiseret funktion til at teste vand-alarmer
async function createTestWaterAlarm(stations, alarmsArray, alarmSound, spawnRadiusKm, forcedAlarmType) {
    if (stations.length === 0) return;

    const randomStationIndex = Math.floor(Math.random() * stations.length);
    const station = stations[randomStationIndex];
    
    let lat, lng, dist;
    let validLocation = false;
    let attempts = 0;
    const maxAttempts = 30; // Flere forsøg for test
    
    console.log(`Søger efter vand-lokation for "${forcedAlarmType}"...`);
    
    while (!validLocation && attempts < maxAttempts) {
        // Generer tilfældig lokation inden for radius
        lat = station.position.lat + (Math.random() - 0.5) * (spawnRadiusKm / 111.32);
        lng = station.position.lng + (Math.random() - 0.5) * (spawnRadiusKm / (111.32 * Math.cos(station.position.lat * Math.PI / 180)));
        dist = distanceKm(station.position.lat, station.position.lng, lat, lng);
        
        if (dist <= spawnRadiusKm) {
            const isOnWater = await isLocationOnWater(lat, lng);
            console.log(`Test lokation ${lat.toFixed(4)}, ${lng.toFixed(4)} - på vand: ${isOnWater}`);
            
            if (isOnWater) {
                validLocation = true;
                console.log('✓ Vand-lokation fundet for test!');
            }
        }
        
        attempts++;
    }
    
    if (!validLocation) {
        alert(`Kunne ikke finde en vand-lokation efter ${maxAttempts} forsøg. Prøv med en større radius eller en anden station.`);
        return;
    }
    
    // Rens alarm-teksten for tags
    const cleanedAlarmType = cleanAlarmText(forcedAlarmType);
    
    const id = nextAlarmId++;
    const alarm = { 
        id, 
        type: cleanedAlarmType, 
        position: { lat, lng }, 
        marker: null, 
        dispatchedVehiclesCount: 0,
        resolvedVehiclesCount: 0,
        creationTime: Game.gameTime
    };
    
    alarm.marker = createAlarmMarker({ lat, lng }, id, cleanedAlarmType, alarm); 
    alarmsArray.push(alarm);
    alarmSound.play().catch(() => {});
    Game.updateStatusPanels();
    
    console.log(`🌊 Test vand-alarm spawnet: "${cleanedAlarmType}" på ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
}

// Test specifikke danske vand-lokationer
async function testDanishWaterLocations() {
    console.log('🗺️ Tester danske vand-lokationer:');
    console.log('Rydder cache for præcise tests...');
    
    // Ryd cache for at få friske resultater
    if (typeof waterLocationCache !== 'undefined') {
        waterLocationCache.clear();
    }
    
    const testLocations = [
        { lat: 55.2, lng: 12.2, name: "Øresund (vand)", expected: true },
        { lat: 57.7, lng: 10.6, name: "Skagerrak (vand)", expected: true },
        { lat: 56.0, lng: 9.9, name: "Limfjorden (vand)", expected: true },
        { lat: 55.4, lng: 11.1, name: "Store Bælt (vand)", expected: true },
        { lat: 54.9, lng: 11.9, name: "Lolland kyst (vand)", expected: true },
        { lat: 55.6761, lng: 12.5683, name: "København centrum (land)", expected: false },
        { lat: 56.1629, lng: 10.2039, name: "Aarhus centrum (land)", expected: false },
        { lat: 55.4038, lng: 10.4024, name: "Odense centrum (land)", expected: false }
    ];
    
    console.log('📊 Testresultater:');
    let correctPredictions = 0;
    
    for (const loc of testLocations) {
        const isWater = await isLocationOnWater(loc.lat, loc.lng);
        const isCorrect = isWater === loc.expected;
        correctPredictions += isCorrect ? 1 : 0;
        
        const status = isCorrect ? '✅' : '❌';
        const result = isWater ? '🌊 VAND' : '🏞️ LAND';
        console.log(`${status} ${loc.name}: ${result} (forventet: ${loc.expected ? 'VAND' : 'LAND'})`);
    }
    
    const accuracy = (correctPredictions / testLocations.length * 100).toFixed(1);
    console.log(`\n📈 Nøjagtighed: ${correctPredictions}/${testLocations.length} (${accuracy}%)`);
    
    if (accuracy < 70) {
        console.warn('⚠️ Lav nøjagtighed - vand-detektering kan have problemer');
    } else {
        console.log('✅ Vand-detektering fungerer tilfredsstillende');
    }
}

// Test land-alarm funktionalitet
async function testLandAlarm() {
    if (Game.stations.length === 0) {
        alert('Tilføj venligst mindst én station først.');
        return;
    }
    
    console.log('Tester land-alarm funktionalitet...');
    
    const landAlarms = alarmTypes.filter(alarm => 
        !alarm.includes('#only-on-water#') && !alarm.includes('#can-spawn-on-water#')
    );
    
    if (landAlarms.length === 0) {
        alert('Ingen land-alarmer fundet!');
        return;
    }
    
    const selectedLandAlarm = landAlarms[Math.floor(Math.random() * landAlarms.length)];
    console.log(`Forsøger at spawne land-alarm: "${selectedLandAlarm}"`);
    
    // Brug standard createAlarm - den burde spawne på land
    await createAlarm(Game.stations, Game.alarms, Game.alarmSound, Game.ALARM_SPAWN_RADIUS_KM);
}

// Test patrulje vand/land logik
async function testPatrolWaterLogic() {
    if (Game.stations.length === 0) {
        alert('Tilføj venligst mindst én station først.');
        return;
    }
    
    // Find det første køretøj der patrouillerer
    let patrollingVehicle = null;
    for (const station of Game.stations) {
        for (const vehicle of station.køretøjer) {
            if (vehicle.status === 'patrouillerer') {
                patrollingVehicle = vehicle;
                break;
            }
        }
        if (patrollingVehicle) break;
    }
    
    if (!patrollingVehicle) {
        alert('Ingen køretøjer patrouillerer i øjeblikket. Start en patrulje først.');
        return;
    }
    
    const isHeli = isHelicopter(patrollingVehicle);
    console.log(`🔍 Testing patrulje-logik for ${patrollingVehicle.navn} (${isHeli ? 'Helikopter' : 'Landkøretøj'})`);
    
    if (isHeli) {
        console.log('🚁 Helikopter kan flyve over vand og land');
    } else {
        console.log('🚗 Landkøretøj skal holde sig på land');
    }
    
    // Gennemtving et nyt patrulje-punkt
    await moveToRandomPatrolPoint(patrollingVehicle);
}

// Hjælpefunktion til at rydde vand-cache
function clearWaterCache() {
    if (typeof waterLocationCache !== 'undefined') {
        const cacheSize = waterLocationCache.size;
        waterLocationCache.clear();
        console.log(`🗑️ Ryddede ${cacheSize} cachede vand-lokationer`);
        alert(`Cache ryddet! ${cacheSize} lokationer fjernet fra cache.`);
    } else {
        console.log('Vand-cache ikke tilgængelig');
        alert('Cache ikke tilgængelig.');
    }
}
