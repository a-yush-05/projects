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
  return "https://placehold.co/300x450/1c1c22/e11d2e?text=" + encodeURIComponent(movie.title);
}

function backdropUrl(movie) {
  return "https://placehold.co/1600x800/16161c/e11d2e?text=" + encodeURIComponent(movie.title);
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
  const movie = movies.find((m) => m.featured);
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

renderHero();
render();
const movies = [
  { id: 1, title: "Crimson Horizon", year: 2025, genre: "Sci-Fi", rating: 8.4, type: "movie", tags: ["trending", "popular"], featured: true,
    desc: "A deep-space salvage crew finds a signal that should not exist, and a ship that is already waiting for them." },
  { id: 2, title: "Iron Harbor", year: 2024, genre: "Action", rating: 7.6, type: "movie", tags: ["trending"],
    desc: "A retired dock foreman is pulled back in when a smuggling ring takes over his old port." },
  { id: 3, title: "Quiet Orbit", year: 2023, genre: "Sci-Fi", rating: 8.1, type: "movie", tags: ["popular", "recommended"],
    desc: "One astronaut, one failing station, and a radio that keeps picking up her own voice from the future." },
  { id: 4, title: "Laugh Track", year: 2024, genre: "Comedy", rating: 7.2, type: "movie", tags: ["trending"],
    desc: "A washed-up sitcom actor discovers that real life has no studio audience to tell him when to laugh." },
  { id: 5, title: "Neon Alley", year: 2022, genre: "Action", rating: 7.8, type: "movie", tags: ["popular"],
    desc: "A courier has one night to cross a rain-soaked city with a package everyone wants." },
  { id: 6, title: "The Last Violin", year: 2021, genre: "Drama", rating: 8.6, type: "movie", tags: ["recommended"],
    desc: "An aging concert violinist teaches one final student and confronts the career she walked away from." },
  { id: 7, title: "Paper Moons", year: 2023, genre: "Drama", rating: 8.0, type: "show", tags: ["popular"],
    desc: "Three siblings reunite to sell the family theater and uncover what held them together." },
  { id: 8, title: "Dead Signal", year: 2025, genre: "Sci-Fi", rating: 7.9, type: "show", tags: ["trending", "recommended"],
    desc: "When the world's satellites go silent, a small town becomes the only place that can still receive a message." },
  { id: 9, title: "Brunch Club", year: 2024, genre: "Comedy", rating: 7.0, type: "show", tags: ["recommended"],
    desc: "Four friends, one table, and a weekly tradition that keeps accidentally changing their lives." },
  { id: 10, title: "Steel Tide", year: 2023, genre: "Action", rating: 7.5, type: "show", tags: ["popular"],
    desc: "A coast guard rescue team faces storms, smugglers, and each other across one brutal season." },
  { id: 11, title: "Two Left Feet", year: 2022, genre: "Comedy", rating: 7.4, type: "movie", tags: ["popular"],
    desc: "A clumsy accountant enters a ballroom contest to impress a coworker and ends up the star of the show." },
  { id: 12, title: "Ashes of Summer", year: 2024, genre: "Drama", rating: 8.3, type: "movie", tags: ["trending", "recommended"],
    desc: "After a wildfire, a small town decides whether to rebuild or leave everything behind." }
];