// search.js - Adressesøgning og lokationsbaserede funktioner

// Håndter Enter-tast i adressesøgning
function handleAddressSearch(event) {
    if (event.key === 'Enter') {
        searchAddress();
    }
}

// Søg efter adresse ved hjælp af Nominatim API
function searchAddress() {
    const query = document.getElementById('addressSearch').value.trim();
    if (!query) {
        alert('Indtast venligst en adresse at søge efter.');
        return;
    }

    // Use Nominatim (OpenStreetMap) geocoding service
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=dk&limit=5`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                showAddressResults(data, query);
            } else {
                alert('Ingen resultater fundet for den angivne adresse.');
            }
        })
        .catch(error => {
            console.error('Fejl ved søgning:', error);
            alert('Der opstod en fejl under søgningen. Prøv venligst igen.');
        });
}

// Vis søgeresultater fra adressesøgning
function showAddressResults(results, originalQuery) {
    Game.hideAllPanels(); // Hide other panels first
    const panel = document.getElementById('køretøjsPanel');
    
    let resultsHTML = `
        <button class="close-btn" onclick="Game.hideAllPanels()">X</button>
        <h3>Adresse søgeresultater</h3>
        <p>Søgte efter: <strong>${originalQuery}</strong></p>
        <p>Klik på en adresse for at gå til den på kortet:</p>
    `;
    
    results.forEach((result, index) => {
        resultsHTML += `
            <div style="margin-bottom: 10px; padding: 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--button-bg);">
                <strong>${result.display_name}</strong><br>
                <button onclick="goToAddress({lat: ${result.lat}, lng: ${result.lon}, name: '${result.display_name.replace(/'/g, "&apos;")}'})">Gå til adresse</button>
                <button onclick="Game.addStationAtAddress({lat: ${result.lat}, lng: ${result.lon}})">Tilføj Station</button>
            </div>
        `;
    });
    
    panel.innerHTML = resultsHTML;
    panel.style.display = 'block';
}

// Gå til specifik adresse på kortet
function goToAddress(addressData) {
    Game.hideAllPanels();
    Game.map.setView([addressData.lat, addressData.lng], 15); // Zoom to the address
    
    // Optional: Add a temporary marker to show the searched location
    const tempMarker = L.marker([addressData.lat, addressData.lng])
        .addTo(Game.map)
        .bindPopup(`<strong>Søgt adresse:</strong><br>${addressData.name}`)
        .openPopup();
    
    // Remove the temporary marker after 10 seconds
    setTimeout(() => {
        Game.map.removeLayer(tempMarker);
    }, 10000);
}
