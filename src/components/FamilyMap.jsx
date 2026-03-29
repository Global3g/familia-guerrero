import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users, Globe, Home } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getFamilyMembers } from '../firebase/familyService';

// Known city coordinates (add more as needed)
const CITY_COORDS = {
  'culiacan': [24.7994, -107.3879],
  'culiacan, sinaloa': [24.7994, -107.3879],
  'culiacan sinaloa': [24.7994, -107.3879],
  'monterrey': [25.6866, -100.3161],
  'monterrey, nuevo leon': [25.6866, -100.3161],
  'guadalajara': [20.6597, -103.3496],
  'guadalajara, jalisco': [20.6597, -103.3496],
  'ciudad de mexico': [19.4326, -99.1332],
  'cdmx': [19.4326, -99.1332],
  'mexico city': [19.4326, -99.1332],
  'tijuana': [32.5149, -117.0382],
  'cancun': [21.1619, -86.8515],
  'merida': [20.9674, -89.5926],
  'puebla': [19.0414, -98.2063],
  'queretaro': [20.5888, -100.3899],
  'leon': [21.1221, -101.6821],
  'hermosillo': [29.0729, -110.9559],
  'mazatlan': [23.2329, -106.4068],
  'los mochis': [25.7908, -108.9860],
  'los angeles': [34.0522, -118.2437],
  'houston': [29.7604, -95.3698],
  'dallas': [32.7767, -96.7970],
  'san antonio': [29.4241, -98.4936],
  'chicago': [41.8781, -87.6298],
  'new york': [40.7128, -74.0060],
  'miami': [25.7617, -80.1918],
  'wisconsin': [43.7844, -88.7879],
  'phoenix': [33.4484, -112.0740],
  'san diego': [32.7157, -117.1611],
  'san francisco': [37.7749, -122.4194],
  'san francisco california': [37.7749, -122.4194],
  'san francisco california usa': [37.7749, -122.4194],
  'queretaro': [20.5888, -100.3899],
  'denver': [39.7392, -104.9903],
  'utah': [40.7608, -111.8910],
  'salt lake city': [40.7608, -111.8910],
  'salt lake city, utah': [40.7608, -111.8910],
  'las vegas': [36.1699, -115.1398],
  'austin': [30.2672, -97.7431],
  'seattle': [47.6062, -122.3321],
  'portland': [45.5152, -122.6784],
  'atlanta': [33.7490, -84.3880],
  'orlando': [28.5383, -81.3792],
  'tucson': [32.2226, -110.9747],
  'albuquerque': [35.0844, -106.6504],
  'sacramento': [38.5816, -121.4944],
  'oaxaca': [17.0732, -96.7266],
  'guadalupe': [25.6772, -100.2601],
  'aguascalientes': [21.8853, -102.2916],
  'morelia': [19.7059, -101.1949],
  'toluca': [19.2826, -99.6557],
  'chihuahua': [28.6353, -106.0889],
  'durango': [24.0277, -104.6532],
  'tampico': [22.2331, -97.8611],
  'veracruz': [19.1738, -96.1342],
  'villahermosa': [17.9892, -92.9475],
  'tuxtla gutierrez': [16.7528, -93.1152],
  'madrid': [40.4168, -3.7038],
  'barcelona': [41.3874, 2.1686],
};

function getCoords(locationName) {
  if (!locationName) return null;
  const key = locationName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (CITY_COORDS[key]) return CITY_COORDS[key];
  // Try partial match
  for (const [k, v] of Object.entries(CITY_COORDS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return null;
}

function createIcon(color, count) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:3px solid white;">${count}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

const locationColors = ['#B8654A', '#6B9080', '#B8976A', '#0F172A'];

function getColorForIndex(index) {
  return locationColors[index % locationColors.length];
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export default function FamilyMap() {
  const [locationGroups, setLocationGroups] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLocations() {
      try {
        const members = await getFamilyMembers();
        const groups = {};

        const normalize = (loc) => {
          if (!loc) return null;
          const t = loc.trim();
          if (!t) return null;
          // Use the location as-is since Firestore already has normalized values
          return t;
        };

        const addPerson = (person) => {
          const loc = normalize(person.location);
          if (loc) {
            if (!groups[loc]) groups[loc] = [];
            groups[loc].push({ name: person.name, photoURL: person.photoURL });
          }
          if (person.spouse && typeof person.spouse === 'object') {
            const sLoc = normalize(person.spouse.location);
            if (sLoc) {
              if (!groups[sLoc]) groups[sLoc] = [];
              groups[sLoc].push({ name: person.spouse.name, photoURL: person.spouse.photoURL });
            }
          }
          if (person.children) {
            person.children.forEach((c) => addPerson(c));
          }
        };

        members.forEach((member) => addPerson(member));

        setLocationGroups(groups);
      } catch (error) {
        console.error('Error loading family locations:', error);
      } finally {
        setLoading(false);
      }
    }

    loadLocations();
  }, []);

  const locations = Object.keys(locationGroups);
  const totalPeople = Object.values(locationGroups).reduce(
    (sum, group) => sum + group.length,
    0
  );

  return (
    <section
      id="mapa"
      className="py-20 px-4"
      style={{ backgroundColor: '#0F172A' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[11px] font-sans font-medium uppercase tracking-[5px] text-white/40 mb-4">Donde estamos</p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-white mb-5">
            Donde Estamos
          </h2>
          <div className="w-8 h-[1px] bg-[#B8654A] mx-auto mb-5" />
          <p className="text-lg max-w-2xl mx-auto text-white/50">
            Nuestra familia se extiende por distintos lugares, pero siempre
            permanecemos unidos sin importar la distancia.
          </p>
        </motion.div>

        {/* Stats */}
        {locations.length > 0 && (
          <motion.div
            className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-12"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div
              className="rounded-2xl p-5 text-center shadow-sm"
              style={{ backgroundColor: '#6B9080', color: '#fff' }}
            >
              <Globe className="mx-auto mb-2" size={28} />
              <p className="text-3xl font-bold">{locations.length}</p>
              <p className="text-sm opacity-90">
                {locations.length === 1 ? 'Ubicacion' : 'Ubicaciones'}
              </p>
            </div>
            <div
              className="rounded-2xl p-5 text-center shadow-sm"
              style={{ backgroundColor: '#B8654A', color: '#fff' }}
            >
              <Users className="mx-auto mb-2" size={28} />
              <p className="text-3xl font-bold">{totalPeople}</p>
              <p className="text-sm opacity-90">
                {totalPeople === 1 ? 'Familiar' : 'Familiares'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Interactive Map */}
        {!loading && locations.length > 0 && (() => {
          const markers = locations.map((loc, i) => ({
            name: loc,
            coords: getCoords(loc),
            count: locationGroups[loc].length,
            color: getColorForIndex(i),
            people: locationGroups[loc],
          })).filter(m => m.coords);

          if (markers.length === 0) return null;

          const centerLat = markers.reduce((s, m) => s + m.coords[0], 0) / markers.length;
          const centerLng = markers.reduce((s, m) => s + m.coords[1], 0) / markers.length;

          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-12 rounded-2xl overflow-hidden shadow-lg border-4 border-white/80"
              style={{ height: '400px' }}
            >
              <MapContainer center={[centerLat, centerLng]} zoom={5} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                {markers.map((m) => (
                  <Marker key={m.name} position={m.coords} icon={createIcon(m.color, m.count)}>
                    <Popup>
                      <div style={{ minWidth: '150px' }}>
                        <p style={{ fontWeight: 'bold', fontSize: '14px', color: '#FFFFFF', marginBottom: '4px' }}>{m.name}</p>
                        <p style={{ fontSize: '12px', color: '#7A6B5D', marginBottom: '6px' }}>{m.count} {m.count === 1 ? 'familiar' : 'familiares'}</p>
                        {m.people.map((p, i) => (
                          <p key={i} style={{ fontSize: '11px', color: '#FFFFFF', padding: '1px 0' }}>• {p.name}</p>
                        ))}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </motion.div>
          );
        })()}

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <div
              className="inline-block w-10 h-10 border-4 rounded-full animate-spin"
              style={{
                borderColor: '#B8654A',
                borderTopColor: 'transparent',
              }}
            />
            <p className="mt-4 text-white/50">
              Cargando ubicaciones...
            </p>
          </div>
        )}

        {/* No locations message */}
        {!loading && locations.length === 0 && (
          <motion.div
            className="text-center py-16 rounded-2xl shadow-sm bg-white/5"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Home
              className="mx-auto mb-4"
              size={48}
              style={{ color: '#B8976A' }}
            />
            <p
              className="text-lg font-medium mb-2 text-white"
            >
              Agrega la ubicacion de cada familia en su perfil
            </p>
            <p className="text-sm text-white/50">
              Cuando los miembros tengan una ubicacion asignada, apareceran aqui
              agrupados por ciudad.
            </p>
          </motion.div>
        )}

        {/* Location Cards Grid */}
        {!loading && locations.length > 0 && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {locations.map((location, index) => {
              const members = locationGroups[location];
              const color = getColorForIndex(index);

              return (
                <motion.div
                  key={location}
                  variants={cardVariants}
                  className="bg-white/5 rounded-2xl shadow-md overflow-hidden"
                  style={{ borderLeft: `4px solid ${color}` }}
                >
                  {/* Card Header */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin size={22} style={{ color }} />
                        <h3
                          className="text-xl font-bold text-white"
                        >
                          {location}
                        </h3>
                      </div>
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: `${color}20`,
                          color,
                        }}
                      >
                        {members.length}{' '}
                        {members.length === 1 ? 'persona' : 'personas'}
                      </span>
                    </div>

                    {/* Members list */}
                    <ul className="space-y-2">
                      {members.map((member) => (
                        <li
                          key={member.id}
                          className="flex items-center gap-2 text-sm text-white/70"
                        >
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span>
                            {member.name || member.nombre || 'Sin nombre'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
}
