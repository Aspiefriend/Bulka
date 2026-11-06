import { useEffect, useRef, useState } from 'react';
import { YMaps, Map, Placemark } from '@mr-igorinni/react-yandex-maps-fork';
import { X, Search } from 'lucide-react';
import './MapModal.css';

const YMAPS_APIKEY = import.meta.env.VITE_YMAPS_APIKEY;

const DEFAULT_CENTER = [55.030199, 82.92043];
const DEFAULT_ZOOM = 12;
const DELIVERY_BOUNDS = [
  [54.5, 82.0],
  [56.0, 84.0],
];

function MapModal({
  isOpen,
  mode: initialMode = 'pickup',
  bakeries = [],
  initialAddress = '',
  onClose,
  onConfirm,
}) {
  const [mode, setMode] = useState(initialMode);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [addressText, setAddressText] = useState(initialAddress);
  const [isSearching, setIsSearching] = useState(false);
  const [isReverseSearching, setIsReverseSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const mapRef = useRef(null);
  const clickTimerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);
    setAddressText(initialAddress);
    setSelectedCoords(null);
    setSearchError('');
    setConfirmError('');
  }, [isOpen, initialMode, initialAddress]);

  useEffect(() => {
    if (!isOpen) {
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
      setIsReverseSearching(false);
      return;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  function handleModeChange(nextMode) {
    if (nextMode === mode) return;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    setMode(nextMode);
    setSelectedCoords(null);
    setSearchError('');
    setConfirmError('');
  }
  async function geocodeRequest(geocodeString) {
    const url = new URL('https://geocode-maps.yandex.ru/v1/');
    url.searchParams.set('apikey', import.meta.env.VITE_YMAPS_APIKEY);
    url.searchParams.set('geocode', geocodeString);
    url.searchParams.set('format', 'json');
    url.searchParams.set('results', '1');
    url.searchParams.set('lang', 'ru_RU');

    if (isNaN(parseFloat(geocodeString))) {
      url.searchParams.set('bbox', '82.0,54.5~84.0,56.0');
      url.searchParams.set('rspn', '1');
    }

    const response = await fetch(url);
    if (!response.ok) {
      const errText = await response.text();
      console.error('Geocoder Error:', response.status, errText);
      throw new Error(`Geocoder HTTP ${response.status}`);
    }

    const data = await response.json();

    let feature = data.features?.[0];

    if (!feature && data.response?.GeoObjectCollection?.featureMember?.[0]) {
      const geoObject =
        data.response.GeoObjectCollection.featureMember[0].GeoObject;
      const [lon, lat] = geoObject.Point.pos.split(' ').map(Number);
      return {
        coords: [lat, lon],
        address: geoObject.metaDataProperty.GeocoderMetaData.text,
      };
    }

    if (!feature) return null;
    const [lon, lat] = feature.geometry.coordinates;
    const address = feature.properties?.GeocoderMetaData?.text || '';

    return { coords: [lat, lon], address };
  }
  async function handleSearchAddress() {
    if (isSearching) return;

    const query = addressText.trim();
    setSearchError('');
    setConfirmError('');

    if (!query) {
      setSearchError('Введите адрес, чтобы найти его на карте.');
      return;
    }

    setIsSearching(true);
    try {
      const result = await geocodeRequest(query);
      if (!result) {
        setSearchError('Адрес не найден. Уточните запрос.');
        return;
      }
      setSelectedCoords(result.coords);
      setAddressText(result.address || query);
      if (mapRef.current) {
        mapRef.current.setCenter(result.coords, 16);
      }
    } catch (err) {
      console.error('[MapModal] geocode error:', err);
      setSearchError('Не удалось найти адрес. Попробуйте ещё раз.');
    } finally {
      setIsSearching(false);
    }
  }

  function handleMapClick(e) {
    if (mode !== 'delivery') return;
    const coords = e.get('coords');
    setSelectedCoords(coords);
    setConfirmError('');
    setSearchError('');

    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

    clickTimerRef.current = setTimeout(async () => {
      setIsReverseSearching(true);
      try {
        const geocodeStr = `${coords[1]},${coords[0]}`;
        const result = await geocodeRequest(geocodeStr);
        if (result?.address) setAddressText(result.address);
      } catch (err) {
        console.error('[MapModal] reverse geocode error:', err);
        setSearchError(
          'Не удалось определить адрес по клику. Введите его вручную.'
        );
      } finally {
        setIsReverseSearching(false);
      }
    }, 500);
  }

  function handleBakeryClick(bakery) {
    onConfirm?.({
      id_bakery: bakery.id_bakery,
      address: bakery.address,
    });
    onClose();
  }

  function handleDeliveryConfirm() {
    setConfirmError('');
    if (!selectedCoords) {
      setConfirmError('Выберите точку на карте или найдите адрес.');
      return;
    }
    if (!addressText.trim()) {
      setConfirmError('Введите адрес доставки.');
      return;
    }
    onConfirm?.({
      address: addressText.trim(),
    });
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      className="map-modal__overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="map-modal__window" role="dialog" aria-modal="true">
        <header className="map-modal__header">
          <h2 className="map-modal__title">
            {mode === 'pickup' ? 'Выберите пекарню' : 'Укажите адрес доставки'}
          </h2>
          <button
            type="button"
            className="map-modal__close"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        </header>

        <div className="map-modal__tabs">
          <button
            type="button"
            className={`map-modal__tab ${mode === 'pickup' ? 'map-modal__tab--active' : ''}`}
            onClick={() => handleModeChange('pickup')}
          >
            Самовывоз
          </button>
          <button
            type="button"
            className={`map-modal__tab ${mode === 'delivery' ? 'map-modal__tab--active' : ''}`}
            onClick={() => handleModeChange('delivery')}
          >
            Доставка
          </button>
        </div>

        {mode === 'delivery' && (
          <div className="map-modal__search">
            <div className="map-modal__search-row">
              <input
                type="text"
                className={`map-modal__input ${searchError ? 'map-modal__input--error' : ''}`}
                placeholder="Введите адрес (например: Ленина 5)"
                value={addressText}
                onChange={(e) => {
                  setAddressText(e.target.value);
                  if (searchError) setSearchError('');
                }}
                aria-invalid={Boolean(searchError)}
              />
              <button
                type="button"
                className="map-modal__search-btn"
                onClick={handleSearchAddress}
                disabled={isSearching}
                aria-label="Найти адрес"
              >
                <Search size={18} />
              </button>
            </div>
            {isReverseSearching && !searchError && (
              <p className="map-modal__hint">Определяем адрес...</p>
            )}
            {searchError && (
              <p className="map-modal__error" role="alert">
                {searchError}
              </p>
            )}
          </div>
        )}

        <div className="map-modal__map">
          <YMaps query={{ apikey: YMAPS_APIKEY }}>
            <Map
              defaultState={{ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM }}
              width="100%"
              height="100%"
              instanceRef={mapRef}
              onClick={handleMapClick}
              options={{
                restrictMapArea:
                  mode === 'delivery' ? DELIVERY_BOUNDS : undefined,
              }}
            >
              {mode === 'pickup' &&
                bakeries.map((b) =>
                  b.latitude && b.longitude ? (
                    <Placemark
                      key={b.id_bakery}
                      geometry={[b.latitude, b.longitude]}
                      properties={{
                        hintContent: b.name,
                        balloonContent: `<strong>${b.name}</strong><br/>${b.address}`,
                      }}
                      options={{ preset: 'islands#greenIcon' }}
                      onClick={() => handleBakeryClick(b)}
                    />
                  ) : null
                )}

              {mode === 'delivery' && selectedCoords && (
                <Placemark
                  geometry={selectedCoords}
                  options={{ preset: 'islands#redIcon' }}
                />
              )}
            </Map>
          </YMaps>
        </div>

        <footer className="map-modal__footer">
          {confirmError && (
            <p
              className="map-modal__error map-modal__error--footer"
              role="alert"
            >
              {confirmError}
            </p>
          )}
          <div className="map-modal__footer-actions">
            <button
              type="button"
              className="map-modal__btn map-modal__btn--ghost"
              onClick={onClose}
            >
              Отмена
            </button>
            {mode === 'delivery' && (
              <button
                type="button"
                className="map-modal__btn map-modal__btn--primary"
                onClick={handleDeliveryConfirm}
              >
                Подтвердить адрес
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

export default MapModal;
