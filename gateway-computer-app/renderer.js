/****************************
 * Obsługa cyfr zegarowych. *
 ****************************/

// https://stackoverflow.com/questions/63508259/html-svg-reuse-a-group-g-with-use-and-change-attributes-of-inner-elements-in

class Cyferka extends HTMLElement {
  static observedAttributes = ["wartosc"];

  constructor() {
    super();

    this.kolor_tla = window.getComputedStyle(this).backgroundColor;
    this.kolor_off = window.getComputedStyle(this).outlineColor;
    this.kolor_on = window.getComputedStyle(this).color;
    this.wartosc = this.getAttribute("wartosc");

    console.log(this.kolor_tla);
    console.log(this.kolor_off);
    console.log(this.kolor_on);
    console.log(this.wartosc);

  }

  // Zwraca kolor atrybutu fill w zależności od kierunku k i this.wartosc.
  #f(k) {
    if (this.wartosc[0] == " ") {
        if (k != "k") { return this.kolor_off; }
    } else if (this.wartosc[0] == "0") {
        const zero = ["bse", "bes", "bnw", "bwn", "bws", "bsw", "bne", "ben"];
        if (zero.includes(k)) { return this.kolor_on; }
    } else if (this.wartosc[0] == "1") {
        const jeden = ["bes", "ben"];
        if (jeden.includes(k)) { return this.kolor_on; }
    } else if (this.wartosc[0] == "2") {
        const dwa = ["bse", "bnw", "bws", "bsw", "bne", "ben", "w3", "w9"];
        if (dwa.includes(k)) { return this.kolor_on; }
    } else if (this.wartosc[0] == "3") {
        const trzy = ["bse", "bes", "bnw", "bsw", "bne", "ben", "w3", "w9"];
        if (trzy.includes(k)) { return this.kolor_on; }
    } else if (this.wartosc[0] == "4") {
        const cztery = ["bes", "bwn", "ben", "w3", "w9"];
        if (cztery.includes(k)) { return this.kolor_on; }
    } else if (this.wartosc[0] == "5") {
        const piec = ["bse", "bes", "bnw", "bwn", "bsw", "bne", "w3", "w9"];
        if (piec.includes(k)) { return this.kolor_on; }
    } else if (this.wartosc[0] == "6") {
        const szesc = ["bse", "bes", "bwn", "bws", "bsw", "w3", "w9"];
        if (szesc.includes(k)) { return this.kolor_on; }
    } else if (this.wartosc[0] == "7") {
        const siedem = ["bes", "ben", "bne", "bnw"];
        if (siedem.includes(k)) { return this.kolor_on; }
    } else if (this.wartosc[0] == "8") {
        const osiem = ["bse", "bes", "bnw", "bwn", "bws", "bsw", "bne", "ben", "w3", "w9"];
        if (osiem.includes(k)) { return this.kolor_on; }
    } else if (this.wartosc[0] == "9") {
        const dziewiec = ["bes", "bnw", "bwn", "bne", "ben", "w3", "w9"];
        if (dziewiec.includes(k)) { return this.kolor_on; }
    } else if (this.wartosc[0] == "A") {
        const a = ["bes", "bnw", "bwn", "bws", "bne", "ben", "w3", "w9"];
        if (a.includes(k)) { return this.kolor_on; }
    } else if (this.wartosc[0] == "V") {
        const v = ["bws", "bwn", "w8", "w2"];
        if (v.includes(k)) { return this.kolor_on; }
    } else if (this.wartosc[0] == "M") {
        const m = ["bws", "bwn", "bes", "ben", "w2", "w10"];
        if (m.includes(k)) { return this.kolor_on; }
    }

    // Kropka.
    if (this.wartosc.length > 1 && this.wartosc[1] == '.' && k == "k") {
        return this.kolor_on;
    }

    return this.kolor_off;
  }

  #zaktualizujWartosc() {
    this.innerHTML=`
      <svg id="wyswietlacz-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1052 1361.9982">
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
                style="fill:${this.#f('bse')};fill-opacity:1"/>
            <path
                d="m 180,1200 -67.5,60 22.5,22.5 h 217.5 l 50,-47.5 -30,-35 z"
                transform="translate(-665,-172.64)"
                id="bsw"
                style="fill:${this.#f('bsw')};fill-opacity:1"/>
            <path
                d="m 220,692.5 -55,47.5 -90,475 27.5,25 70,-60 82.5,-445 z"
                transform="translate(-665,-172.64)"
                id="bws"
                style="fill:${this.#f('bws')};fill-opacity:1"/>
            <path
                d="m 822.5,690 -55,50 -75,445 47.5,52.5 37.5,-30 L 860,730 Z"
                transform="translate(-665,-172.64)"
                id="bes"
                style="fill:${this.#f('bes')};fill-opacity:1"/>
            <path
                d="m 615,637.5 -75,40 52.5,42.5 h 165 l 52.5,-47.5 -32.5,-35 z"
                transform="translate(-665,-172.64)"
                id="w3"
                style="fill:${this.#f('w3')};fill-opacity:1"/>
            <path
                d="M 285,637.5 237.5,680 270,720 H 427.5 L 505,675 457.5,637.5 Z"
                transform="translate(-665,-172.64)"
                id="w9"
                style="fill:${this.#f('w9')};fill-opacity:1"/>
            <path
                d="m 945,117.5 -65,60 -85,445 35,40 52.5,-47.5 90,-465 z"
                transform="translate(-665,-172.64)"
                id="ben"
                style="fill:${this.#f('ben')};fill-opacity:1"/>
            <path
                d="m 305,115 -32.5,32.5 -85,475 37.5,40 52.5,-45 80,-445 z"
                transform="translate(-665,-172.64)"
                id="bwn"
                style="fill:${this.#f('bwn')};fill-opacity:1"/>
            <path
                d="m 700,75 -55,45 40,40 h 180 l 70,-60 -25,-25 z"
                transform="translate(-665,-172.64)"
                id="bne"
                style="fill:${this.#f('bne')};fill-opacity:1"/>
            <path
                d="m 360,75 -35,30 50,55 h 190 l 50,-45 -35,-40 z"
                transform="translate(-665,-172.64)"
                id="bnw"
                style="fill:${this.#f('bnw')};fill-opacity:1"/>
            <path
                d="m 927,1187 a 50,50 0 0 0 -50,50 50,50 0 0 0 50,50 50,50 0 0 0 50,-50 50,50 0 0 0 -50,-50 z"
                transform="translate(-665,-172.64)"
                id="k"
                style="fill:${this.#f('k')};fill-opacity:1"/>
            <path
                d="M 520,699.79 440,870 l -55,310 37.5,42.5 57.5,-45 54.43,-329.07 z"
                transform="translate(-665,-172.64)"
                id="w6"
                style="fill:${this.#f('w6')};fill-opacity:1"/>
            <path
                d="m 530,682.5 17.5,187.5 85,237.5 52.5,67.5 20,-125 -117.5,-320 z"
                transform="translate(-665,-172.64)"
                id="w4"
                style="fill:${this.#f('w4')};fill-opacity:1"/>
            <path
                d="M 516.71,681.57 422.99,735.14 210,1035 l -20,130 85,-75 140,-200 z"
                transform="translate(-665,-172.64)"
                id="w8"
                style="fill:${this.#f('w8')};fill-opacity:1"/>
            <path
                d="M 865,185 775,260 640.58,445.7 530,670 625,615 840,315 Z"
                transform="translate(-665,-172.64)"
                id="w2"
                style="fill:${this.#f('w2')};fill-opacity:1"/>
            <path
                d="M 365,185 345,310 455,620 515,670 500,490 420,245 Z"
                transform="translate(-665,-172.64)"
                id="w10"
                style="fill:${this.#f('w10')};fill-opacity:1"/>
            <path
                d="m 625,130 -55,50 -60,305 15,170 80,-165 60,-320 z"
                transform="translate(-665,-172.64)"
                id="w2"
                style="fill:${this.#f('w12')};fill-opacity:1"/>
        </g>
    </g>
    </svg>`
  }

  connectedCallback() {
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
 * Obsługa pola tekstowego. *
 ****************************/

function wyznacz_czesc_calkowita(x) {
  return x.split('.')[0] || "";
}

function wyznacz_czesc_ulamkowa(x) {
  return x.split('.')[1] || "";
}

var PoleTekstoweNatezenia = (function() {
  function main(pole_tekstowe, max_natezenie, liczba_cyfr_po_przecinku) {
    function ustaw_natezenie(ev) {
      var el = ev.target;

      var czesc_calkowita = wyznacz_czesc_calkowita(el.value);
      var czesc_ulamkowa = wyznacz_czesc_ulamkowa(el.value);
      var korekta = false;

      // Maksymalna dopuszczalna liczba cyfr po przecinku.
      if (czesc_ulamkowa.length > liczba_cyfr_po_przecinku) {
        czesc_ulamkowa = czesc_ulamkowa.slice(0, liczba_cyfr_po_przecinku);
        korekta = true;
      }

      // Wiodące zera w częsci całkowitej.
      if (czesc_calkowita[0] == '0' && czesc_calkowita.length > 1) {
        czesc_calkowita = czesc_calkowita.replace(/^0+(\d)/gm, '$1$2');
        korekta = true;
      }

      // Maksymalna dopuszczalna liczba cyfr częsci całkowitej bez zer wiodących.
      if (czesc_calkowita.length > 3) {
        czesc_calkowita = czesc_calkowita.slice(0, 3);
        korekta = true;
      }

      // Maksymalna wartość liczby.
      if (czesc_calkowita >= max_natezenie) {
        czesc_calkowita = String(max_natezenie);
        czesc_ulamkowa = "0";
        korekta = true;
      }

      // Liczba nie może być ujemna.
      if (el.value < 0) {
        czesc_calkowita = "0";
        czesc_ulamkowa = "0";
        korekta = true;
      }

      if (korekta) {
        // Trik pozwalający ustawić kursor na koniec po następnej instrukcji.
        el.value = 0;
        el.value = parseFloat(czesc_calkowita + "." + czesc_ulamkowa);
      }

      // Trik pozwalający na wykasowanie zawartości, gdy wartość nie jest liczbą.
      // Dzięki temu naciśnięcie e (empty), - lub + kasuje wartość.
      if (el.value == '') {
        el.value = '';
      }
    }

    pole_tekstowe.addEventListener('input', ustaw_natezenie);
  }

  return function(pole_tekstowe, max_natezenie, liczba_cyfr_po_przecinku) {
    main(pole_tekstowe, max_natezenie, liczba_cyfr_po_przecinku);
  };
}());

var pola_tekstowe_na_wartosci_pradu = document.querySelectorAll('.pole-tekstowe-na-wartosc-pradu');
pola_tekstowe_na_wartosci_pradu.forEach(x => PoleTekstoweNatezenia(x, 200, 1));

document.getElementById("testowy").addEventListener("change", function(ev) {
    console.log("zmiana");
    document.getElementById("tt").setAttribute("wartosc", "7");
    document.getElementById("tt").setAttribute("wartosc", "0.");
});

