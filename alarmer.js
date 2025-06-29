// alarmer.js
let nextAlarmId = 1; // Denne tæller skal kun tælle opad.
const alarmTypes = [
    "Bygningsbrand (Villa/Rækkehus)", "Skovbrand", "Affaldsbrand", "Industri- og fabriksbrand", "Brand i erhvervsbygning",
    "Fritstående bygning – brand", "Brand i kælder", "Bilbrand", "Brand i container", "Brand i maskinhus", "Elbrand", 
    "Brand i affaldscontainer", "Brand på tag", "Brand i skur", "Hedebrand", "Brand i stald", "Brand i landbrugsbygning", 
    "Brand i campingvogn", "Brand i båd", "Brand på vej", "Gaseksplosion", "Brand i traktor", "Brand i tog", 
    "Eksplosion i industri", "Brand på fabrik", "Brand på containerterminal", "Brand i motorcykel", "Menneskelig fejl ved brand", 
    "Brand i silo", "Brand på parkeringsplads", "Brand i tømmerlager", "Brand i offentligt toilet", "Brand i lejlighed", 
    "Brand i restaurant", "Brand på byggeplads", "Brand i højhus", "Brand på lufthavn", "Brand på skib", "Brand i gasværk", 
    "Brand i græsmark", "Brand i industribygning", "Brand i fjernvarme", "Brand i teknikrum", "Brand på station", 
    "Brand på rasteplads", "Brand i højhus", "Brand i stuehus", "Brand i lastbil", "Brand i maskinerum", "Brand på motorvej", 
    "Brand i telefonkiosk", "Brand i containerpark", "Brud på gasledning", "Brand i skovrydning", "Brand i trafikskilt", 
    "Brand i havn", "Brand i betongulv", "Brand på helikopter", "Brand i samlingshus", "Brand i daginstitution", 
    "Brand på rasteplads", "Brand i skolebygning", "Brand i el-tavle", "Brand på sportshal", "Brand i kulturhus", 
    "Brand i brokonstruktion", "Brand i brohus", "Brand i transformerstation", "Brand i stengrå område", "Brand i lysmast", 
    "Brand i bunker", "Brand i butikslager", "Brand i underjordisk garage", "Brand på autobahn", "Brand på affaldsplads", 
    "Brand på loft", "Brand i bunker", "Brand på tankstation", "Brand på arbejdsplads", "Brand i bygning med kemikalier", 
    "Brand på fritidshusområde", "Brand i skovområde", "Brand i industrikøkken", "Brand i brandstation", "Brand i jernbaneoverskæring", 
    "Brand i værksted", "Brand i bygningskonstruktion", "Brand i vejledningstelt", "Brand i industripark", "Brand på metrostation", 
    "Brand på lufthavnsområde", "Brand i kraftværk", "Brand i affaldsdepot", "Brand i cykelskure", "Brand i containerby", 
    "Brand på flisearbejde", "Brand i maritimt område", "Brand i psykiatrisk afdeling", "Brand i dyrepark", "Brand i kemisk lager", 
    "Ambulanceudkald", "Hjertestop", "Hjerneskader", "Hovedtraume", "Trafikulykke", "Faldulykke", "Kvælning", "Forgiftning", 
    "Åndedrætsbesvær", "Svimmelhed/Bevidstløshed", "Akut mavesmerter", "Allergisk reaktion", "Astmaanfald", "Hjerteanfald", 
    "Blødning – ekstern", "Komplikation ved fødsel", "Børneulykke", "Børneskader", "Væsketab (dehydrering)", 
    "Diabetesrelateret nødsituation", "Epileptisk anfald", "Tågehæmning (hjerneblødning)", "Slagtilfælde", 
    "Ulykke på arbejdspladsen", "Våd ulykke (vandskader)", "Løbende feber", "Hjerteløs genoplivning", 
    "Almindelig skader i hjemmet", "Overdosis", "Graviditetsrelateret nødsituation", "Pludselig feberkrampe", 
    "Hjerteproblemer", "Høj feber hos spædbarn", "Akut rygsmerte", "Ulykke med brud", "Miste bevidsthed", 
    "Akut sygdom – uspecificeret", "Børnefødselsproblemer", "Synkope (pludselig besvimelse)", "Ødelagt led (f.eks. skulder, albue)", 
    "Amputation", "Alvorlig forbrænding", "Bidskader", "Dyb stikskade", "Graviditet og fødsel", "Smerter i brystet", 
    "Bevidstløshed efter stød", "Trafikuheld med personskader", "Børneekstremforgiftning", "Blindtarmsbetændelse", 
    "Ødelagte organer (f.eks. indre organer)", "Overophedning (hedebølge)", "Feberanfald", "Koldbrand", "Venøs trombose", 
    "Bevidstløshed ved fald", "Kørsel af fejlinformation", "Hjernekrise", "Svær dehydrering", "Forstoppelse", 
    "Ortopædisk skade", "Behandling af sårinfektion", "Blodprop i lungerne", "Svært åndedrætsbesvær", "Hjernemisdannelse", 
    "Smerter i kæben", "Lammelse", "Fysiologisk chok", "Blod i opkast", "Blødning i munden", "Ulykke med elektrisk stød", 
    "Fejlbehandling ved pilleindtag", "Uventet fødsel", "Urinvejsinfektion", "Ødelagt lårben", "Kræftrelateret nød", 
    "Ødelagt rygsøjle", "Ødelagt håndled", "Hjernerystelse", "Akut lungebetændelse", "Alvorlig betændelse", 
    "Politiudkald", "Røveri", "Indbrud", "Overfald", "Vold", "Vandalism", "Tyveri", "Biltyveri", "Indbrud i butik", 
    "Maskeret forbrydelse", "Ulykke med alvorlig personskade", "Voldtægt", "Trafikulykke (drab, mistænkeligt)", 
    "Bombetrussel", "Husrøveri", "Kørsel under påvirkning", "Kørsel uden førerret", "Hjemmeinvasion", "Narkotikahandel", 
    "Tyveri fra butik", "Mistænkelig aktivitet", "Brandstiftelse", "Hærværk", "Trafikkontroller", 
    "Håndtering af psykisk syg person", "Personer på flugt", "Forbrydelse i offentlig transport", 
    "Larm fra offentlige områder", "Misbrug af våben", "Låst dør eller sikkerhedslås", "Ulovlig samling", 
    "Uroligheder i offentlig transport", "Mistænkt iakttagelse af forbrydelse", "Angreb på offentlig ansatte", 
    "Misbrug af alkohol", "Trusselsituation", "Smugling af varer", "Svindel med penge", "Ulovlig parkering", 
    "Misbrug af offentlig orden", "Varmgang på arbejdspladsen", "Ulykke ved offentlig institution", 
    "Elektronisk tyveri", "Overvågning af mistænkte", "Hvidvaskning af penge", "Spionage", 
    "Kriminalitet i offentlig transport", "Misbrug af midler", "Vold i skoler og institutioner", 
    "Trusler mod ansatte", "Uro i boligområde", "Hærværk på offentlig bygning", "Sabotage", 
    "Organiseret kriminalitet", "Bilbrænding", "Ulovlige demonstrationer", "Indbrud i køretøj", 
    "Mistænkeligt udenlandsk køb", "Forsøg på vold", "Uorden på offentlige steder", "Ulovlig indrejse", 
    "Svindel i bankforretninger", "Forbrydelse på arbejdspladsen", "Blokering af vej", 
    "Kriminalitet i sportsarena", "Forbrydelse under festival", "Razzia i virksomhed", "Brud på brandregler", 
    "Stjålne identiteter", "Ulovlig reklameplacering", "Organiseret røveri", "Stjålet køretøj i aktivitet", 
    "Skovtyveri", "Sømand på flugt", "Forbrydelse i supermarked", "Manipulation af politisk system", 
    "Misbrug af medier", "Kønsbaseret vold", "Misbrug af magtposition", "Cyberkriminalitet", 
    "Ødelæggelse af offentlige optegnelser", "Bilnedbrud", "Fladt dæk", "Ulykke med personskader", 
    "Ulykke uden personskader", "Bilbrænding (på vej)", "Overophedning af motor", "Benzinmangel", 
    "Starthjælp (batteriudladning)", "Motorstop", "Vejspærring", "Vejrforhold (snestorm, isglatte veje)", 
    "Køretøj sidder fast i sne", "Kædedyseproblemer (tuning motor)", "Pumpefejl (brændstofpumpe)", 
    "Kørsel uden førerret", "Mistet bilnøgle", "Køretøj ude af kontrol", "Fejl på bilens bremser", 
    "Aflæsning af bilens batteristatus", "Bil på sidevej (ikke tilkaldt politi)", "Bil på forkert vej", 
    "Elbil med lav batteri (kan ikke komme videre)", "Køretøj på landevej (hæmmer trafik)", 
    "Udskiftning af lyspære", "Reparation af bilens motor", "Ulykkestilfælde med flere køretøjer", 
    "Håndtering af parkeret køretøj på ulovlig plads", "Køretøj fast i mudder", "Køretøj fast i vand (flod, regn)", 
    "Køretøj fast i sand", "Vejhjælp med lastbil", "Tjek af dæktryk", "Spærret kørsel (vejarbejde)", 
    "Vejhjælp på motorvej", "Kørsel uden bilforsikring", "Skader på bilens støddæmper", 
    "Reparation af bilens elektriske system", "Håndtering af kemikalieudslip", "Vejhjælp til påkørt køretøj", 
    "Hjulskift ved vejkant", "Reparation af bilens aircondition", "Kørsel med mistænkt motorstøj", 
    "Fejl på bilens gearkasse", "Reparation af forlygte", "Brændstofpumpefejl", "Køretøj låst (sammenbrudt låsesystem)", 
    "Håndtering af udslip af væsker fra køretøj", "Vejhjælp til køretøj med mistet kørekort", 
    "Udfordringer med bilens udstødning", "Defekt bilvinduesvisker", "Problemer med bilens klimaanlæg", 
    "Vejhjælp med lastbil på sidevej", "Ulykkesbilen på hovedvej", "Skader på bilens undercarriage", 
    "Nedbrudt køretøj ved jernbaneoverkørsel", "Bilproblemer i tæt tåge", "Køretøj med hæmmet motorfunktion", 
    "Ulykkesbil med væltning", "Vejhjælp med køretøj på bakketop", "Faldende temperaturer – frostfare", 
    "Køretøj på sneglat vej", "Vejhjælp til køretøj på grusvej", "Køretøj med for høj hastighed i dårligt vejr", 
    "Hjulskift på landvej", "Stoppet køretøj i midterrabatten", "Køretøj på bro (problemer ved konstruktion)", 
    "Kørsel med for tung last", "Skader på køretøjets ledningssystem", "Køretøj fast på bakketop", 
    "Håndtering af opstået gaslækage i køretøj", "Problemer med bilens affjedring", "Køretøj ude af vejbanen i sving", 
    "Vejhjælp til køretøj på glat vej", "Mangel på bremsesystem i bil", "Ulykkesbil, som er blevet påkørt bagfra", 
    "Køretøj med problemer med motorens kølesystem", "Skader på bilens karrosseri", "Fejl i bilens elektriske forbindelser", 
    "Køretøj med defekte bremseklodser", "Skader på køretøjets hjulophæng", "Stoppet køretøj med motorlugt", 
    "Køretøj med fejl i gearsystemet", "Vejhjælp til køretøj, der mister olie", "Vejhjælp til køretøj med defekte tændrør", 
    "Køretøj på væltet bro", "Køretøj fast i mudder og vand", "Bil på udkig efter tankstation", 
    "Vejhjælp til defekte lygter", "Kørsel med mistet forrude", "Håndtering af ukendt væske på vej", 
    "Ulykke med knust dæk", "Stoppet køretøj på vej med høj hastighed", "Reparation af bilens klimaanlæg", 
    "Problemer med bilens vejhjul", "Vejhjælp til lastbil i kold temperatur", "Vejhjælp ved landskabsopgradering", 
    "Køretøj med knækket aksel", "Reparation af bilens startmotor", "Køretøj på forladt vej", "Hjulskift på lastbil", 
    "Køretøj fast på motorvej", "Reparation af brændstofpumpen", "Ulykkesbil på motorvej", "Køretøj fast i tæt trafik", 
    "Hjulproblemer på vej mod servicecenter", "Vejhjælp på landevej", "Fejl på bilens styresystem", 
    "Køretøj skadet under hastig opbremsning", "Køretøj med utæt kobling", "Køretøj kører uden tilstrækkelig olie", 
    "Problemer med bilens dyse", "Køretøj fast i sandbanke", "Motorbrænding og udfald", "Vejhjælp til uheldig bil i regnvejr", 
    "Stoppet køretøj i vejsidehøjde", "Reparation af bilens motorventilator", "Fastkørt køretøj med kølesystemfejl", 
    "Køretøj, der er parkeret ulovligt", "Vejhjælp til køretøj med skader på vejen", "Bil med driftsforstyrrelser", 
    "Sprængt vandledning", "Strømsvigt i boligblok", "Manglende varmeforsyning", "Sprunget fjernvarmerør", "Læk i gasledning", 
    "Vandtryk for lavt", "Alarm fra kloakpumpestation", "Defekt gadelygte", "Afbrudt internettjeneste", 
    "Signalfejl i trafikstyring", "Udstyr til fjernvarme svigter", "Driftsforstyrrelser på renseanlæg", 
    "Vandprøve ikke godkendt", "Lækage fra spildevandsledning", "Akut problemer med gadelys", 
    "Hjælp til hjemmepleje borger", "Alarm fra nødkald", "Person faldet i hjemmet", "Mistanke om sygdom hos borger", 
    "Mistanke om overgreb", "Vold mod personale", "Psykisk ustabil borger forsvundet", "Defekt dør til kommunal bygning", 
    "Vandindtrængning i kælder", "Skader på skolemur", "Manglende varme i daginstitution", "Elevator ude af drift", 
    "Skader på tag/tagrender", "Graffiti på skoler", "Vandlækage i idrætshal", "Låst nødudgang", 
    "Skimmelsvamp i offentlig bygning", "Brandslukningsudstyr mangler", "Hærværk på toiletbygning i park", 
    "Problemer med offentlige toiletter", "Manglende adgang til sportshal", "Defekt elevator i ældrebolig", 
    "Skadedyrsangreb i institution", "Skadedyr registreret (rotter/myrer/duer)", "Frostskade på vandrør", 
    "Overvågning: uautoriseret adgang til teknisk rum", "Nedbrudt automatiske døre", "Overophedning af serverrum", 
    "Defekt klimaanlæg", "El-tavle fejl", "Støj fra ventilationsanlæg", "Nedbrudt ventilationsanlæg", 
    "For højt vandstand i kælder", "Ulovlig affaldsdeponering", "Døde dyr i naturen", "Forurening af sø/vandløb", 
    "Manglende tømning af skraldespande i park", "Nedfaldne grene i anlæg", "Sprøjtegiftspild", "Røg/brand i naturområde", 
    "Overfyldt container", "Graffiti på offentlige arealer", "Oversvømmelse af rekreativt område", 
    "Giftig algeblomst i sø", "Kemikalieudslip fra virksomhed", "Olietønde i å", "Invasiv art observeret", 
    "Skovsvampe på offentligt område", "Hul i vejbanen", "Løse fliser på fortov", "Nedfalden vejskilt", 
    "Vejbump beskadiget", "Skiltning mangler", "Vejskader efter frost", "Oversvømmelse af vej", 
    "Defekt gadelys", "Trafiklys ude af drift", "Manglende saltning/rydning", "Træ eller gren spærrer vej", 
    "Manglende snerydning", "Olie-/kemikalieudslip på vej", "Vejarbejde ikke afmærket", "Hærværk på busstoppested", 
    "Glas på cykelsti", "Cykelstativer væltet", "Manglende affaldsopsamling ved vej", "Skade på rabat", 
    "Fejlmeldt gadebelysning", "Tåge på hovedvej", "Trafikprop pga. vejarbejde", "Defekt vejspærre", 
    "Stort strømudfald i bydel", "Kommunal traktor punkteret", "Voldsom gæst ved indgang", "Udsmidning nødvendig", 
    "Vold mod dørmand", "Trussel mod personale", "Gæst med våben", "Beruset gæst", "Slagsmål i køen", 
    "Uønsket gæst forsøger adgang", "Mistanke om falsk ID", "Gæst med stoffer", "Nægtelse af at forlade stedet", 
    "Trussel mod andre gæster", "Gruppe optræder truende", "Tyveri i garderobe/bar/kasse", "Uro i VIP-område", 
    "Seksuel chikane", "Overfald udenfor klub", "Ambulance tilkaldt til gæst", "Mistanke om tricktyveri", 
    "Overtrædelse af påbud", "Uro mellem gæster og personale", "Mistanke om menneskehandel", "Mistanke om menneskehandel", 
    "Nødsituation ved nødudgang", "Klager over diskrimination", "Klager over sikkerhed", "Vagtalarmer generelt", 
    "Indbrudsalarm", "Panikalarm", "Overfaldsalarm", "Udløst brandalarm", "Mistænkelig person observeret", 
    "Dør/port står åben", "Glasbrudsalarm", "Fejl på alarmsystem", "Skalsikring brudt", "Tyveri fra butik", 
    "Person tilbageholdes", "Mistænkelig bil på parkeringsplads", "Kamera offline", "Vagtrundering forsinket", 
    "Vagt har brug for backup", "Alarm for pengeskab", "Overfald på ansat", "Hærværk på toilet", "Strømsvigt i overvågning"
];

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

        vehicle.status = "undervejs";
        vehicle.alarm = alarm; // Sæt en reference til den alarm, køretøjet kører til
        vehicle.lastDispatchedAlarmId = alarm.id; // Ny: Gem ID'et for den senest udsendte alarm på køretøjet.
        updateVehicleMarkerIcon(vehicle); // Antager updateVehicleMarkerIcon er defineret

        // Fjern tidligere rute, hvis den eksisterer (sikkerhedsforanstaltning)
        if (vehicle.routeControl) { 
            mapInstance.removeControl(vehicle.routeControl);
            vehicle.routeControl = null; 
        }

        // --- RUTE TIL ALARM ---
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
        routeControl.addTo(mapInstance);

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
                        homeControl.addTo(mapInstance);

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
                        });
                        homeControl.route(); // Start ruten hjem
                    }, Math.floor(Math.random() * (300000 - 5000 + 1)) + 5000); // Simulerer tid ved alarm: Mellem 5 sek og 5 min
                    return;
                }
                vehicle.marker.setLatLng(coords[i]);
                i += stepIndexIncrement;
            }, refreshInterval); 
        });

        routeControl.route(); // Start ruten til alarmen for dette køretøj
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
                        if (k.routeControl) {
                            Game.map.removeControl(k.routeControl); 
                            k.routeControl = null;
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