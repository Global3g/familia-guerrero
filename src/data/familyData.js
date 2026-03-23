// ============================================
// DATOS DEMO - Familia Guerrero
// ============================================
// Reemplaza estos datos con la informacion real.
// Cada seccion esta claramente separada para facilitar la edicion.

// ABUELOS - Punto de partida del arbol
export const grandparents = {
  grandfather: {
    id: 'abuelo-1',
    name: 'Jose Manuel Guerrero',
    fullName: 'Jose Manuel Guerrero Lopez',
    birthDate: '1925-03-15',
    deathDate: '2005-11-20',
    birthPlace: 'Guadalajara, Jalisco',
    photo: null, // Reemplazar con URL de foto
    role: 'Patriarca',
    bio: 'Hombre de campo y corazon noble. Trabajo toda su vida para dar lo mejor a su familia. Su legado vive en cada uno de nosotros.',
    values: ['Trabajo duro', 'Honestidad', 'Familia primero'],
    quote: '"La familia es la tierra donde echamos raices y desde donde crecemos hacia el cielo."',
  },
  grandmother: {
    id: 'abuela-1',
    name: 'Maria Elena Guerrero',
    fullName: 'Maria Elena Rodriguez de Guerrero',
    birthDate: '1928-08-22',
    deathDate: '2018-04-10',
    birthPlace: 'Guadalajara, Jalisco',
    photo: null,
    role: 'Matriarca',
    bio: 'Mujer fuerte, amorosa y sabia. Su cocina reunia a toda la familia. Nos enseno que el amor se demuestra con hechos.',
    values: ['Amor incondicional', 'Fe', 'Generosidad'],
    quote: '"Donde come uno, comen todos."',
  },
  weddingDate: '1948-06-12',
  weddingPlace: 'Parroquia de San Jose, Guadalajara',
  story: 'Se conocieron en la plaza del pueblo un domingo de mercado. Construyeron juntos una familia de valores solidos, amor profundo y tradiciones que perduran hasta hoy.',
}

// HIJOS DE LOS ABUELOS (Segunda generacion)
export const children = [
  {
    id: 'hijo-1',
    name: 'Roberto Guerrero Rodriguez',
    nickname: 'Don Beto',
    birthDate: '1950-01-10',
    photo: null,
    role: 'Hijo mayor',
    spouse: 'Carmen Diaz de Guerrero',
    spousePhoto: null,
    bio: 'El primogenito. Heredo el caracter fuerte de su padre y la ternura de su madre.',
    children: [
      { id: 'nieto-1', name: 'Roberto Jr.', birthDate: '1975-04-22', photo: null },
      { id: 'nieta-1', name: 'Carolina Guerrero', birthDate: '1978-09-15', photo: null },
      { id: 'nieto-2', name: 'Alejandro Guerrero', birthDate: '1982-12-03', photo: null },
    ],
  },
  {
    id: 'hija-1',
    name: 'Maria Teresa Guerrero Rodriguez',
    nickname: 'Tere',
    birthDate: '1952-07-18',
    photo: null,
    role: 'Hija',
    spouse: 'Luis Hernandez',
    spousePhoto: null,
    bio: 'La mas alegre de todos. Siempre con una sonrisa y una palabra de aliento para quien lo necesite.',
    children: [
      { id: 'nieto-3', name: 'Luis Fernando Hernandez', birthDate: '1976-03-08', photo: null },
      { id: 'nieta-2', name: 'Gabriela Hernandez', birthDate: '1980-11-25', photo: null },
    ],
  },
  {
    id: 'hijo-2',
    name: 'Francisco Guerrero Rodriguez',
    nickname: 'Paco',
    birthDate: '1955-11-30',
    photo: null,
    role: 'Hijo',
    spouse: 'Rosa Martinez de Guerrero',
    spousePhoto: null,
    bio: 'El aventurero de la familia. Viajo por todo Mexico antes de sentar cabeza.',
    children: [
      { id: 'nieta-3', name: 'Daniela Guerrero', birthDate: '1983-06-14', photo: null },
      { id: 'nieto-4', name: 'Francisco Guerrero Jr.', birthDate: '1986-02-28', photo: null },
      { id: 'nieta-4', name: 'Valeria Guerrero', birthDate: '1990-08-19', photo: null },
    ],
  },
  {
    id: 'hija-2',
    name: 'Guadalupe Guerrero Rodriguez',
    nickname: 'Lupita',
    birthDate: '1958-12-12',
    photo: null,
    role: 'Hija',
    spouse: 'Miguel Angel Ramirez',
    spousePhoto: null,
    bio: 'La consentida de Don Jose Manuel. Tiene el don de unir a la familia en cada reunion.',
    children: [
      { id: 'nieto-5', name: 'Miguel Ramirez Jr.', birthDate: '1984-10-05', photo: null },
      { id: 'nieta-5', name: 'Fernanda Ramirez', birthDate: '1988-07-22', photo: null },
    ],
  },
  {
    id: 'hijo-3',
    name: 'Antonio Guerrero Rodriguez',
    nickname: 'Toño',
    birthDate: '1962-05-08',
    photo: null,
    role: 'Hijo menor',
    spouse: 'Patricia Flores de Guerrero',
    spousePhoto: null,
    bio: 'El mas joven de los hermanos. Heredo la sabiduria de su madre y el emprendimiento de su padre.',
    children: [
      { id: 'nieta-6', name: 'Sofia Guerrero', birthDate: '1992-01-15', photo: null },
      { id: 'nieto-6', name: 'Diego Guerrero', birthDate: '1995-04-30', photo: null },
      { id: 'nieta-7', name: 'Isabella Guerrero', birthDate: '2000-09-12', photo: null },
    ],
  },
]

// TIMELINE - Momentos importantes
export const timelineEvents = [
  { year: 1948, date: '12 de Junio, 1948', title: 'La boda que inicio todo', description: 'Jose Manuel y Maria Elena unen sus vidas en matrimonio.', type: 'boda', icon: 'heart' },
  { year: 1950, date: '10 de Enero, 1950', title: 'Nace Roberto', description: 'Llega el primogenito de la familia Guerrero.', type: 'nacimiento', icon: 'baby' },
  { year: 1952, date: '18 de Julio, 1952', title: 'Nace Maria Teresa', description: 'La alegria de la familia llega al mundo.', type: 'nacimiento', icon: 'baby' },
  { year: 1955, date: '30 de Noviembre, 1955', title: 'Nace Francisco', description: 'El aventurero de la familia hace su entrada.', type: 'nacimiento', icon: 'baby' },
  { year: 1958, date: '12 de Diciembre, 1958', title: 'Nace Guadalupe', description: 'Un regalo en el dia de la Virgen.', type: 'nacimiento', icon: 'baby' },
  { year: 1962, date: '8 de Mayo, 1962', title: 'Nace Antonio', description: 'El menor de los hermanos completa la familia.', type: 'nacimiento', icon: 'baby' },
  { year: 1970, date: 'Verano de 1970', title: 'Primera reunion familiar', description: 'Toda la familia reunida por primera vez en la casa de Guadalajara. Una tradicion que perduraria por decadas.', type: 'reunion', icon: 'users' },
  { year: 1975, date: '22 de Abril, 1975', title: 'Nace el primer nieto', description: 'Roberto Jr. llega al mundo. Una nueva generacion comienza.', type: 'nacimiento', icon: 'baby' },
  { year: 1998, date: 'Junio de 1998', title: 'Bodas de Oro', description: 'Jose Manuel y Maria Elena celebran 50 años de matrimonio rodeados de toda su familia.', type: 'aniversario', icon: 'award' },
  { year: 2000, date: 'Septiembre de 2000', title: 'Nueva generacion', description: 'Con el nacimiento de Isabella, la familia Guerrero suma mas de 20 integrantes.', type: 'nacimiento', icon: 'baby' },
  { year: 2005, date: '20 de Noviembre, 2005', title: 'Partida de Don Jose Manuel', description: 'El patriarca descansa en paz, dejando un legado imborrable.', type: 'memorial', icon: 'star' },
  { year: 2018, date: '10 de Abril, 2018', title: 'Partida de Doña Maria Elena', description: 'La matriarca se reune con el amor de su vida, dejando una huella eterna.', type: 'memorial', icon: 'star' },
  { year: 2024, date: 'Diciembre de 2024', title: 'Reunion de las nuevas generaciones', description: 'Primos y sobrinos organizan por primera vez la reunion familiar anual.', type: 'reunion', icon: 'users' },
]

// GALERIA DE FOTOS
export const galleryPhotos = [
  { id: 1, category: 'abuelos', caption: 'Jose Manuel y Maria Elena, dia de su boda - 1948', year: 1948, photo: null },
  { id: 2, category: 'abuelos', caption: 'Los abuelos en su casa de Guadalajara', year: 1960, photo: null },
  { id: 3, category: 'infancia', caption: 'Los cinco hermanos Guerrero Rodriguez', year: 1965, photo: null },
  { id: 4, category: 'bodas', caption: 'Boda de Roberto y Carmen', year: 1974, photo: null },
  { id: 5, category: 'bodas', caption: 'Boda de Tere y Luis', year: 1975, photo: null },
  { id: 6, category: 'reuniones', caption: 'Navidad en familia - todos juntos', year: 1985, photo: null },
  { id: 7, category: 'reuniones', caption: 'Bodas de Oro de los abuelos', year: 1998, photo: null },
  { id: 8, category: 'generaciones', caption: 'Cuatro generaciones juntas', year: 2000, photo: null },
  { id: 9, category: 'cumpleaños', caption: 'Cumpleaños 80 de Doña Maria Elena', year: 2008, photo: null },
  { id: 10, category: 'reuniones', caption: 'Reunion familiar 2024', year: 2024, photo: null },
  { id: 11, category: 'recuerdos', caption: 'La cocina de la abuela', year: 1990, photo: null },
  { id: 12, category: 'generaciones', caption: 'Los nietos en Navidad', year: 2015, photo: null },
]

// EVENTOS PROXIMOS
export const upcomingEvents = [
  { id: 1, title: 'Cumpleaños de Sofia', date: '2026-01-15', type: 'cumpleaños', location: 'Ciudad de Mexico', description: 'Sofia cumple 34 años' },
  { id: 2, title: 'Aniversario Roberto y Carmen', date: '2026-03-20', type: 'aniversario', location: 'Guadalajara', description: '52 años de casados' },
  { id: 3, title: 'Reunion Familiar Anual', date: '2026-07-15', type: 'reunion', location: 'Casa familiar, Guadalajara', description: 'La tradicion continua - todos invitados' },
  { id: 4, title: 'Cumpleaños de Isabella', date: '2026-09-12', type: 'cumpleaños', location: 'Monterrey', description: 'Isabella cumple 26 años' },
  { id: 5, title: 'Navidad en Familia', date: '2026-12-24', type: 'celebracion', location: 'Casa familiar, Guadalajara', description: 'Cena de Nochebuena todos juntos' },
]

// HOMENAJE - Quienes ya no estan
export const memorials = [
  {
    id: 'memorial-1',
    name: 'Jose Manuel Guerrero Lopez',
    photo: null,
    birthDate: '1925-03-15',
    deathDate: '2005-11-20',
    relationship: 'Abuelo paterno - Patriarca',
    tribute: 'Nos enseno que la familia es lo mas importante. Su fuerza, su bondad y su ejemplo siguen guiandonos cada dia.',
    legacy: 'El valor del trabajo honesto y el amor por la familia.',
  },
  {
    id: 'memorial-2',
    name: 'Maria Elena Rodriguez de Guerrero',
    photo: null,
    birthDate: '1928-08-22',
    deathDate: '2018-04-10',
    relationship: 'Abuela paterna - Matriarca',
    tribute: 'Su amor era infinito, su cocina magica y su abrazo el lugar mas seguro del mundo. Donde quiera que este, nos sigue cuidando.',
    legacy: 'La generosidad sin limites y la fe inquebrantable.',
  },
]

// TRADICIONES Y VALORES
export const traditions = [
  { title: 'La cena de los domingos', description: 'Cada domingo, sin falta, la familia se reune a comer en casa de los abuelos. Mole, arroz y muchas risas.', icon: 'utensils' },
  { title: 'Las posadas', description: 'Desde 1955, la familia organiza posadas en diciembre. Los niños rompen la piñata y los grandes cantan las letanias.', icon: 'music' },
  { title: 'El album de fotos', description: 'Cada año se toma una foto familiar oficial. El album ya tiene mas de 70 años de historia.', icon: 'camera' },
  { title: 'La receta de la abuela', description: 'El mole de Doña Maria Elena es legendario. La receta se pasa de madre a hija, de generacion en generacion.', icon: 'chef-hat' },
  { title: 'El brindis del abuelo', description: '"Por la familia, por la salud y por estar juntos". Cada reunion termina con el brindis que Don Jose Manuel inicio.', icon: 'wine' },
  { title: 'Carta del año', description: 'Cada Año Nuevo, un miembro distinto lee una carta compartiendo lo vivido. Una tradicion que empezo Tere en 1990.', icon: 'scroll' },
]

// VALORES FAMILIARES
export const familyValues = [
  'Union familiar',
  'Respeto a los mayores',
  'Trabajo honesto',
  'Amor incondicional',
  'Fe y esperanza',
  'Generosidad',
  'Alegria de vivir',
  'Lealtad',
]

// MENSAJES Y RECUERDOS (Demo)
export const messages = [
  { id: 1, author: 'Carolina Guerrero', date: '2024-12-20', message: 'Abuelita, cada vez que huelo canela me acuerdo de tu cocina. Te extraño todos los dias.', photo: null },
  { id: 2, author: 'Diego Guerrero', date: '2024-11-15', message: 'Gracias abuelo por enseñarme a ser fuerte. Tu ejemplo me acompaña siempre.', photo: null },
  { id: 3, author: 'Fernanda Ramirez', date: '2024-10-08', message: 'Que orgullo ser parte de esta familia. Somos muchos, pero el amor alcanza para todos.', photo: null },
  { id: 4, author: 'Sofia Guerrero', date: '2024-09-22', message: 'La reunion de este año fue increible. Los abuelos estarian tan felices de vernos juntos.', photo: null },
  { id: 5, author: 'Roberto Guerrero Jr.', date: '2024-08-30', message: 'Encontre una foto del abuelo de joven. Era igualito a mi hijo. La genetica Guerrero es fuerte.', photo: null },
]

// Categorias de la galeria
export const galleryCategories = [
  { id: 'todos', label: 'Todos' },
  { id: 'abuelos', label: 'Abuelos' },
  { id: 'infancia', label: 'Infancia' },
  { id: 'bodas', label: 'Bodas' },
  { id: 'cumpleaños', label: 'Cumpleaños' },
  { id: 'reuniones', label: 'Reuniones' },
  { id: 'generaciones', label: 'Generaciones' },
  { id: 'recuerdos', label: 'Recuerdos' },
]
