// customROM.js

// Boolean for at aktivere/deaktivere auto-load af custom ROM ved opstart
const LOAD_CUSTOM_ROM_ON_STARTUP = false;

// Custom ROM data - dette er et foruddefineret spil der kan loades automatisk
const CUSTOM_ROM_DATA = "eyJzdGF0aW9ucyI6W3siaWQiOiJzdGF0aW9uXzE3MDQxMjQ4MDAwMDAiLCJuYW1lIjoiSG92ZWRzdGFkZW4gQnJhbmRzdGF0aW9uIiwicG9zaXRpb24iOnsibGF0Ijo1NS42NzYwOTcsImxuZyI6MTIuNTY4MzM3fSwidmVoaWNsZUNvbmZpZ3MiOlt7ImlkIjoidmVoaWNsZV8xNzA0MTI0ODAwMDAxXzEiLCJuYW1lIjoiQnJhbmRiaWwgMSIsInR5cGUiOiJCcmFuZGJpbCIsInN0YXRpb25JZCI6InN0YXRpb25fMTcwNDEyNDgwMDAwMCJ9LHsiaWQiOiJ2ZWhpY2xlXzE3MDQxMjQ4MDAwMDFfMiIsIm5hbWUiOiJCcmFuZGJpbCAyIiwidHlwZSI6IkJyYW5kYmlsIiwic3RhdGlvbklkIjoic3RhdGlvbl8xNzA0MTI0ODAwMDAwIn0seyJpZCI6InZlaGljbGVfMTcwNDEyNDgwMDAwMV8zIiwibmFtZSI6IlN0aWdlYmlsIDEiLCJ0eXBlIjoiU3RpZ2ViaWwiLCJzdGF0aW9uSWQiOiJzdGF0aW9uXzE3MDQxMjQ4MDAwMDAifV19LHsiaWQiOiJzdGF0aW9uXzE3MDQxMjQ4MDAwMDEiLCJuYW1lIjoiVmVzdGVyYnJvIEJyYW5kc3RhdGlvbiIsInBvc2l0aW9uIjp7ImxhdCI6NTUuNjU5ODMzLCJsbmciOjEyLjU1Mzc3N30sInZlaGljbGVDb25maWdzIjpbeyJpZCI6InZlaGljbGVfMTcwNDEyNDgwMDAwMl8xIiwibmFtZSI6IkJyYW5kYmlsIDMiLCJ0eXBlIjoiQnJhbmRiaWwiLCJzdGF0aW9uSWQiOiJzdGF0aW9uXzE3MDQxMjQ4MDAwMDEifSx7ImlkIjoidmVoaWNsZV8xNzA0MTI0ODAwMDAyXzIiLCJuYW1lIjoiQW1idWxhbmNlIDEiLCJ0eXBlIjoiQW1idWxhbmNlIiwic3RhdGlvbklkIjoic3RhdGlvbl8xNzA0MTI0ODAwMDAxIn1dfSx7ImlkIjoic3RhdGlvbl8xNzA0MTI0ODAwMDAyIiwibmFtZSI6Ik5vcnJlYnJvIEJyYW5kc3RhdGlvbiIsInBvc2l0aW9uIjp7ImxhdCI6NTUuNzAwMjc3LCJsbmciOjEyLjUyNzI2M30sInZlaGljbGVDb25maWdzIjpbeyJpZCI6InZlaGljbGVfMTcwNDEyNDgwMDAwM18xIiwibmFtZSI6IkJyYW5kYmlsIDQiLCJ0eXBlIjoiQnJhbmRiaWwiLCJzdGF0aW9uSWQiOiJzdGF0aW9uXzE3MDQxMjQ4MDAwMDIifSx7ImlkIjoidmVoaWNsZV8xNzA0MTI0ODAwMDAzXzIiLCJuYW1lIjoiQnJhbmRiaWwgNSIsInR5cGUiOiJCcmFuZGJpbCIsInN0YXRpb25JZCI6InN0YXRpb25fMTcwNDEyNDgwMDAwMiJ9XX1dfQ==";

/**
 * Loader custom ROM data hvis LOAD_CUSTOM_ROM_ON_STARTUP er true
 * Denne funktion kaldes automatisk ved opstart
 */
function loadCustomROMIfEnabled() {
    if (LOAD_CUSTOM_ROM_ON_STARTUP && CUSTOM_ROM_DATA) {
        console.log("Loading custom ROM...");
        loadGameFromCode(CUSTOM_ROM_DATA, Game, Game.map, updateVehicleMarkerIcon, createStationMarker, createVehicleMarker, clearAllMapElements);
        console.log("Custom ROM loaded successfully!");
    } else {
        console.log("Custom ROM loading is disabled or no ROM data available.");
    }
}

/**
 * Manuel funktion til at loade custom ROM (kan kaldes fra UI)
 */
function loadCustomROM() {
    if (CUSTOM_ROM_DATA) {
        if (confirm("Dette vil overskrive dit nuværende spil med foruddefinerede stationer og køretøjer. Fortsæt?")) {
            loadGameFromCode(CUSTOM_ROM_DATA, Game, Game.map, updateVehicleMarkerIcon, createStationMarker, createVehicleMarker, clearAllMapElements);
            alert("Custom ROM indlæst!");
        }
    } else {
        alert("Ingen custom ROM data tilgængelig.");
    }
}
