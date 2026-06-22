export const site = {
  name: 'La Vie',
  tagline: 'Spray Tan Salon',
  city: 'Čačak',
  logo: '/assets/logo.png',
  phone: '+381 69 190 9009',
  phoneHref: 'tel:+381691909009',
  email: 'majstorovic9@gmail.com',
  address: 'Bulevar vojvode Putnika, Čačak',
  mapsUrl: 'https://maps.google.com/?q=43.8987680,20.3539380',
  instagram: 'https://www.instagram.com/studio.la_vie_cacak',
  instagramHandle: '@studio.la_vie_cacak',
  years: 7,
  hours: 'Pon–Pet: 08:00–20:00 · Sub: 08:00–17:00 · Ned: Zatvoreno',
  description:
    'La Vie već 7 godina brine o vašem prirodnom preplanulom tenu. Nekada na gradskom šetalištu, danas na novoj lokaciji, nastavljamo sa istim kvalitetom i profesionalizmom. Koristimo vrhunske boje na biljnoj bazi za zdrav i prirodan izgled kože.',
  quote: 'Vaša koža je platno, mi joj samo vraćamo svetlost.',
}

export const images = {
  brand: {
    src: '/assets/1000063215.jpg',
    alt: 'La Vie — neon znak salona',
    position: 'center center',
  },
  shimmer: {
    src: '/assets/1000063217.jpg',
    alt: 'Profesionalni spray tan tretman',
    position: 'center 40%',
  },
  glow: {
    src: '/assets/1000063218.jpg',
    alt: 'Prirodni, svetli ten',
    position: 'center 25%',
  },
  bronze: {
    src: '/assets/1000063219.jpg',
    alt: 'Tamnija varijanta potamnjivanja',
    position: 'center center',
  },
}

export const services = [
  {
    id: 'spray-tan',
    title: 'Spray Tan',
    description:
      'Profesionalno potamnjivanje kože vrhunskim bojama na biljnoj bazi za zdrav, prirodan i dugotrajan izgled.',
    price: 'Po dogovoru',
    image: images.shimmer,
  },
  {
    id: 'natural-glow',
    title: 'Natural Glow',
    description:
      'Suptilna, svetlija varijanta potamnjivanja za one koji žele prirodan, sunčani ten bez preterivanja.',
    price: 'Po dogovoru',
    image: images.glow,
  },
  {
    id: 'deep-bronze',
    title: 'Deep Bronze',
    description:
      'Intenzivnija, tamnija varijanta za savršen bronzani ten koji traje nedeljama.',
    price: 'Po dogovoru',
    image: images.bronze,
  },
]

/** Čista 2×2 galerija — samo slike bez IG overlay-a */
export const lookbook = [
  {
    src: images.brand.src,
    alt: 'La Vie salon — neon znak',
    position: 'center center',
  },
  {
    src: images.glow.src,
    alt: 'Prirodni glow',
    position: images.glow.position,
  },
  {
    src: images.shimmer.src,
    alt: 'Spray tan tretman',
    position: images.shimmer.position,
  },
  {
    src: images.bronze.src,
    alt: 'Deep bronze rezultat',
    position: images.bronze.position,
  },
]

export const navLinks = [
  { href: '#pocetna', label: 'POČETNA' },
  { href: '#usluge', label: 'USLUGE' },
  { href: '#lookbook', label: 'LOOKBOOK' },
  { href: '#utisci', label: 'UTISCI' },
  { href: '#kontakt', label: 'KONTAKT' },
]

export const testimonials = [
  {
    id: 1,
    quote:
      'Prvi put sam probala spray tan u La Vie i odmah sam se zaljubila. Ten izgleda potpuno prirodno — niko ne veruje da nisam bila na suncu. Gordana je prava umetnica!',
    name: 'Jelena M.',
  },
  {
    id: 2,
    quote:
      'Već godinama dolazim na tretman i uvek izađem savršeno zadovoljna. Boje na biljnoj bazi ne isušuju kožu, a bronza mi lako traje dve nedelje.',
    name: 'Milica P.',
  },
  {
    id: 3,
    quote:
      'Najbolji spray tan u Čačku, bez diskusije. Profesionalan pristup, prelepa atmosfera u salonu i rezultat koji uvek izgleda kao sa plaže.',
    name: 'Ana R.',
  },
  {
    id: 4,
    quote:
      'Imala sam strah od narandžastog tena, ali ovde sam dobila tačno ono što sam htela — prirodan glow bez fleka. Preporučujem svima!',
    name: 'Tamara S.',
  },
  {
    id: 5,
    quote:
      'La Vie mi je spašio dan pred venčanje. Ten je bio ravnomeran, lep i držao se celu proslavu. Hvala, Gordana!',
    name: 'Nina K.',
  },
  {
    id: 6,
    quote:
      'Gordana uvek nađe savršenu nijansu za moj tip kože. Osećam se samopouzdanije posle svakog dolaska — to je više od tretmana, to je ritual.',
    name: 'Sofija V.',
  },
]
