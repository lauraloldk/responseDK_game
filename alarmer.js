// alarmer.js

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

function createAlarm(stations, alarmsArray, alarmSound) {
    if (stations.length === 0) return;

    const randomStationIndex = Math.floor(Math.random() * stations.length);
    const station = stations[randomStationIndex];

    let lat, lng, dist;
    do {
        lat = station.position.lat + (Math.random() - 0.5) * 0.2;
        lng = station.position.lng + (Math.random() - 0.5) * 0.2;
        dist = distanceKm(station.position.lat, station.position.lng, lat, lng);
    } while (dist > 10); 

    const type = alarmTypes[Math.floor(Math.random() * alarmTypes.length)];
    const id = alarmsArray.length + 1;
    
    // Opret alarmmarkør via map.js
    const alarm = { id, type, position: { lat, lng }, marker: null, activeVehicles: 0 };
    alarm.marker = createAlarmMarker({ lat, lng }, id, type, alarm);
    
    alarmsArray.push(alarm);
    alarmSound.play().catch(() => {});
}

function sendVehiclesToAlarm(
    alarm, 
    vehiclesToSend, 
    mapInstance, 
    refreshInterval, 
    standardTravelTime, 
    allStations, // For at kunne rydde alarmreferencer
    allAlarms, // For at kunne fjerne alarmen fra listen
    missionLog // For at logge missionen
) {
    const startTime = Date.now();
    
    vehiclesToSend.forEach(vehicle => {
        if (!vehicle.marker) return;

        vehicle.status = "undervejs";
        vehicle.alarm = alarm; // Tildel alarmen til køretøjet
        updateVehicleMarkerIcon(vehicle); // Opdater ikon via map.js

        if (vehicle.routeControl) { // Fjern tidligere rute, hvis den eksisterer
            mapInstance.removeControl(vehicle.routeControl);
        }

        const routeControl = L.Routing.control({
            waypoints: [vehicle.marker.getLatLng(), L.latLng(alarm.position.lat, alarm.position.lng)],
            routeWhileDragging: false,
            addWaypoints: false,
            draggableWaypoints: false,
            createMarker: () => null,
            lineOptions: { styles: [{ color: 'blue', opacity: 0.6, weight: 6 }] } // Vis ruten
        });
        
        vehicle.routeControl = routeControl; // Gem ruten på køretøjet
        routeControl.addTo(mapInstance);

        routeControl.on('routesfound', function (e) {
            const coords = e.routes[0].coordinates;
            const numUpdates = (standardTravelTime * 1000) / refreshInterval;
            const stepSize = Math.max(1, Math.floor(coords.length / numUpdates));
            let i = 0;

            const interval = setInterval(() => {
                if (i >= coords.length) {
                    clearInterval(interval);
                    vehicle.status = "ved alarm";
                    updateVehicleMarkerIcon(vehicle);

                    // Fjern ruten når køretøjet er fremme
                    if (vehicle.routeControl) {
                        mapInstance.removeControl(vehicle.routeControl);
                        vehicle.routeControl = null;
                    }

                    // Tjek om dette er det første køretøj, der ankommer, eller det sidste
                    // Hvis du vil fjerne alarmen med det samme, kan du gøre det her.
                    // For nu fjerner vi den, når et køretøj er sendt afsted.
                    resolveAlarm(alarm, [vehicle], startTime, allAlarms, allStations, mapInstance, missionLog);
                    vehicle.alarm = null; // Ryd alarm fra køretøjet, da alarmen er 'løst'

                    // Simulerer tid ved alarm, før den kører hjem
                    setTimeout(() => { 
                        vehicle.status = "på vej hjem"; 
                        updateVehicleMarkerIcon(vehicle);

                        const homeControl = L.Routing.control({
                            waypoints: [alarm.position, vehicle.station.position],
                            routeWhileDragging: false,
                            addWaypoints: false,
                            draggableWaypoints: false,
                            createMarker: () => null,
                            lineOptions: { styles: [{ color: 'green', opacity: 0.6, weight: 6 }] } // Vis hjemruten
                        });
                        vehicle.routeControl = homeControl; // Gem hjemruten
                        homeControl.addTo(mapInstance);

                        homeControl.on('routesfound', function (e2) {
                            const homeCoords = e2.routes[0].coordinates;
                            const homeNumUpdates = (standardTravelTime * 1000) / refreshInterval;
                            const homeStep = Math.max(1, Math.floor(homeCoords.length / homeNumUpdates));
                            let j = 0;
                            const homeInterval = setInterval(() => {
                                if (j >= homeCoords.length) {
                                    clearInterval(homeInterval);
                                    vehicle.status = "standby"; 
                                    updateVehicleMarkerIcon(vehicle);
                                    if (vehicle.routeControl) { // Fjern hjemruten
                                        mapInstance.removeControl(vehicle.routeControl);
                                        vehicle.routeControl = null;
                                    }
                                    return;
                                }
                                vehicle.marker.setLatLng(homeCoords[j]);
                                j += homeStep;
                            }, refreshInterval); 
                        });
                        homeControl.route();
                    }, Math.floor(Math.random() * (300000 - 5000 + 1)) + 5000); // Mellem 5 sek og 5 min ved alarm
                    return;
                }
                vehicle.marker.setLatLng(coords[i]);
                i += stepSize;
            }, refreshInterval); 
        });

        routeControl.route(); // Start ruten
    });
}

function resolveAlarm(alarm, vehicles, startTime, allAlarms, allStations, mapInstance, missionLog) {
    // Fjern alarmmarkøren fra kortet
    if (alarm.marker) {
        mapInstance.removeLayer(alarm.marker);
    }
    
    // Fjern alarmen fra det globale alarmer-array
    const alarmIndex = allAlarms.findIndex(a => a.id === alarm.id);
    if (alarmIndex > -1) {
        allAlarms.splice(alarmIndex, 1);
    }

    const endTime = Date.now();
    missionLog.push({
        alarmId: alarm.id,
        type: alarm.type,
        time: new Date().toLocaleTimeString(),
        vehicles: vehicles.map(k => k.navn),
        responseTime: ((endTime - startTime) / 1000).toFixed(1) + ' sek'
    });

    // Sikre at alle køretøjer, der var tildelt denne alarm, får deres alarmreference nulstillet
    allStations.forEach(st => {
        st.køretøjer.forEach(k => {
            if (k.alarm && k.alarm.id === alarm.id) {
                k.alarm = null;
            }
        });
    });
}


function resolveAlarmManually(alarmToResolve) {
    if (confirm(`Fjern alarm #${alarmToResolve.id}: ${alarmToResolve.type} manuelt?`)) {
        // Find alarmen i Game.alarms arrayet
        const alarmIndex = Game.alarms.findIndex(a => a.id === alarmToResolve.id);
        if (alarmIndex > -1) {
            const alarm = Game.alarms[alarmIndex];
            
            // Fjern markøren fra kortet
            if (alarm.marker) {
                Game.map.removeLayer(alarm.marker);
            }
            
            // Log alarmen som løst
            Game.missionLog.push({
                alarmId: alarm.id,
                type: alarm.type,
                time: new Date().toLocaleTimeString(),
                vehicles: [], // Ingen køretøjer sendt
                responseTime: "Manuelt afsluttet"
            });

            // Fjern alarmen fra Game.alarms arrayet
            Game.alarms.splice(alarmIndex, 1);

            // Nulstil alarmreferencer og status for køretøjer, der måtte være på vej til/ved denne alarm
            Game.stations.forEach(st => {
                st.køretøjer.forEach(k => {
                    if (k.alarm && k.alarm.id === alarmToResolve.id) {
                        if (k.routeControl) {
                            Game.map.removeControl(k.routeControl); // Fjern ruten fra kortet
                            k.routeControl = null;
                        }
                        k.alarm = null;
                        k.status = 'standby'; // Sæt til standby med det samme
                        updateVehicleMarkerIcon(k); // Opdater ikon
                    }
                });
            });
        }
    }
}