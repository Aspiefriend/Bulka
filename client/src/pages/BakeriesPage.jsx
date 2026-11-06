import { useState, useEffect, useRef } from 'react';
import { YMaps, Map, Placemark } from '@mr-igorinni/react-yandex-maps-fork';
import { api } from '../api/client';
import { MapPin, Phone, Clock } from 'lucide-react';
import './BakeriesPage.css';

const YMAPS_APIKEY = import.meta.env.VITE_YMAPS_APIKEY;

function BakeriesPage() {
  const [bakeries, setBakeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeBakeryId, setActiveBakeryId] = useState(null);
  const mapRef = useRef(null);

  const defaultState = {
    center: [55.030199, 82.92043],
    zoom: 11,
  };

  useEffect(() => {
    api
      .get('/bakeries')
      .then((res) => setBakeries(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  function handleCardClick(bakery) {
    setActiveBakeryId(bakery.id_bakery);

    if (mapRef.current && bakery.latitude && bakery.longitude) {
      mapRef.current.setCenter([bakery.latitude, bakery.longitude], 15);
    }
  }

  function handlePlacemarkClick(bakery) {
    setActiveBakeryId(bakery.id_bakery);
  }

  if (loading) return <p className="bakeries-page__status">Загрузка...</p>;

  return (
    <div className="bakeries-page">
      <h1 className="bakeries-page__title">Наши пекарни</h1>

      <div className="bakeries-page__map-wrapper">
        <YMaps query={{ apikey: YMAPS_APIKEY }}>
          <Map
            defaultState={defaultState}
            width="100%"
            height="100%"
            instanceRef={mapRef}
          >
            {bakeries.map(
              (bakery) =>
                bakery.latitude &&
                bakery.longitude && (
                  <Placemark
                    key={bakery.id_bakery}
                    geometry={[bakery.latitude, bakery.longitude]}
                    properties={{
                      hintContent: bakery.name,
                      balloonContent: `
                      <div style="font-family: sans-serif; padding: 4px;">
                        <strong style="font-size: 14px;">${bakery.name}</strong><br/>
                        <span style="color: #666; font-size: 12px;">${bakery.address}</span>
                      </div>
                    `,
                    }}
                    modules={[
                      'geoObject.addon.balloon',
                      'geoObject.addon.hint',
                    ]}
                    onClick={() => handlePlacemarkClick(bakery)}
                    options={{}}
                  />
                )
            )}
          </Map>
        </YMaps>
      </div>

      <div className="bakeries-page__list">
        {bakeries.map((bakery) => (
          <div
            key={bakery.id_bakery}
            id={`bakery-${bakery.id_bakery}`}
            className={`bakery-card ${activeBakeryId === bakery.id_bakery ? 'bakery-card--active' : ''}`}
            onClick={() => handleCardClick(bakery)}
          >
            {bakery.photo && (
              <img
                src={bakery.photo}
                alt={bakery.name}
                className="bakery-card__photo"
              />
            )}

            <div className="bakery-card__content">
              <h3 className="bakery-card__name">{bakery.name}</h3>

              <div className="bakery-card__info">
                <div className="bakery-card__row">
                  <MapPin size={16} />
                  <span>{bakery.address}</span>
                </div>
                {bakery.phone && (
                  <div className="bakery-card__row">
                    <Phone size={16} />
                    <span>{bakery.phone}</span>
                  </div>
                )}
                {bakery.work_hours && (
                  <div className="bakery-card__row">
                    <Clock size={16} />
                    <span>{bakery.work_hours}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BakeriesPage;
