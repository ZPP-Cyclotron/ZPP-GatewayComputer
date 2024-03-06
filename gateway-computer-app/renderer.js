/****************************
 * Obsługa cyfr zegarowych. *
 ****************************/

// https://stackoverflow.com/questions/63508259/html-svg-reuse-a-group-g-with-use-and-change-attributes-of-inner-elements-in

class Cyferka extends HTMLElement {
  static observedAttributes = ["wartosc"];

  constructor() {
    super();
  }

  // Zwraca kolor atrybutu fill w zależności od kierunku k i this.wartosc.
  #f(k) {
    if (this.wartosc[0] == " ") {
      if (k != "k") {
        return this.kolor_off;
      }
    } else if (this.wartosc[0] == "0") {
      const zero = ["bse", "bes", "bnw", "bwn", "bws", "bsw", "bne", "ben"];
      if (zero.includes(k)) {
        return this.kolor_on;
      }
    } else if (this.wartosc[0] == "1") {
      const jeden = ["bes", "ben"];
      if (jeden.includes(k)) {
        return this.kolor_on;
      }
    } else if (this.wartosc[0] == "2") {
      const dwa = ["bse", "bnw", "bws", "bsw", "bne", "ben", "w3", "w9"];
      if (dwa.includes(k)) {
        return this.kolor_on;
      }
    } else if (this.wartosc[0] == "3") {
      const trzy = ["bse", "bes", "bnw", "bsw", "bne", "ben", "w3", "w9"];
      if (trzy.includes(k)) {
        return this.kolor_on;
      }
    } else if (this.wartosc[0] == "4") {
      const cztery = ["bes", "bwn", "ben", "w3", "w9"];
      if (cztery.includes(k)) {
        return this.kolor_on;
      }
    } else if (this.wartosc[0] == "5") {
      const piec = ["bse", "bes", "bnw", "bwn", "bsw", "bne", "w3", "w9"];
      if (piec.includes(k)) {
        return this.kolor_on;
      }
    } else if (this.wartosc[0] == "6") {
      const szesc = ["bse", "bes", "bwn", "bws", "bsw", "w3", "w9"];
      if (szesc.includes(k)) {
        return this.kolor_on;
      }
    } else if (this.wartosc[0] == "7") {
      const siedem = ["bes", "ben", "bne", "bnw"];
      if (siedem.includes(k)) {
        return this.kolor_on;
      }
    } else if (this.wartosc[0] == "8") {
      const osiem = [
        "bse",
        "bes",
        "bnw",
        "bwn",
        "bws",
        "bsw",
        "bne",
        "ben",
        "w3",
        "w9",
      ];
      if (osiem.includes(k)) {
        return this.kolor_on;
      }
    } else if (this.wartosc[0] == "9") {
      const dziewiec = ["bes", "bnw", "bwn", "bne", "ben", "w3", "w9"];
      if (dziewiec.includes(k)) {
        return this.kolor_on;
      }
    } else if (this.wartosc[0] == "A") {
      const a = ["bes", "bnw", "bwn", "bws", "bne", "ben", "w3", "w9"];
      if (a.includes(k)) {
        return this.kolor_on;
      }
    } else if (this.wartosc[0] == "V") {
      const v = ["bws", "bwn", "w8", "w2"];
      if (v.includes(k)) {
        return this.kolor_on;
      }
    } else if (this.wartosc[0] == "M") {
      const m = ["bws", "bwn", "bes", "ben", "w2", "w10"];
      if (m.includes(k)) {
        return this.kolor_on;
      }
    }

    // Kropka.
    if (this.wartosc.length > 1 && this.wartosc[1] == "." && k == "k") {
      return this.kolor_on;
    }

    return this.kolor_off;
  }

  #zaktualizujWartosc() {
    this.innerHTML = `
      <svg id="wyswietlacz-svg${this.id
      }" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1052 1361.9982">
      <g
        id="wyswietlacz"
        transform="translate(665,172.63912)">
        <g
            id="cyfra">
            <rect
                id="r"
                height="1362"
                width="1052"
                y="-172.64"
                x="-665"
                style="display:inline;fill:${this.kolor_tla};fill-opacity:0.9"/>
            <path
                d="m 490,1200 -52.5,40 35,42.5 H 690 l 32.5,-30 L 675,1200 Z"
                transform="translate(-665,-172.64)"
                id="bse"
                style="fill:${this.#f("bse")};fill-opacity:1"/>
            <path
                d="m 180,1200 -67.5,60 22.5,22.5 h 217.5 l 50,-47.5 -30,-35 z"
                transform="translate(-665,-172.64)"
                id="bsw"
                style="fill:${this.#f("bsw")};fill-opacity:1"/>
            <path
                d="m 220,692.5 -55,47.5 -90,475 27.5,25 70,-60 82.5,-445 z"
                transform="translate(-665,-172.64)"
                id="bws"
                style="fill:${this.#f("bws")};fill-opacity:1"/>
            <path
                d="m 822.5,690 -55,50 -75,445 47.5,52.5 37.5,-30 L 860,730 Z"
                transform="translate(-665,-172.64)"
                id="bes"
                style="fill:${this.#f("bes")};fill-opacity:1"/>
            <path
                d="m 615,637.5 -75,40 52.5,42.5 h 165 l 52.5,-47.5 -32.5,-35 z"
                transform="translate(-665,-172.64)"
                id="w3"
                style="fill:${this.#f("w3")};fill-opacity:1"/>
            <path
                d="M 285,637.5 237.5,680 270,720 H 427.5 L 505,675 457.5,637.5 Z"
                transform="translate(-665,-172.64)"
                id="w9"
                style="fill:${this.#f("w9")};fill-opacity:1"/>
            <path
                d="m 945,117.5 -65,60 -85,445 35,40 52.5,-47.5 90,-465 z"
                transform="translate(-665,-172.64)"
                id="ben"
                style="fill:${this.#f("ben")};fill-opacity:1"/>
            <path
                d="m 305,115 -32.5,32.5 -85,475 37.5,40 52.5,-45 80,-445 z"
                transform="translate(-665,-172.64)"
                id="bwn"
                style="fill:${this.#f("bwn")};fill-opacity:1"/>
            <path
                d="m 700,75 -55,45 40,40 h 180 l 70,-60 -25,-25 z"
                transform="translate(-665,-172.64)"
                id="bne"
                style="fill:${this.#f("bne")};fill-opacity:1"/>
            <path
                d="m 360,75 -35,30 50,55 h 190 l 50,-45 -35,-40 z"
                transform="translate(-665,-172.64)"
                id="bnw"
                style="fill:${this.#f("bnw")};fill-opacity:1"/>
            <path
                d="m 927,1187 a 50,50 0 0 0 -50,50 50,50 0 0 0 50,50 50,50 0 0 0 50,-50 50,50 0 0 0 -50,-50 z"
                transform="translate(-665,-172.64)"
                id="k"
                style="fill:${this.#f("k")};fill-opacity:1"/>
            <path
                d="M 520,699.79 440,870 l -55,310 37.5,42.5 57.5,-45 54.43,-329.07 z"
                transform="translate(-665,-172.64)"
                id="w6"
                style="fill:${this.#f("w6")};fill-opacity:1"/>
            <path
                d="m 530,682.5 17.5,187.5 85,237.5 52.5,67.5 20,-125 -117.5,-320 z"
                transform="translate(-665,-172.64)"
                id="w4"
                style="fill:${this.#f("w4")};fill-opacity:1"/>
            <path
                d="M 516.71,681.57 422.99,735.14 210,1035 l -20,130 85,-75 140,-200 z"
                transform="translate(-665,-172.64)"
                id="w8"
                style="fill:${this.#f("w8")};fill-opacity:1"/>
            <path
                d="M 865,185 775,260 640.58,445.7 530,670 625,615 840,315 Z"
                transform="translate(-665,-172.64)"
                id="w2"
                style="fill:${this.#f("w2")};fill-opacity:1"/>
            <path
                d="M 365,185 345,310 455,620 515,670 500,490 420,245 Z"
                transform="translate(-665,-172.64)"
                id="w10"
                style="fill:${this.#f("w10")};fill-opacity:1"/>
            <path
                d="m 625,130 -55,50 -60,305 15,170 80,-165 60,-320 z"
                transform="translate(-665,-172.64)"
                id="w2"
                style="fill:${this.#f("w12")};fill-opacity:1"/>
        </g>
    </g>
    </svg>`;
  }

  connectedCallback() {
    this.kolor_tla = window.getComputedStyle(this).backgroundColor;
    this.kolor_off = window.getComputedStyle(this).outlineColor;
    this.kolor_on = window.getComputedStyle(this).color;
    this.id = this.getAttribute("id");
    this.wartosc = this.getAttribute("wartosc");
    this.#zaktualizujWartosc();
  }

  attributeChangedCallback(nazwa, stare, nowe) {
    if (nazwa == "wartosc") {
      this.wartosc = nowe;
      this.#zaktualizujWartosc();
    }
  }
}

if (!customElements.get("moja-cyfra")) {
  customElements.define("moja-cyfra", Cyferka);
}

/****************************
 *      Obsługa mapki.      *
 ****************************/
class Mapka extends HTMLElement {
  static observedAttributes = ["konfiguracja"];

  constructor() {
    super();
  }

  #kolka() {
    var tresc = "";

    for (let i = 0; i < Object.keys(this.konfiguracja.suppliers).length; i++) {
      var panel = document.getElementById("panel" + (i + 1));
      var kolor = getComputedStyle(
        panel.getElementsByTagName("moja-cyfra")[0]
      ).color;

      tresc += `
      <circle
       style="fill:${kolor};fill-opacity:0.8;stroke:${kolor};stroke-width:0;stroke-dasharray:none;stroke-opacity:0.533333"
       id="path1-7"
       cx="${this.konfiguracja.suppliers[i].x}"
       cy="${this.konfiguracja.suppliers[i].y}"
       r="30.975769"
       transform="rotate(-145)" />`;
    }

    return tresc;
  }

  #zaktualizujKolka() {
    this.innerHTML = `
    <svg
      version="1.1"
      id="svg1"
      width="1641.7025"
      height="1092.3036"
      viewBox="0 0 1641.7025 1092.3036"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:svg="http://www.w3.org/2000/svg">
      <defs
        id="defs1" />
      <g
        id="layer1"
        transform="rotate(145,1269.5516,1056.9368)">
        <path
          style="display:inline;fill:#000000;fill-opacity:0;stroke:#778899;stroke-width:24.5;stroke-dasharray:none;stroke-opacity:1"
          d="M 1819.8264,2034.7208 971.86474,1765.6188 588.5396,1519.7486"
          id="path6" />
        <path
          style="display:inline;fill:#000000;fill-opacity:0;stroke:#778899;stroke-width:24.5;stroke-dasharray:none;stroke-opacity:1"
          d="m 983.48065,826.66583 576.92365,1128.67957 -170.3667,92.9273 -94.8633,284.5899"
          id="path7" />
        <path
          style="fill:#000000;fill-opacity:0;stroke:#778899;stroke-width:24.5;stroke-dasharray:none;stroke-opacity:1"
          d="M 1560.4043,1951.4734 989.28861,2081.1845"
          id="path9" />
        <path
          style="fill:#000000;fill-opacity:0;stroke:#778899;stroke-width:24.5;stroke-dasharray:none;stroke-opacity:1"
          d="M 685.8432,1927.4795 1245.7431,1853.5563 922.67129,1555.81"
          id="path10" />
        <path
          style="fill:#696969;fill-opacity:1;stroke:#ffffff;stroke-width:8;stroke-dasharray:none;stroke-opacity:1"
          d="m 1767.3125,1980.8685 -59.5492,-50.6511 70.5008,-80.0835 59.5493,50.6511 2.0534,25.3255 -23.9566,30.1169 z"
          id="path11" />
        <path
          style="fill:#696969;fill-opacity:1;stroke:#ffffff;stroke-width:8;stroke-dasharray:none;stroke-opacity:1"
          d="m 1843.9736,1876.1439 128.6812,1.369 v 65.025 l 15.7429,8.2137 -0.6845,78.0301 -17.7963,23.2721 -1.3689,71.1853 -126.6278,-0.6844 0.6845,-61.6027 -17.7963,-9.5827 -0.6845,-77.3456 18.4808,-20.5342 z"
          id="path12" />
        <path
          style="fill:#696969;fill-opacity:1;stroke:#ffffff;stroke-width:8;stroke-dasharray:none;stroke-opacity:1"
          d="m 1973.3393,2076.6949 26.6945,-29.4324 45.1753,-23.9566 58.1803,48.5977 -67.763,80.0835 -58.8648,-49.2822 z"
          id="path13" />
        <circle
          style="fill:#000000;fill-opacity:0;stroke:#ffffff;stroke-width:8;stroke-dasharray:none;stroke-opacity:1"
          id="path14"
          cx="1908.3142"
          cy="2004.1406"
          r="54.073467" />
        ${this.#kolka()}
      </g>
    </svg>`;
  }

  connectedCallback() {
    this.konfiguracja = JSON.parse(this.getAttribute("konfiguracja"));
    this.#zaktualizujKolka();
  }

  attributeChangedCallback(nazwa, stare, nowe) {
    if (nazwa == "konfiguracja") {
      this.konfiguracja = JSON.parse(nowe);
      this.#zaktualizujKolka();
    }
  }
}

if (!customElements.get("moja-mapka")) {
  customElements.define("moja-mapka", Mapka);
}

/****************************
 * Obsługa pola tekstowego. *
 ****************************/
var PoleNatezenia = (function () {
  function main(div_natezenia, panel_id) {
    var obszar_na_zmiane_i_przyciski = div_natezenia.querySelector(
      ".obszar-na-zmiane-natezenia-i-guziki"
    );
    var obszar_na_natezenie = div_natezenia.querySelector(
      ".obszar-na-natezenie"
    );
    var obszar_zmiany_natezenia = div_natezenia.querySelector(
      ".obszar-na-zmiane-natezenia"
    );
    var obszar_przyciskow = div_natezenia.querySelector(".obszar-na-przyciski");

    var cyfry_natezenia = obszar_na_natezenie.querySelectorAll(".cyfra");
    var cyfry_zmiany = obszar_zmiany_natezenia.querySelectorAll(".cyfra");
    var guziki = obszar_przyciskow.querySelectorAll("input");
    var guzik_aplikacji = guziki[0];
    var guzik_anulowania = guziki[1];

    // Poniższe dotyczy błyskajacej cyfry do zmiany wartości.
    var indeks_cyfry;
    var wartosc_cyfry;

    // interwal_id jest undefined tylko na początku i na końcu.
    // Innymi słowy interwal_id jest defined wtw, gdy wyświetla sie okienko zmiany.
    var interwal_id = undefined;

    function inicjuj_blyskanie() {
      var aktualna_cyfra = cyfry_zmiany[indeks_cyfry];
      if (aktualna_cyfra.getAttribute("wartosc") == " ") {
        aktualna_cyfra.setAttribute("wartosc", wartosc_cyfry);
      } else {
        aktualna_cyfra.setAttribute("wartosc", " ");
      }
    }

    function jest_cyfra(c) {
      return c >= "0" && c <= "9";
    }

    function obsluz_klawisz(ev) {
      ev = ev || window.event;
      var kod = ev.keyCode;

      if (kod) {
        var znak = String.fromCharCode(kod);

        if (jest_cyfra(znak)) {
          if (indeks_cyfry == 2) {
            znak = znak + ".";
          }

          if (indeks_cyfry + 1 == cyfry_zmiany.length - 1) {
            cyfry_zmiany[indeks_cyfry].setAttribute("wartosc", znak);
            wartosc_cyfry = znak;
          } else {
            clearInterval(interwal_id);
            cyfry_zmiany[indeks_cyfry].setAttribute("wartosc", znak);
            indeks_cyfry++;
            wartosc_cyfry = cyfry_zmiany[indeks_cyfry].getAttribute("wartosc");
            interwal_id = setInterval(inicjuj_blyskanie, 500);
          }
        } else if (kod == "37") {
          // Lewa strzałka
          if (indeks_cyfry > 0) {
            clearInterval(interwal_id);
            cyfry_zmiany[indeks_cyfry].setAttribute("wartosc", wartosc_cyfry);
            indeks_cyfry--;
            wartosc_cyfry = cyfry_zmiany[indeks_cyfry].getAttribute("wartosc");
            interwal_id = setInterval(inicjuj_blyskanie, 500);
          }
        } else if (kod == "39") {
          // Prawa strzałka
          if (indeks_cyfry < cyfry_zmiany.length - 2) {
            clearInterval(interwal_id);
            cyfry_zmiany[indeks_cyfry].setAttribute("wartosc", wartosc_cyfry);
            indeks_cyfry++;
            wartosc_cyfry = cyfry_zmiany[indeks_cyfry].getAttribute("wartosc");
            interwal_id = setInterval(inicjuj_blyskanie, 500);
          }
        }
      }
    }

    function inicjuj_zmiany(ev) {
      if (typeof interwal_id === "undefined") {
        obszar_na_zmiane_i_przyciski.style.visibility = "visible";

        for (let i = 0; i < cyfry_zmiany.length; i++) {
          var przepisanie = cyfry_natezenia[i].getAttribute("wartosc");

          if (i != cyfry_zmiany.length - 1 && !jest_cyfra(przepisanie)) {
            przepisanie = "0";

            if (i == 2) {
              przepisanie += ".";
            }
          }

          cyfry_zmiany[i].setAttribute("wartosc", przepisanie);
        }

        indeks_cyfry = 0;
        wartosc_cyfry = cyfry_zmiany[indeks_cyfry].getAttribute("wartosc");
        interwal_id = setInterval(inicjuj_blyskanie, 500);
        window.addEventListener("keydown", obsluz_klawisz);
      }
    }

    function koncz_zmiany() {
      clearInterval(interwal_id);
      interwal_id = undefined;
      window.removeEventListener("keydown", obsluz_klawisz);
      obszar_na_zmiane_i_przyciski.style.visibility = "hidden";
    }

    function ustaw_wartosc() {
      var wiodace_zera = true;

      for (let i = 0; i < cyfry_zmiany.length - 1; i++) {
        var cyfra_teraz = cyfry_zmiany[i].getAttribute("wartosc");

        if (i == indeks_cyfry) {
          cyfra_teraz = wartosc_cyfry;
        }

        if (wiodace_zera == true && cyfra_teraz == 0 && i < 2) {
          cyfra_teraz = " ";
        } else {
          wiodace_zera = false;
        }

        if (i == 2) {
          cyfra_teraz = cyfra_teraz + ".";
        }

        cyfry_natezenia[i].setAttribute("wartosc", cyfra_teraz);
      }
    }

    guzik_aplikacji.addEventListener("click", async function (ev) {
      var wartosc_wyswietlacza = 0;

      for (let i = 0; i < cyfry_zmiany.length - 1; i++) {
        var cyfra_teraz = cyfry_zmiany[i].getAttribute("wartosc");

        if (i == indeks_cyfry) {
          cyfra_teraz = wartosc_cyfry;
        }

        wartosc_wyswietlacza =
          wartosc_wyswietlacza * 10 + parseInt(cyfra_teraz[0], 10);
      }

      wartosc_wyswietlacza = wartosc_wyswietlacza / 10.0;

      var odpowiedz = await window.electronAPI.set_current(
        wartosc_wyswietlacza,
        panel_id
      );

      if (odpowiedz !== "OK") {
        alert(odpowiedz);
        return;
      }

      ustaw_wartosc();
      koncz_zmiany();
    });

    guzik_anulowania.addEventListener("click", function (ev) {
      koncz_zmiany();
    });

    function ustaw_wartosc() {
      var wiodace_zera = true;

      for (let i = 0; i < cyfry_zmiany.length - 1; i++) {
        var cyfra_teraz = cyfry_zmiany[i].getAttribute("wartosc");

        if (i == indeks_cyfry) {
          cyfra_teraz = wartosc_cyfry;
        }

        if (wiodace_zera == true && cyfra_teraz == 0 && i < 2) {
          cyfra_teraz = " ";
        } else {
          wiodace_zera = false;
        }

        if (i == 2) {
          cyfra_teraz = cyfra_teraz + ".";
        }

        cyfry_natezenia[i].setAttribute("wartosc", cyfra_teraz);
      }
    }

    window.electronAPI.get_current((i, nowe_cyfry) => {
      if (panel_id == i) {
        console.log(nowe_cyfry);
      }
    });

    obszar_na_natezenie.addEventListener("click", inicjuj_zmiany);
  }

  return function (div_natezenia, panel_id) {
    main(div_natezenia, panel_id);
  };
})();

function dopiszCyfry(obiekt, wartosci) {
  wartosci.forEach((wartosc) => {
    var cyfra = document.createElement("moja-cyfra");
    cyfra.classList.add("cyfra");
    cyfra.setAttribute("wartosc", wartosc);
    obiekt.appendChild(cyfra);
  });
}

window.addEventListener("load", async () => {
  const konfiguracja = await window.electronAPI.otworzPlikKonfiguracyjny();

  if (typeof konfiguracja === "string") {
    alert(konfiguracja);
    return;
  }

  var obszarPaneli = document.getElementsByClassName("obszar-paneli")[0];

  for (let i = 0; i < Object.keys(konfiguracja.suppliers).length; i++) {
    var panel = document.createElement("div");
    panel.classList.add("panel");
    panel.setAttribute("id", "panel" + (i + 1));

    // NAZWA

    var obszarNazwa = document.createElement("div");
    obszarNazwa.classList.add("obszar-na-naglowek-i-cos");

    var obszarNazwaObszarNaNaglowek = document.createElement("div");
    obszarNazwaObszarNaNaglowek.classList.add("obszar-na-naglowek");

    var obszarNazwaNaglowek = document.createElement("p");
    obszarNazwaNaglowek.classList.add("naglowek");
    obszarNazwaNaglowek.innerText = "NAME";

    obszarNazwaObszarNaNaglowek.appendChild(obszarNazwaNaglowek);

    var obszarNaNazwe = document.createElement("div");
    obszarNaNazwe.classList.add("obszar-na-nazwe-magnesu");

    dopiszCyfry(obszarNaNazwe, ["M", konfiguracja.suppliers[i].no]);

    obszarNazwa.appendChild(obszarNazwaObszarNaNaglowek);
    obszarNazwa.appendChild(obszarNaNazwe);

    panel.appendChild(obszarNazwa);

    // ON/OFF

    var obszarOnOff = document.createElement("div");
    obszarOnOff.classList.add("obszar-na-naglowek-i-cos");

    var obszarOnOffObszarNaNaglowek = document.createElement("div");
    obszarOnOffObszarNaNaglowek.classList.add("obszar-na-naglowek");

    var obszarOnOffNaglowek = document.createElement("p");
    obszarOnOffNaglowek.classList.add("naglowek");
    obszarOnOffNaglowek.innerText = "ON/OFF";

    obszarOnOffObszarNaNaglowek.appendChild(obszarOnOffNaglowek);

    var obszarNaGuzikOnOff = document.createElement("div");
    obszarNaGuzikOnOff.classList.add("obszar-na-guzik-on-off");

    var switchSwitchRound = document.createElement("label");
    switchSwitchRound.classList.add("switch");
    switchSwitchRound.classList.add("switch--round");

    var switchInput = document.createElement("input");
    switchInput.classList.add("switch__input");
    switchInput.setAttribute("type", "checkbox");
    switchInput.setAttribute("role", "switch");
    switchInput.setAttribute("name", "round");

    switchInput.addEventListener("change", async function () {
      if (this.checked) {
        var odpowiedz = await window.electronAPI.turn_on(i);
        console.log(odpowiedz);
      } else {
        var odpowiedz = await window.electronAPI.turn_off(i);
        console.log(odpowiedz);
      }
    });
    window.electronAPI.get_on_off((panel_id, state) => {
      if (panel_id == i) {
        switchInput.checked = state;
      }
    });

    var switchBorder = document.createElement("span");
    switchBorder.classList.add("switch__border");

    var switchInside = document.createElement("span");
    switchInside.classList.add("switch__inside");

    var switchFlapa = document.createElement("span");
    switchFlapa.classList.add("switch__flap-a");

    var switchLabel = document.createElement("span");
    switchLabel.classList.add("switch__label");
    switchLabel.innerText = "Round";

    switchSwitchRound.appendChild(switchInput);
    switchSwitchRound.appendChild(switchBorder);
    switchSwitchRound.appendChild(switchInside);
    switchSwitchRound.appendChild(switchFlapa);
    switchSwitchRound.appendChild(switchLabel);

    obszarNaGuzikOnOff.appendChild(switchSwitchRound);

    obszarOnOff.appendChild(obszarOnOffObszarNaNaglowek);
    obszarOnOff.appendChild(obszarNaGuzikOnOff);

    panel.appendChild(obszarOnOff);

    // POLARYZACJA

    var obszarPolaryzacja = document.createElement("div");
    obszarPolaryzacja.classList.add("obszar-na-naglowek-i-cos");

    var obszarPolaryzacjaObszarNaNaglowek = document.createElement("div");
    obszarPolaryzacjaObszarNaNaglowek.classList.add("obszar-na-naglowek");

    var obszarPolaryzacjaNaglowek = document.createElement("p");
    obszarPolaryzacjaNaglowek.classList.add("naglowek");
    obszarPolaryzacjaNaglowek.innerText = "POLARITY";

    obszarPolaryzacjaObszarNaNaglowek.appendChild(obszarPolaryzacjaNaglowek);

    obszarPolaryzacja.appendChild(obszarPolaryzacjaObszarNaNaglowek);

    var obszarNaPolaryzacje = document.createElement("div");
    obszarNaPolaryzacje.classList.add("obszar-na-polaryzacje");

    if (konfiguracja.suppliers[i].polarity == "mutable") {
      var toggle = document.createElement("div");
      toggle.classList.add("toggle");

      var toggleInput = document.createElement("input");
      toggleInput.classList.add("toggle-input");
      toggleInput.setAttribute("type", "checkbox");

      toggleInput.addEventListener("change", async function () {
        if (this.checked) {
          var odpowiedz = await window.electronAPI.set_polarity(i, true);
          console.log(odpowiedz);
        } else {
          var odpowiedz = await window.electronAPI.set_polarity(i, false);
          console.log(odpowiedz);
        }
      });
      window.electronAPI.get_polarity((panel_id, state) => {
        if (panel_id == i) {
          toggleInput.checked = state;
        }
      });

      var toggleHandleWrapper = document.createElement("div");
      toggleHandleWrapper.classList.add("toggle-handle-wrapper");

      var toggleHandle = document.createElement("div");
      toggleHandle.classList.add("toggle-handle");

      var toggleHandleKnob = document.createElement("div");
      toggleHandleKnob.classList.add("toggle-handle-knob");

      var toggleHandleBarWrapper = document.createElement("div");
      toggleHandleBarWrapper.classList.add("toggle-handle-bar-wrapper");

      var toggleHandleBar = document.createElement("div");
      toggleHandleBar.classList.add("toggle-handle-bar");

      toggleHandleBarWrapper.appendChild(toggleHandleBar);

      toggleHandle.appendChild(toggleHandleKnob);
      toggleHandle.appendChild(toggleHandleBarWrapper);

      toggleHandleWrapper.appendChild(toggleHandle);

      var toggleBase = document.createElement("div");
      toggleBase.classList.add("toggle-base");

      var toggleBaseInside = document.createElement("div");
      toggleBaseInside.classList.add("toggle-base-inside");

      toggleBase.appendChild(toggleBaseInside);

      toggle.appendChild(toggleInput);
      toggle.appendChild(toggleHandleWrapper);
      toggle.appendChild(toggleBase);

      obszarNaPolaryzacje.appendChild(toggle);
    }

    obszarPolaryzacja.appendChild(obszarNaPolaryzacje);

    panel.appendChild(obszarPolaryzacja);

    // NAPIĘCIE

    var obszarNapiecie = document.createElement("div");
    obszarNapiecie.classList.add("obszar-na-naglowek-i-cos");

    var obszarNapiecieObszarNaNaglowek = document.createElement("div");
    obszarNapiecieObszarNaNaglowek.classList.add("obszar-na-naglowek");

    var obszarNapiecieNaglowek = document.createElement("p");
    obszarNapiecieNaglowek.classList.add("naglowek");
    obszarNapiecieNaglowek.innerText = "VOLTAGE";

    obszarNapiecieObszarNaNaglowek.appendChild(obszarNapiecieNaglowek);

    var obszarNaNapiecie = document.createElement("div");
    obszarNaNapiecie.classList.add("obszar-na-napiecie");

    dopiszCyfry(obszarNaNapiecie, [" ", " ", " .", " ", "V"]);

    obszarNapiecie.appendChild(obszarNapiecieObszarNaNaglowek);
    obszarNapiecie.appendChild(obszarNaNapiecie);

    panel.appendChild(obszarNapiecie);
    /*
        window.electronAPI.get_voltage((panel_id, value) => {
          if (panel_id == i) {
            console.log("new voltage is " + value);
          }
        });
    */
    // NATĘŻENIE

    var obszarNatezenie = document.createElement("div");
    obszarNatezenie.classList.add("obszar-na-naglowek-i-cos");
    obszarNatezenie.setAttribute("id", "natezenie" + (i + 1));

    var obszarNatezenieObszarNaNaglowek = document.createElement("div");
    obszarNatezenieObszarNaNaglowek.classList.add("obszar-na-naglowek");

    var obszarNatezenieNaglowek = document.createElement("p");
    obszarNatezenieNaglowek.classList.add("naglowek");
    obszarNatezenieNaglowek.innerText = "CURRENT";

    obszarNatezenieObszarNaNaglowek.appendChild(obszarNatezenieNaglowek);

    var obszarNaNatezenie = document.createElement("div");
    obszarNaNatezenie.classList.add("obszar-na-natezenie");

    dopiszCyfry(obszarNaNatezenie, [" ", " ", " .", " ", "A"]);

    var obszarNaZmianeNatezeniaIGuziki = document.createElement("div");
    obszarNaZmianeNatezeniaIGuziki.classList.add(
      "obszar-na-zmiane-natezenia-i-guziki"
    );

    var obszarNaZmianeNatezenia = document.createElement("div");
    obszarNaZmianeNatezenia.classList.add("obszar-na-zmiane-natezenia");

    dopiszCyfry(obszarNaZmianeNatezenia, [" ", " ", " ", " ", " "]);

    var obszarNaPrzyciski = document.createElement("div");
    obszarNaPrzyciski.classList.add("obszar-na-przyciski");

    var aplaj = document.createElement("input");
    aplaj.setAttribute("type", "button");
    aplaj.setAttribute("value", "Apply");

    var kansel = document.createElement("input");
    kansel.setAttribute("type", "button");
    kansel.setAttribute("value", "Cancel");

    obszarNaPrzyciski.appendChild(aplaj);
    obszarNaPrzyciski.appendChild(kansel);

    obszarNaZmianeNatezeniaIGuziki.appendChild(obszarNaZmianeNatezenia);
    obszarNaZmianeNatezeniaIGuziki.appendChild(obszarNaPrzyciski);

    obszarNatezenie.appendChild(obszarNatezenieObszarNaNaglowek);
    obszarNatezenie.appendChild(obszarNaNatezenie);
    obszarNatezenie.appendChild(obszarNaZmianeNatezeniaIGuziki);

    panel.appendChild(obszarNatezenie);

    // BŁĘDY

    var obszarBledy = document.createElement("div");
    obszarBledy.classList.add("obszar-na-naglowek-i-cos");

    var obszarBledyObszarNaNaglowek = document.createElement("div");
    obszarBledyObszarNaNaglowek.classList.add("obszar-na-naglowek");

    var obszarBledyNaglowek = document.createElement("p");
    obszarBledyNaglowek.classList.add("naglowek");
    obszarBledyNaglowek.innerText = "ERROR CODE";

    obszarBledyObszarNaNaglowek.appendChild(obszarBledyNaglowek);

    obszarBledy.appendChild(obszarBledyObszarNaNaglowek);

    for (let i = 0; i < 2; i++) {
      var obszarNaBledy = document.createElement("div");
      obszarNaBledy.classList.add("obszar-na-bledy");

      dopiszCyfry(obszarNaBledy, [" ", " ", " ", " ", " ", " ", " "]);

      obszarBledy.appendChild(obszarNaBledy);
    }

    panel.appendChild(obszarBledy);
    /*
    window.electronAPI.get_error((panel_id, message) => {
      if (panel_id == i) {
        console.log("error is " + message);
      }
    });
*/
    obszarPaneli.appendChild(panel);

    PoleNatezenia(document.getElementById("natezenie" + (i + 1)), i);
  }

  // MAPKA
  var mapka = document.createElement("moja-mapka");
  mapka.setAttribute("konfiguracja", JSON.stringify(konfiguracja));
  document.getElementsByClassName("obszar-mapy")[0].appendChild(mapka);
});