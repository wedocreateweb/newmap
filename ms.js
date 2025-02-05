document.addEventListener("DOMContentLoaded", () => {
    // Try to get saved map position from localStorage

    // Initialize map
    var map = L.map('map', {
        center: [31.4187222, 72.2825785],
        zoom: 13,
        measureControl: true,
        zoomAnimation: true, // Enable zoom animation
        zoomSnap: 0.05, // Smaller increments for smoother zoom
        zoomDelta: 0.1, // Smaller zoom increment per scroll
        wheelDebounceTime: 20, // Quick response to wheel actions
        wheelPxPerZoomLevel: 50
    })
    googleHybrid = L.tileLayer('http://{s}.google.com/vt?lyrs=s,h&x={x}&y={y}&z={z}', {
        maxZoom: 30,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    });
    googleHybrid.addTo(map)

    const DaduanaKohna = L.layerGroup();
    const JahanKhan = L.layerGroup();
    const PipilWala = L.layerGroup();
    const ThathaKuriana = L.layerGroup();
    //--------------------------------------------------------- Manual Mouzas
    // Function to add polygons and labels
    function addPolygonWithLabel(data, mapLayer, color) {
        data.map((mrb) => {
            const polygon = L.polygon(mrb.geometry.coordinates[0], {
                color: color,
                fillColor: 'transparent',
                weight: 2
            }).addTo(mapLayer);

            const center = calculateAccurateCenter(mrb.geometry.coordinates);
            L.marker(center, {
                icon: L.divIcon({
                    className: 'murabba-label',
                    html: `<div style="font-weight: bold; color: white; font-size: 14px;">${mrb.properties.murabba}</div>`
                })
            }).addTo(mapLayer);

            attachGridClickHandler(polygon, mapLayer);
        });
    }

    // Function to calculate accurate center of a polygon
    function calculateAccurateCenter(polygonCoordinates) {
        const latlngs = polygonCoordinates[0].map(([lat, lng]) => [lat, lng]);
        const bounds = L.polygon(latlngs).getBounds();
        return [bounds.getCenter().lat, bounds.getCenter().lng];
    }

    // Function to create a 5x5 grid on polygon click and toggle visibility
    function attachGridClickHandler(polygon, mapLayer) {
        if (!polygon.gridData) {
            polygon.gridData = { boxes: [], markers: [], visible: false };
        }

        polygon.on('click', function () {
            toggleGrid(polygon, mapLayer);
        });
    }

    //*------------------------------------------ Function to toggle the visibility of the grid
    function toggleGrid(polygon, mapLayer) {
        const { boxes, markers, visible } = polygon.gridData;

        if (visible) {
            // Hide grid
            boxes.forEach(box => mapLayer.removeLayer(box));
            markers.forEach(marker => mapLayer.removeLayer(marker));
            polygon.gridData.visible = false;
        } else {
            if (boxes.length === 0) {
                createGrid(polygon, mapLayer);
            } else {
                // Show grid
                boxes.forEach(box => box.addTo(mapLayer));
                markers.forEach(marker => marker.addTo(mapLayer));
            }
            polygon.gridData.visible = true;
        }
    }

    // Function to create the 5x5 grid
    function createGrid(polygon, mapLayer) {
        const bounds = polygon.getBounds();
        const north = bounds.getNorth();
        const south = bounds.getSouth();
        const west = bounds.getWest();
        const east = bounds.getEast();
        const latStep = (north - south) / 5;
        const lngStep = (east - west) / 5;

        let number = 1;

        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                const boxNorth = north - (row * latStep);
                const boxSouth = boxNorth - latStep;
                let boxWest, boxEast;

                if (row % 2 === 0) {
                    boxWest = west + (col * lngStep);
                    boxEast = boxWest + lngStep;
                } else {
                    boxEast = east - (col * lngStep);
                    boxWest = boxEast - lngStep;
                }

                const boxBounds = [[boxSouth, boxWest], [boxNorth, boxEast]];

                const box = L.rectangle(boxBounds, {
                    color: 'yellow',
                    weight: 1,
                    fillOpacity: 0
                }).addTo(mapLayer);

                box.on('click', function (e) {
                    e.originalEvent.stopPropagation(); // Prevent polygon click
                    toggleGrid(polygon, mapLayer);
                });

                polygon.gridData.boxes.push(box);

                const center = L.rectangle(boxBounds).getBounds().getCenter();
                const marker = L.marker(center, {
                    icon: L.divIcon({
                        className: 'number-label',
                        html: number.toString(),
                        iconSize: [20, 20]
                    })
                }).addTo(mapLayer);

                polygon.gridData.markers.push(marker);
                number++;
            }
        }
    }



    // Add polygons with different layers and colors
    addPolygonWithLabel(pw.features, PipilWala, 'cyan');
    addPolygonWithLabel(jk.features, JahanKhan, 'red');
    addPolygonWithLabel(dk.features, DaduanaKohna, 'yellow');
    addPolygonWithLabel(tk.features, ThathaKuriana, 'orange');


    document.getElementById('snippet2').addEventListener('change', (e) => {
        if (e.target.checked) {
            map.addLayer(JahanKhan);
        } else {
            map.removeLayer(JahanKhan);
        }
    });
    document.getElementById('snippet1').addEventListener('change', (e) => {
        if (e.target.checked) {
            map.addLayer(DaduanaKohna);
        } else {
            map.removeLayer(DaduanaKohna);
        }
    });
    document.getElementById('snippet3').addEventListener('change', (e) => {
        if (e.target.checked) {
            map.addLayer(PipilWala);
        } else {
            map.removeLayer(PipilWala);
        }
    });
    document.getElementById('snippet4').addEventListener('change', (e) => {
        if (e.target.checked) {
            map.addLayer(ThathaKuriana);
        } else {
            map.removeLayer(ThathaKuriana);
        }
    });


    // Dropdown functionality
    const dropdownButton = document.getElementById('dropdownButton');
    const dropdownContent = document.getElementById('dropdownContent');

    dropdownButton.addEventListener('click', () => {
        dropdownContent.style.display =
            dropdownContent.style.display === 'block' ? 'none' : 'block';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdownButton.contains(e.target) && !dropdownContent.contains(e.target)) {
            dropdownContent.style.display = 'none';
        }
    });

    // Searchable functionality
    const searchInput = document.getElementById('searchInput');
    const layerList = document.getElementById('layerList');

    searchInput.addEventListener('input', () => {
        const filter = searchInput.value.toLowerCase();
        const labels = layerList.querySelectorAll('label');

        labels.forEach(label => {
            const text = label.textContent.toLowerCase();
            if (text.includes(filter)) {
                label.style.display = 'block';
            } else {
                label.style.display = 'none';
            }
        });
    });


    // Coordinate search functionality
    const searchBtn = document.getElementById('search-btn');
    const coordInput = document.getElementById('coord-search');

    searchBtn.addEventListener('click', () => {
        const coords = coordInput.value.split(',').map(coord => parseFloat(coord.trim()));

        if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
            map.setView([coords[0], coords[1]], 18);
        } else {
            alert('Please enter valid coordinates in format: latitude,longitude');
        }
    });

    // Also allow Enter key to trigger search
    coordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });



    // Crosshair overlay
    const crosshairIcon = L.divIcon({ className: "crosshair" });
    const crosshair = L.marker(map.getCenter(), { icon: crosshairIcon, interactive: false }).addTo(map);

    map.on("move", () => {
        const center = map.getCenter();
        crosshair.setLatLng(center);
        document.getElementById("lat").innerText = center.lat.toFixed(6);
        document.getElementById("lng").innerText = center.lng.toFixed(6);
    });


    const EARTH_RADIUS_FEET = 20925524.9; // Earth's radius in feet

    // Function to calculate distance between two points in feet
    function calculateDistanceFeet(latlng1, latlng2) {
        const lat1 = latlng1.lat * (Math.PI / 180);
        const lng1 = latlng1.lng * (Math.PI / 180);
        const lat2 = latlng2.lat * (Math.PI / 180);
        const lng2 = latlng2.lng * (Math.PI / 180);

        const deltaLat = lat2 - lat1;
        const deltaLng = lng2 - lng1;

        const a = Math.sin(deltaLat / 2) ** 2 +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLng / 2) ** 2;

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_FEET * c;
    }

    // Create a feature group to store drawn layers
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    // Set up the Leaflet Draw control
    const drawControl = new L.Control.Draw({
        position: "topleft",
        draw: {
            polyline: {
                metric: false
            },
            polygon: false,
            rectangle: false,
            circle: false,
            marker: false,
        },
        edit: {
            featureGroup: drawnItems,
            remove: true,
        },
    });
    map.addControl(drawControl);

    // Handle draw events
    map.on("draw:created", (e) => {
        const layer = e.layer;
        drawnItems.addLayer(layer);

        if (layer instanceof L.Polyline) {
            const latlngs = layer.getLatLngs();
            let totalDistanceFeet = 0;

            for (let i = 0; i < latlngs.length - 1; i++) {
                totalDistanceFeet += calculateDistanceFeet(latlngs[i], latlngs[i + 1]);
            }

            layer.bindPopup(`Length: ${totalDistanceFeet.toFixed(2)} feet`).openPopup();
        }

        if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
            const latlngs = layer.getLatLngs()[0];
            let totalDistanceFeet = 0;

            for (let i = 0; i < latlngs.length - 1; i++) {
                totalDistanceFeet += calculateDistanceFeet(latlngs[i], latlngs[i + 1]);
            }

            layer.bindPopup(`Perimeter: ${totalDistanceFeet.toFixed(2)} feet`).openPopup();
        }
    });
    // Live location button
    L.control.locate({
        position: "topleft",
        setView: true,
        flyTo: true,
    }).addTo(map);

    // Function to toggle search bar visibility
    document.getElementById('search-icon').addEventListener('click', function () {
        const searchBar = document.getElementById('search-coordinates');
        if (searchBar.style.display === 'none') {
            searchBar.style.display = 'block';
        } else {
            searchBar.style.display = 'none';
        }
    });


    //                                                  Copy the center coordinates
    var centerCoordinatesDiv = document.getElementById("coordinates");
    centerCoordinatesDiv.onclick = function () {
        const fullText = this.innerText; // Get the inner text of the div
        // Extract just the numbers using regex, assuming format like "lat: 12.34, lng: 56.78"
        const coordinates = fullText.match(/-?\d+\.?\d*/g);

        if (coordinates && coordinates.length >= 2) {
            const coordinateString = coordinates[0] + ', ' + coordinates[1];
            navigator.clipboard.writeText(coordinateString)
                .then(() => {
                    alert('Coordinates copied: ' + coordinateString);
                })
                .catch(err => {
                    console.error('Failed to copy: ', err);
                });
        } else {
            console.error('Could not find valid coordinates in text');
        }
    }


});