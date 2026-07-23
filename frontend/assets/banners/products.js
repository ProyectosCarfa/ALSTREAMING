import { DB } from "./db.js";

const banner = document.getElementById("banner");

// Se duplica el arreglo para que el carrusel sea infinito
banner.innerHTML = [...DB.banners, ...DB.banners]
    .map(item => `
        <span class="inicio-module__nl00za__brandLogoChip">
            <img
                alt="${item.alt}"
                src="${item.src}"
                class="inicio-module__nl00za__brandLogoImage ${item.class}">
        </span>
    `)
    .join("");