function scrollToSection() {
  document.getElementById("listings").scrollIntoView({ behavior: "smooth" });
}
const PROPERTIES_API_URL = "https://m7steuvmcj.execute-api.us-west-2.amazonaws.com/properties";
async function loadProperties(event) {
  if (event) event.preventDefault();

  const loadingEl = document.getElementById("properties-loading");
  const errorEl = document.getElementById("properties-error");
  const listEl = document.getElementById("property-list");

  loadingEl.style.display = "block";
  errorEl.style.display = "none";
  listEl.innerHTML = "";

  try {
    const res = await fetch(PROPERTIES_API_URL);
    if (!res.ok) throw new Error("API error");

    const items = await res.json();

    items.forEach(p => {
      const card = document.createElement("div");
      card.className = "property-card";

      card.innerHTML = `
        <img src="${p.image}" alt="${p.title}">
        <div class="property-info">
          <h3>${p.title}</h3>
          <p>£${Number(p.price).toLocaleString()} • ${p.location}</p>
        </div>
      `;

      listEl.appendChild(card);
    });

  } catch (err) {
    errorEl.style.display = "block";
  } finally {
    loadingEl.style.display = "none";
    document.getElementById("properties").scrollIntoView({ behavior: "smooth" });
  }
}


