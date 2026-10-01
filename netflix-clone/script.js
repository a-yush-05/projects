const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmODZiMDVkMWM1MGI5NTRiZGE2OGVmOThkOTYyOGMxOSIsIm5iZiI6MTc5MDg1MDE4Ni41MTIsInN1YiI6IjZhYmUzNDhhODc4ZjEyZTE0NjI3NDc3YiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.JdDgtIAkofj8COqbK7kgLvG0ANtxONxcf9rt6BR3qY4";
let movies = [];
async function testTMDB() {
  const response = await fetch(
    "https://api.themoviedb.org/3/trending/movie/day",
    {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`
      }
    }
  );

  const data = await response.json();

  console.log(data);
}

testTMDB();
const genreMap = {
  28: "Action",
  35: "Comedy",
  18: "Drama",
  878: "Sci-Fi",
  12: "Adventure",
  16: "Animation",
  80: "Crime",
  99: "Documentary",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western"
};
async function getMovies() {
  const endpoints = [
    "https://api.themoviedb.org/3/trending/movie/day",
    "https://api.themoviedb.org/3/movie/popular",
    "https://api.themoviedb.org/3/movie/top_rated"
  ];

  const responses = await Promise.all(
    endpoints.map((url) =>
      fetch(url, {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`
        }
      })
    )
  );

  const data = await Promise.all(
    responses.map((response) => response.json())
  );

  const trendingMovies = data[0].results;
  const popularMovies = data[1].results;
  const topRatedMovies = data[2].results;

 const allMovies = [
  ...trendingMovies.map((movie) => ({
    ...movie,
    tags: ["trending"]
  })),

  ...popularMovies.map((movie) => ({
    ...movie,
    tags: ["popular"]
  })),

  ...topRatedMovies.map((movie) => ({
    ...movie,
    tags: ["recommended"]
  }))
];

const uniqueMovies = new Map();

allMovies.forEach((movie) => {
  if (uniqueMovies.has(movie.id)) {
    const existing = uniqueMovies.get(movie.id);

    existing.tags = [
      ...new Set([...existing.tags, ...movie.tags])
    ];
  } else {
    uniqueMovies.set(movie.id, movie);
  }
});

movies = Array.from(uniqueMovies.values()).map((movie) => ({
  id: movie.id,
  title: movie.title,
  year: movie.release_date
    ? movie.release_date.substring(0, 4)
    : "N/A",
  genre: genreMap[movie.genre_ids?.[0]] || "Other",
  rating: movie.vote_average.toFixed(1),
  desc: movie.overview,
  poster_path: movie.poster_path,
  backdrop_path: movie.backdrop_path,
  tags: movie.tags,
  type: "movie"
}));

  console.log("TMDB movies:", movies);
}
const STORAGE_KEY = "streamflix-my-list";

const rows = [
  { title: "Trending", test: (m) => m.tags.includes("trending") },
  { title: "Popular", test: (m) => m.tags.includes("popular") },
  { title: "Action", test: (m) => m.genre === "Action" },
  { title: "Comedy", test: (m) => m.genre === "Comedy" },
  { title: "Sci-Fi", test: (m) => m.genre === "Sci-Fi" },
  { title: "Drama", test: (m) => m.genre === "Drama" },
  { title: "Recommended", test: (m) => m.tags.includes("recommended") }
];

const navbar = document.getElementById("navbar");
const nav = document.getElementById("nav");
const menuToggle = document.getElementById("menu-toggle");
const hero = document.getElementById("hero");
const content = document.getElementById("content");
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const clearButton = document.getElementById("clear-search");
const modal = document.getElementById("modal");
const modalImg = document.getElementById("modal-img");
const modalTitle = document.getElementById("modal-title");
const modalMeta = document.getElementById("modal-meta");
const modalDesc = document.getElementById("modal-desc");
const modalList = document.getElementById("modal-list");
const modalClose = document.getElementById("modal-close");

let myList = loadList();
let view = "home";
let query = "";
let openId = null;

function loadList() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Could not read My List:", error);
    return [];
  }
}

function saveList() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(myList));
  } catch (error) {
    console.error("Could not save My List:", error);
  }
}

function inList(id) {
  return myList.includes(id);
}

function toggleList(id) {
  if (inList(id)) {
    myList = myList.filter((savedId) => savedId !== id);
  } else {
    myList.push(id);
  }
  saveList();
  render();
  if (openId === id) {
    updateModalButton();
  }
}

function posterUrl(movie) {
  return `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
}

function backdropUrl(movie) {
  return `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`;
}

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function cardHTML(movie) {
  return `
    <article class="card" data-id="${movie.id}" tabindex="0">
      <img src="${posterUrl(movie)}" alt="${movie.title} poster" loading="lazy">
      <div class="card-info">
        <h3>${movie.title}</h3>
        <p>${movie.year} | ${movie.genre} | Rating ${movie.rating}</p>
        <button class="card-list" data-id="${movie.id}">
          ${inList(movie.id) ? "Remove from My List" : "Add to My List"}
        </button>
      </div>
    </article>`;
}

function rowHTML(title, items) {
  return `
    <section class="row">
      <h2>${title}</h2>
      <div class="row-list">${items.map(cardHTML).join("")}</div>
    </section>`;
}

function gridTitle() {
  if (query) return "Search results";
  if (view === "movie") return "Movies";
  if (view === "show") return "TV Shows";
  return "My List";
}

function emptyHTML() {
  if (query) {
    return `<div class="empty"><h2>No results for "${escapeHTML(query)}"</h2><p>Check the spelling or try another title.</p></div>`;
  }
  if (view === "list") {
    return `<div class="empty"><h2>Your list is empty</h2><p>Choose "Add to My List" on any title to save it here.</p></div>`;
  }
  return `<div class="empty"><h2>Nothing to show</h2></div>`;
}

function getVisible() {
  let items = movies;
  if (view === "movie" || view === "show") {
    items = items.filter((m) => m.type === view);
  }
  if (view === "list") {
    items = items.filter((m) => inList(m.id));
  }
  if (query) {
    items = items.filter((m) => m.title.toLowerCase().includes(query));
  }
  return items;
}

function renderHero() {
  const movie = movies[0];
  hero.style.backgroundImage = `url(${backdropUrl(movie)})`;
  hero.innerHTML = `
    <div class="hero-content">
      <h1>${movie.title}</h1>
      <p class="hero-meta">${movie.year} | ${movie.genre} | Rating ${movie.rating}</p>
      <p class="hero-desc">${movie.desc}</p>
      <button class="btn btn-red" id="hero-play">Play</button>
      <button class="btn btn-grey" id="hero-info" data-id="${movie.id}">More Info</button>
    </div>`;
}

function render() {
  const items = getVisible();
  hero.hidden = view !== "home" || query !== "";

  if (items.length === 0) {
    content.innerHTML = emptyHTML();
    return;
  }

  if (view === "home" && !query) {
    content.innerHTML = rows
      .map((row) => ({ title: row.title, list: items.filter(row.test) }))
      .filter((row) => row.list.length > 0)
      .map((row) => rowHTML(row.title, row.list))
      .join("");
  } else {
    content.innerHTML = `
      <h2 class="section-title">${gridTitle()}</h2>
      <div class="grid">${items.map(cardHTML).join("")}</div>`;
  }
}

function updateModalButton() {
  modalList.textContent = inList(openId) ? "Remove from My List" : "Add to My List";
}

function openModal(id) {
  const movie = movies.find((m) => m.id === id);
  if (!movie) return;
  openId = id;
  modalImg.src = posterUrl(movie);
  modalImg.alt = movie.title + " poster";
  modalTitle.textContent = movie.title;
  modalMeta.textContent = `${movie.year} | ${movie.genre} | Rating ${movie.rating}`;
  modalDesc.textContent = movie.desc;
  updateModalButton();
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  modalClose.focus();
}

function closeModal() {
  modal.hidden = true;
  openId = null;
  document.body.style.overflow = "";
}

function setView(newView) {
  view = newView;
  query = "";
  searchInput.value = "";
  clearButton.hidden = true;
  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.classList.toggle("active", link.dataset.view === view);
  });
  nav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-view]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    setView(link.dataset.view);
  });
});

menuToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 50);
});

searchForm.addEventListener("submit", (event) => event.preventDefault());

searchInput.addEventListener("input", () => {
  query = searchInput.value.trim().toLowerCase();
  clearButton.hidden = searchInput.value === "";
  render();
});

clearButton.addEventListener("click", () => {
  searchInput.value = "";
  query = "";
  clearButton.hidden = true;
  render();
  searchInput.focus();
});

content.addEventListener("click", (event) => {
  const listButton = event.target.closest(".card-list");
  if (listButton) {
    toggleList(Number(listButton.dataset.id));
    return;
  }
  const card = event.target.closest(".card");
  if (card) {
    openModal(Number(card.dataset.id));
  }
});

content.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target.classList.contains("card")) {
    openModal(Number(event.target.dataset.id));
  }
});

hero.addEventListener("click", (event) => {
  if (event.target.id === "hero-info") {
    openModal(Number(event.target.dataset.id));
  }
  if (event.target.id === "hero-play") {
    alert("Playback is not part of this demo.");
  }
});

modalList.addEventListener("click", () => toggleList(openId));
modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.hidden) closeModal();
});

async function startApp() {
  await getMovies();

  renderHero();
  render();
}

startApp();
