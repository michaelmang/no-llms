const GALLERY_SIZE = 9;
const ONLINE_ARTWORKS_PER_SOURCE = 4;
let metObjectIds;
const ARTWORKS = [
  ["art-1.jpg", "The Bedroom", "Vincent van Gogh", "1889"],
  ["art-2.jpg", "Paris Street; Rainy Day", "Gustave Caillebotte", "1877"],
  ["art-3.jpg", "A Sunday on La Grande Jatte", "Georges Seurat", "1884–86"],
  ["art-4.jpg", "Under the Wave off Kanagawa", "Katsushika Hokusai", "1830/33"],
  ["art-5.jpg", "The Assumption of the Virgin", "El Greco", "1577–79"],
  ["art-6.jpg", "Stacks of Wheat", "Claude Monet", "1890–91"],
  ["art-7.jpg", "Water Lilies", "Claude Monet", "1906"],
  ["art-8.jpg", "Two Sisters (On the Terrace)", "Pierre-Auguste Renoir", "1881"],
  ["art-9.jpg", "Self-Portrait", "Vincent van Gogh", "1887"],
  ["art-10.jpg", "The Child's Bath", "Mary Cassatt", "1893"],
  ["art-11.jpg", "At the Moulin Rouge", "Henri de Toulouse-Lautrec", "1892–95"],
  ["art-12.jpg", "Arrival of the Normandy Train", "Claude Monet", "1877"],
  ["art-13.jpg", "The Basket of Apples", "Paul Cezanne", "c. 1893"],
  ["art-14.jpg", "Woman at Her Toilette", "Berthe Morisot", "1875–80"],
  ["art-15.jpg", "Saint George and the Dragon", "Bernat Martorell", "1434–35"],
  ["art-16.jpg", "Distant View of Niagara Falls", "Thomas Cole", "1830"],
  ["art-17.jpg", "The Beach at Sainte-Adresse", "Claude Monet", "1867"],
  ["art-18.jpg", "The Crucifixion", "Francisco de Zurbarán", "1627"],
  ["art-19.jpg", "The Herring Net", "Winslow Homer", "1885"],
  ["art-20.jpg", "The Girl by the Window", "Edvard Munch", "1893"]
].map(([image, title, artist, year]) => ({ image, title, artist, year }));

const gallery = document.querySelector("#gallery");
const refreshButton = document.querySelector("#refresh-gallery");
const radio = document.querySelector("#radio");
const radioButton = document.querySelector("#radio-toggle");

function createArtworkCard(artwork) {
  const card = document.createElement("article");
  card.className = "artwork";
  const image = document.createElement("img");
  image.loading = "lazy";
  image.src = artwork.image.startsWith("https://") ? artwork.image : `assets/${artwork.image}`;
  image.alt = artwork.title;
  image.addEventListener("error", () => {
    if (image.dataset.usedFallback) return;
    image.dataset.usedFallback = "true";
    image.src = `assets/${ARTWORKS[Math.floor(Math.random() * ARTWORKS.length)].image}`;
  });

  const caption = document.createElement("div");
  caption.className = "caption";
  const title = document.createElement("h3");
  title.textContent = artwork.title;
  const details = document.createElement("p");
  details.textContent = `${artwork.artist} · ${artwork.year}`;
  caption.append(title, details);
  card.append(image, caption);
  return card;
}

function renderLoadingGallery() {
  const placeholders = Array.from({ length: GALLERY_SIZE }, () => {
    const card = document.createElement("div");
    card.className = "artwork placeholder";
    card.setAttribute("aria-hidden", "true");
    return card;
  });
  gallery.replaceChildren(...placeholders);
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function loadArtInstituteWorks() {
  const page = Math.floor(Math.random() * 100) + 1;
  const params = new URLSearchParams({
    "query[term][is_public_domain]": "true",
    page: String(page),
    limit: "40",
    fields: "title,artist_title,date_display,image_id"
  });
  const { data } = await fetchJson(`https://api.artic.edu/api/v1/artworks/search?${params}`);
  return data
    .filter((artwork) => artwork.image_id)
    .map((artwork) => ({
      image: `https://www.artic.edu/iiif/2/${artwork.image_id}/full/600,/0/default.jpg`,
      title: artwork.title || "Untitled",
      artist: artwork.artist_title || "Unknown artist",
      year: artwork.date_display || "",
      source: "Art Institute of Chicago"
    }));
}

async function loadMetWorks() {
  if (!metObjectIds) {
    const query = await fetchJson("https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&q=painting");
    metObjectIds = query.objectIDs || [];
  }
  const candidates = shuffledArtworks(metObjectIds).slice(0, 12);
  const records = await Promise.all(candidates.map((id) =>
    fetchJson(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`).catch(() => null)
  ));
  return records
    .filter((artwork) => artwork?.isPublicDomain && artwork.primaryImageSmall)
    .map((artwork) => ({
      image: artwork.primaryImageSmall,
      title: artwork.title || "Untitled",
      artist: artwork.artistDisplayName || "Unknown artist",
      year: artwork.objectDate || "",
      source: "The Metropolitan Museum of Art"
    }));
}

function shuffledArtworks(items = ARTWORKS) {
  const artworks = [...items];
  for (let index = artworks.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [artworks[index], artworks[randomIndex]] = [artworks[randomIndex], artworks[index]];
  }
  return artworks.slice(0, GALLERY_SIZE);
}

async function loadGallery() {
  gallery.setAttribute("aria-busy", "true");
  refreshButton.disabled = true;
  renderLoadingGallery();

  const [artInstitute, met] = await Promise.allSettled([loadArtInstituteWorks(), loadMetWorks()]);
  const onlineWorks = [
    ...(artInstitute.status === "fulfilled" ? shuffledArtworks(artInstitute.value).slice(0, ONLINE_ARTWORKS_PER_SOURCE) : []),
    ...(met.status === "fulfilled" ? shuffledArtworks(met.value).slice(0, ONLINE_ARTWORKS_PER_SOURCE) : [])
  ];
  const localWorks = shuffledArtworks().slice(0, Math.max(0, GALLERY_SIZE - onlineWorks.length));
  const works = shuffledArtworks([...onlineWorks, ...localWorks]).slice(0, GALLERY_SIZE);
  gallery.replaceChildren(...works.map(createArtworkCard));
  gallery.setAttribute("aria-busy", "false");
  refreshButton.disabled = false;
}

async function startRadio() {
  try {
    await radio.play();
    radioButton.textContent = "Pause radio";
  } catch (error) {
    console.warn(error);
  }
}

radioButton.addEventListener("click", async () => {
  if (radio.paused) {
    await startRadio();
  } else {
    radio.pause();
    radioButton.textContent = "Play radio";
  }
});

radio.addEventListener("playing", () => {
  radioButton.textContent = "Pause radio";
});
radio.addEventListener("error", () => {
  radioButton.textContent = "Try radio again";
});

refreshButton.addEventListener("click", loadGallery);
loadGallery();
startRadio();
