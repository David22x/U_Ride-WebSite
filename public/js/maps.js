/**
 * U-Ride — maps.js  (v2)
 * Módulo completo de Google Maps.
 *
 * window.URideMaps expone:
 *
 *  Mapas generales
 *   initMap(id, opts)                     → crea/reutiliza mapa
 *   showRouteOnMap(id, orig, dest)        → ruta por texto (fallback markers)
 *   showCoordsOnMap(id, origCoords, destCoords) → ruta por coordenadas exactas
 *   destroyMap(id)
 *
 *  Selector de puntos (modal crear viaje)
 *   openPickerMap(containerId, onPick)    → mapa interactivo para elegir punto
 *   closePickerMap(containerId)
 *
 *  GPS tracking
 *   startTracking(id, socket, viajeId)   → conductor emite posición
 *   watchTracking(id, socket, viajeId)   → pasajero recibe posición
 *   stopTracking()
 *   geocodeAddress(address)              → Promise {lat,lng}
 */

window.URideMaps = (() => {
  /* ── estado ────────────────────────────────────────── */
  const _maps = {}; // id → { map, directionsRenderer, markers[] }
  const _watch = { id: null };
  const _liveM = {}; // viajeId → Marker del conductor en live
  const _picker = {}; // containerId → { map, marker, listener }

  /* ── helpers internos ──────────────────────────────── */
  function _ok() {
    if (!window.google?.maps) {
      console.error("[URideMaps] Google Maps no está cargado todavía.");
      return false;
    }
    return true;
  }

  function _inst(id) {
    if (_maps[id]) return _maps[id];
    const el = document.getElementById(id);
    if (!el) {
      console.error(`[URideMaps] #${id} no encontrado.`);
      return null;
    }
    const map = new google.maps.Map(el, {
      center: { lat: -1.2543, lng: -78.6236 },
      zoom: 13,
      mapTypeControl: false,
      fullscreenControl: true,
      streetViewControl: false,
      styles: _theme(),
    });
    const dr = new google.maps.DirectionsRenderer({
      suppressMarkers: false,
      polylineOptions: { strokeColor: "#6366f1", strokeWeight: 5 },
    });
    dr.setMap(map);
    _maps[id] = { map, directionsRenderer: dr, markers: [] };
    el.classList.add("map-ready");
    return _maps[id];
  }

  function _theme() {
    return [
      { elementType: "geometry", stylers: [{ color: "#1a1b23" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#1a1b23" }] },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#2d2f3e" }],
      },
      {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#16171f" }],
      },
      {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#374151" }],
      },
      {
        featureType: "poi",
        elementType: "geometry",
        stylers: [{ color: "#1f2030" }],
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#0f172a" }],
      },
    ];
  }

  function _pinIcon(color = "#6366f1", letter = "") {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
        <path d="M18 0C8.06 0 0 8.06 0 18c0 12.4 18 26 18 26S36 30.4 36 18C36 8.06 27.94 0 18 0z"
              fill="${color}" stroke="#fff" stroke-width="2"/>
        <text x="18" y="23" text-anchor="middle" font-size="13"
              font-family="system-ui,sans-serif" font-weight="700" fill="#fff">${letter}</text>
      </svg>`;
    return {
      url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
      scaledSize: new google.maps.Size(36, 44),
      anchor: new google.maps.Point(18, 44),
    };
  }

  function _carIcon() {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 38 38">
        <circle cx="19" cy="19" r="17" fill="#6366f1" stroke="#fff" stroke-width="2.5"/>
        <text x="19" y="25" text-anchor="middle" font-size="18">🚗</text>
      </svg>`;
    return {
      url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
      scaledSize: new google.maps.Size(38, 38),
      anchor: new google.maps.Point(19, 19),
    };
  }

  /* Traza ruta usando DirectionsService; si falla usa markers */
  function _route(inst, orig, dest) {
    return new Promise((res, rej) => {
      new google.maps.DirectionsService().route(
        {
          origin: orig,
          destination: dest,
          travelMode: google.maps.TravelMode.DRIVING,
          region: "ec",
        },
        (result, status) => {
          if (status === "OK") {
            inst.directionsRenderer.setDirections(result);
            res(result);
          } else {
            rej(status);
          }
        },
      );
    });
  }

  function _addMarker(inst, pos, color, letter, title) {
    const m = new google.maps.Marker({
      position: pos,
      map: inst.map,
      title,
      icon: _pinIcon(color, letter),
    });
    inst.markers.push(m);
    return m;
  }

  function _clearMarkers(inst) {
    inst.markers.forEach((m) => m.setMap(null));
    inst.markers = [];
    inst.directionsRenderer.setDirections({ routes: [] });
  }

  function _fitTwo(map, a, b) {
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(a);
    bounds.extend(b);
    map.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
  }

  /* ═══════════════════════════════════════════════════════
     API PÚBLICA
     ═══════════════════════════════════════════════════════ */

  /** Inicializa o reutiliza mapa. Devuelve google.maps.Map */
  function initMap(containerId) {
    if (!_ok()) return null;
    return _inst(containerId)?.map || null;
  }

  /** Geocodifica texto → {lat, lng} */
  function geocodeAddress(address) {
    return new Promise((res, rej) => {
      if (!_ok()) return rej("Maps no disponible");
      new google.maps.Geocoder().geocode(
        { address: `${address}, Ecuador` },
        (results, status) => {
          if (status === "OK" && results[0]) {
            const loc = results[0].geometry.location;
            res({ lat: loc.lat(), lng: loc.lng() });
          } else rej(`Geocode falló: ${status}`);
        },
      );
    });
  }

  /**
   * Muestra ruta entre dos TEXTOS.
   * Si Directions API falla, cae a geocodificación + markers.
   */
  async function showRouteOnMap(mapId, originText, destText) {
    if (!_ok()) return;
    const inst = _inst(mapId);
    if (!inst) return;
    _clearMarkers(inst);
    try {
      await _route(inst, `${originText}, Ecuador`, `${destText}, Ecuador`);
    } catch {
      try {
        const [o, d] = await Promise.all([
          geocodeAddress(originText),
          geocodeAddress(destText),
        ]);
        _addMarker(inst, o, "#6366f1", "A", `Origen: ${originText}`);
        _addMarker(inst, d, "#10b981", "B", `Destino: ${destText}`);
        _fitTwo(inst.map, o, d);
      } catch (e2) {
        console.warn("[URideMaps] showRouteOnMap fallback falló:", e2);
      }
    }
  }

  /**
   * Muestra ruta entre dos COORDENADAS exactas {lat, lng}.
   * Ideal para viajes que tienen coords guardadas en BD.
   */
  async function showCoordsOnMap(mapId, origCoords, destCoords) {
    if (!_ok()) return;
    const inst = _inst(mapId);
    if (!inst) return;
    _clearMarkers(inst);

    // Intentar ruta
    try {
      await _route(inst, origCoords, destCoords);
    } catch {
      // Fallback: solo marcadores
      _addMarker(inst, origCoords, "#6366f1", "A", "Punto de origen");
      _addMarker(inst, destCoords, "#10b981", "B", "Punto de destino");
      _fitTwo(inst.map, origCoords, destCoords);
    }
  }

  /** Destruye instancia del mapa */
  function destroyMap(mapId) {
    if (_maps[mapId]) {
      _clearMarkers(_maps[mapId]);
      delete _maps[mapId];
    }
    delete _liveM[mapId];
    const el = document.getElementById(mapId);
    if (el) el.classList.remove("map-ready");
  }

  /* ─────────────────────────────────────────────────────
     SELECTOR DE PUNTOS (usar en modal crear viaje)
     ───────────────────────────────────────────────────── */

  /**
   * Abre un mapa interactivo dentro de `containerId`.
   * El usuario hace clic para colocar/mover un marcador.
   *
   * @param {string}   containerId  id del div contenedor
   * @param {object}   opts
   * @param {string}   opts.color   color del pin (#hex)
   * @param {string}   opts.label   letra del pin ("A" o "B")
   * @param {string}   opts.title   tooltip del marcador
   * @param {{lat,lng}} [opts.initial]  coordenada inicial opcional
   * @param {function} onPick       callback({lat, lng, address})
   */
  function openPickerMap(containerId, opts = {}, onPick) {
    if (!_ok()) return;
    const el = document.getElementById(containerId);
    if (!el) return;

    // Si ya existe, reutilizar el mapa pero actualizar el callback
    if (_picker[containerId]) {
      _picker[containerId].onPick = onPick;
      _picker[containerId].map.setCenter(
        opts.initial || { lat: -1.2543, lng: -78.6236 },
      );
      return;
    }

    const map = new google.maps.Map(el, {
      center: opts.initial || { lat: -1.2543, lng: -78.6236 },
      zoom: opts.initial ? 15 : 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: _theme(),
      cursor: "crosshair",
    });
    el.classList.add("map-ready");

    let marker = null;

    // Si hay coordenada inicial, mostrar el marker
    if (opts.initial) {
      marker = new google.maps.Marker({
        position: opts.initial,
        map,
        draggable: true,
        icon: _pinIcon(opts.color || "#6366f1", opts.label || "•"),
        title: opts.title || "Punto seleccionado",
      });
      marker.addListener("dragend", () => {
        const pos = marker.getPosition();
        _reverseGeocode(
          { lat: pos.lat(), lng: pos.lng() },
          _picker[containerId]?.onPick || onPick,
        );
      });
    }

    const listener = map.addListener("click", (e) => {
      const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      const cb = _picker[containerId]?.onPick || onPick;
      if (!marker) {
        marker = new google.maps.Marker({
          position: coords,
          map,
          draggable: true,
          animation: google.maps.Animation.DROP,
          icon: _pinIcon(opts.color || "#6366f1", opts.label || "•"),
          title: opts.title || "Punto seleccionado",
        });
        marker.addListener("dragend", () => {
          const p = marker.getPosition();
          _reverseGeocode(
            { lat: p.lat(), lng: p.lng() },
            _picker[containerId]?.onPick || onPick,
          );
        });
        _picker[containerId].marker = marker;
      } else {
        marker.setPosition(coords);
      }
      _reverseGeocode(coords, cb);
    });

    _picker[containerId] = { map, marker, listener, onPick };
  }

  /** Cierra y limpia el mapa selector */
  function closePickerMap(containerId) {
    const p = _picker[containerId];
    if (!p) return;
    google.maps.event.removeListener(p.listener);
    if (p.marker) p.marker.setMap(null);
    delete _picker[containerId];
    const el = document.getElementById(containerId);
    if (el) el.classList.remove("map-ready");
  }

  /**
   * Conecta un <input type="text"> con un mapa picker:
   * al escribir en el input (debounce 600ms), geocodifica y
   * mueve/crea el marcador en el mapa.
   *
   * @param {string}   inputId      id del input de texto
   * @param {string}   containerId  id del div del mapa picker
   * @param {function} onPlace      callback({lat, lng, address})
   */
  const _inputBindings = {}; // inputId → handler

  function bindInputToPickerMap(inputId, containerId, onPlace) {
    if (!_ok()) return;
    const inp = document.getElementById(inputId);
    if (!inp) return;

    unbindInputFromPickerMap(inputId);

    // ── Google Places Autocomplete ──────────────────────────
    // Si la librería places está disponible, usar Autocomplete
    // para mostrar sugerencias mientras se escribe.
    let autocomplete = null;
    if (window.google?.maps?.places) {
      autocomplete = new google.maps.places.Autocomplete(inp, {
        componentRestrictions: { country: "ec" },
        fields: ["geometry", "name", "address_components", "formatted_address"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry?.location) return;

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        // Nombre legible: barrio > localidad > nombre > dirección formateada
        const comp = place.address_components || [];
        const neighborhood = comp.find(
          (c) =>
            c.types.includes("neighborhood") || c.types.includes("sublocality"),
        );
        const locality = comp.find((c) => c.types.includes("locality"));
        const address =
          neighborhood?.long_name ||
          locality?.long_name ||
          place.name ||
          place.formatted_address;

        // Actualizar el texto del input con el nombre limpio
        inp.value = address;

        // Mover/crear marcador en el mapa si está abierto
        const picker = _picker[containerId];
        if (picker) {
          picker.map.setCenter({ lat, lng });
          picker.map.setZoom(15);
          if (!picker.marker) {
            picker.marker = new google.maps.Marker({
              position: { lat, lng },
              map: picker.map,
              draggable: true,
              animation: google.maps.Animation.DROP,
              icon: _pinIcon(
                containerId.includes("Destino") ? "#10b981" : "#6366f1",
                containerId.includes("Destino") ? "B" : "A",
              ),
            });
            picker.marker.addListener("dragend", () => {
              const p = picker.marker.getPosition();
              _reverseGeocode(
                { lat: p.lat(), lng: p.lng() },
                picker.onPick || onPlace,
              );
            });
          } else {
            picker.marker.setPosition({ lat, lng });
          }
        }

        if (onPlace) onPlace(lat, lng, address);
      });
    }

    // ── Fallback: geocodificación con debounce si no hay Autocomplete ──
    let _debounce = null;
    const handler = (ev) => {
      // Si hay Autocomplete activo, no hacer geocodificación manual
      if (autocomplete) return;

      clearTimeout(_debounce);
      const val = inp.value.trim();
      if (val.length < 3) return;

      _debounce = setTimeout(() => {
        new google.maps.Geocoder().geocode(
          { address: `${val}, Ecuador` },
          (results, status) => {
            if (status !== "OK" || !results[0]) return;
            const loc = results[0].geometry.location;
            const lat = loc.lat();
            const lng = loc.lng();

            const comp = results[0].address_components;
            const neighborhood = comp.find(
              (c) =>
                c.types.includes("neighborhood") ||
                c.types.includes("sublocality"),
            );
            const locality = comp.find((c) => c.types.includes("locality"));
            const address =
              neighborhood?.long_name ||
              locality?.long_name ||
              results[0].formatted_address;

            const picker = _picker[containerId];
            if (picker) {
              picker.map.setCenter({ lat, lng });
              picker.map.setZoom(15);
              if (!picker.marker) {
                picker.marker = new google.maps.Marker({
                  position: { lat, lng },
                  map: picker.map,
                  draggable: true,
                  animation: google.maps.Animation.DROP,
                  icon: _pinIcon(
                    containerId.includes("Destino") ? "#10b981" : "#6366f1",
                    containerId.includes("Destino") ? "B" : "A",
                  ),
                });
                picker.marker.addListener("dragend", () => {
                  const p = picker.marker.getPosition();
                  _reverseGeocode(
                    { lat: p.lat(), lng: p.lng() },
                    picker.onPick || onPlace,
                  );
                });
              } else {
                picker.marker.setPosition({ lat, lng });
              }
            }

            if (onPlace) onPlace(lat, lng, address);
          },
        );
      }, 600);
    };

    inp.addEventListener("input", handler);
    _inputBindings[inputId] = { handler, autocomplete };
  }

  /** Desconecta el listener input→mapa de un input */
  function unbindInputFromPickerMap(inputId) {
    const inp = document.getElementById(inputId);
    const binding = _inputBindings[inputId];
    if (inp && binding) {
      // Puede ser función (viejo) o {handler, autocomplete} (nuevo)
      const handler = typeof binding === "function" ? binding : binding.handler;
      inp.removeEventListener("input", handler);
    }
    delete _inputBindings[inputId];
  }

  /** Geocodificación inversa: coords → nombre de dirección */
  function _reverseGeocode(coords, cb) {
    if (!cb) return;
    new google.maps.Geocoder().geocode(
      { location: coords },
      (results, status) => {
        let address = "";
        if (status === "OK" && results[0]) {
          // Intentar obtener barrio/sector (más útil que calle exacta)
          const comp = results[0].address_components;
          const neighborhood = comp.find(
            (c) =>
              c.types.includes("neighborhood") ||
              c.types.includes("sublocality"),
          );
          const locality = comp.find((c) => c.types.includes("locality"));
          address =
            neighborhood?.long_name ||
            locality?.long_name ||
            results[0].formatted_address;
        }
        cb({ ...coords, address });
      },
    );
  }

  /* ─────────────────────────────────────────────────────
     GPS TRACKING EN TIEMPO REAL
     ───────────────────────────────────────────────────── */

  /**
   * CONDUCTOR — inicia watchPosition y emite coords por socket cada actualización.
   */
  function startTracking(mapId, socket, viajeId) {
    if (!navigator.geolocation) {
      console.warn("[URideMaps] Geolocalización no disponible.");
      return;
    }
    if (!_ok()) return;

    const inst = mapId ? _inst(mapId) : null;
    let selfMarker = null;

    _watch.id = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        socket.emit("ubicacion:conductor", { viajeId, coords });

        if (inst) {
          if (!selfMarker) {
            selfMarker = new google.maps.Marker({
              position: coords,
              map: inst.map,
              title: "Tu posición",
              icon: _carIcon(),
            });
          } else {
            selfMarker.setPosition(coords);
          }
          inst.map.panTo(coords);
        }
      },
      (err) => console.warn("[URideMaps] GPS error:", err.message),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
    );
  }

  /**
   * PASAJERO — escucha socket y mueve marcador del conductor.
   */
  function watchTracking(mapId, socket, viajeId) {
    if (!_ok()) return;
    const inst = _inst(mapId);
    if (!inst) return;

    socket.on(`ubicacion:${viajeId}`, (coords) => {
      if (!_liveM[viajeId]) {
        _liveM[viajeId] = new google.maps.Marker({
          position: coords,
          map: inst.map,
          title: "Conductor",
          icon: _carIcon(),
        });
        const iw = new google.maps.InfoWindow({
          content: `<div style="color:#111;font-weight:600;font-size:13px">🚗 Conductor en camino</div>`,
        });
        _liveM[viajeId].addListener("click", () =>
          iw.open(inst.map, _liveM[viajeId]),
        );
      } else {
        _liveM[viajeId].setPosition(coords);
      }
      inst.map.panTo(coords);
    });
  }

  function stopTracking() {
    if (_watch.id !== null) {
      navigator.geolocation.clearWatch(_watch.id);
      _watch.id = null;
    }
  }

  /* ── Exportar ───────────────────────────────────────── */
  return {
    initMap,
    geocodeAddress,
    showRouteOnMap,
    showCoordsOnMap,
    openPickerMap,
    closePickerMap,
    bindInputToPickerMap,
    unbindInputFromPickerMap,
    startTracking,
    watchTracking,
    stopTracking,
    destroyMap,
  };
})();
