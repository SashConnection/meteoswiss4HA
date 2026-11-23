// Names and descriptions of the cards in the "Add card" list, in the Home Assistant language.
// They are read when the list opens, so they follow the language of the user's profile.

const N = {
  "meteoswiss-forecast-card": {
    de: ["Prognose", "Aktuelles Wetter, Stunden und Tage mit den Piktogrammen."],
    fr: ["Prévisions", "Météo actuelle, prochaines heures et prochains jours avec les pictogrammes."],
    it: ["Previsioni", "Tempo attuale, prossime ore e prossimi giorni con i pittogrammi."],
    rm: ["Prognosa", "Aura actuala, proximas uras e proxims dis cun ils pictograms."],
    en: ["Forecast", "Current weather, hourly and daily forecast with the pictograms."],
  },
  "meteoswiss-weather-card": {
    de: ["Detailliertes Wetter", "Ort und Höhe, Messwerte nach Wahl, Stundengrafik und 9 Tage."],
    fr: ["Météo détaillée", "Lieu et altitude, mesures au choix, graphique heure par heure et 9 jours."],
    it: ["Meteo dettagliato", "Luogo e altitudine, misure a scelta, grafico orario e 9 giorni."],
    rm: ["Aura detagliada", "Lieu ed autezza, mesiraziuns a chaschun, grafica per ura e 9 dis."],
    en: ["Detailed weather", "Place and altitude, measurements of your choice, hourly chart and 9 days."],
  },
  "meteoswiss-pollen-card": {
    de: ["Pollen", "Pollen nach Art und Station, mit einer Skizze jeder Pflanze."],
    fr: ["Pollen", "Pollen par espèce et par station, avec une esquisse de chaque plante."],
    it: ["Polline", "Polline per specie e stazione, con uno schizzo di ogni pianta."],
    rm: ["Pollen", "Pollen tenor spezia e staziun, cun in skizzi da mintga planta."],
    en: ["Pollen", "Pollen by species and station, with a sketch of each plant."],
  },
  "meteoswiss-map-card": {
    de: ["Schweizer Karte", "Wetter, Radar, Warnungen, Waldbrand, Hochwasser, Trockenheit, Lawinen und Pollen."],
    fr: ["Carte de la Suisse", "Météo, radar, alertes, incendies, crues, sécheresse, avalanches et pollen."],
    it: ["Carta della Svizzera", "Meteo, radar, allerte, incendi, piene, siccità, valanghe e polline."],
    rm: ["Charta da la Svizra", "Aura, radar, avertiments, fieu, auas grondas, sitgira, lavinas e pollen."],
    en: ["Switzerland map", "Weather, radar, warnings, forest fire, floods, drought, avalanches and pollen."],
  },
  "meteoswiss-now-card": {
    de: ["Jetzt", "Grosses Piktogramm, Ort und Temperatur, mit Stundengrafik."],
    fr: ["Maintenant", "Grand pictogramme, lieu et température, avec le graphique des prochaines heures."],
    it: ["Adesso", "Grande pittogramma, luogo e temperatura, con il grafico delle prossime ore."],
    rm: ["Ussa", "Grond pictogram, lieu e temperatura, cun la grafica da las proximas uras."],
    en: ["Now", "Big pictogram, place and temperature, with an hour-by-hour chart."],
  },
  "meteoswiss-days-card": {
    de: ["Tage", "Die Tage über einer durchgehenden Temperaturkurve und dem Regen."],
    fr: ["Jours", "Les jours au-dessus d’une courbe de température continue et de la pluie."],
    it: ["Giorni", "I giorni sopra una curva continua della temperatura e la pioggia."],
    rm: ["Dis", "Ils dis sur ina curva da temperatura cuntinuanta e la plievgia."],
    en: ["Days", "Days above one continuous temperature curve and rain."],
  },
  "meteoswiss-tiles-card": {
    de: ["Kacheln", "Unwetter-Minikarte mit Gefahren und animiertem Radar."],
    fr: ["Tuiles", "Mini-carte des intempéries avec les dangers, et radar animé."],
    it: ["Riquadri", "Mini-carta del maltempo con i pericoli e radar animato."],
    rm: ["Plattinas", "Mini-charta da las intempergias cun ils privels e radar animà."],
    en: ["Tiles", "Severe weather mini map with hazard chips, and an animated radar."],
  },
  "meteoswiss-sky-card": {
    de: ["Himmel live", "Animierter Himmel: Sonne, Mond, Wolken, Regen, Schnee, Nebel."],
    fr: ["Ciel en direct", "Ciel animé : soleil, lune, nuages, pluie, neige, brouillard."],
    it: ["Cielo dal vivo", "Cielo animato: sole, luna, nuvole, pioggia, neve, nebbia."],
    rm: ["Tschiel en direct", "Tschiel animà: sulegl, glina, nivels, plievgia, naiv, tschajera."],
    en: ["Live sky", "Animated sky: sun, moon, clouds, rain, snow, fog."],
  },
  "meteoswiss-outing-card": {
    de: ["Rausgehen?", "Soll ich rausgehen? Urteil, Regen, Kleidung, Wind, Warnungen, Pollen."],
    fr: ["Faut-il sortir ?", "Verdict, heure de la pluie, quoi mettre, vent, alertes, pollen."],
    it: ["Uscire?", "Verdetto, ora della pioggia, cosa mettersi, vento, allerte, polline."],
    rm: ["Ir ora?", "Verdict, ura da la plievgia, tge trair en, vent, avertiments, pollen."],
    en: ["Go out?", "Should I go out? Verdict, rain timing, clothes, wind, warnings, pollen."],
  },
  "meteoswiss-day-card": {
    de: ["Mein Tag", "Morgen, Nachmittag, Abend und Nacht, mit Sonnenauf- und -untergang."],
    fr: ["Ma journée", "Matin, après-midi, soir et nuit, avec le lever et le coucher du soleil."],
    it: ["La mia giornata", "Mattina, pomeriggio, sera e notte, con alba e tramonto."],
    rm: ["Mes di", "Damaun, suentermezdi, saira e notg, cun la levada e la rendida dal sulegl."],
    en: ["My day", "Morning, afternoon, evening and night, with sunrise and sunset."],
  },
  "meteoswiss-compare-card": {
    de: ["Orte vergleichen", "Zuhause und beobachtete Orte nebeneinander, mit dem besten Ort heute."],
    fr: ["Comparer mes lieux", "Chez vous et vos lieux surveillés côte à côte, avec le meilleur endroit du jour."],
    it: ["Confronta i luoghi", "Casa e i luoghi seguiti fianco a fianco, con il luogo migliore di oggi."],
    rm: ["Cumparegliar lieus", "A chasa ed ils lieus observads ina sper l’autra, cun il meglier lieu oz."],
    en: ["Compare places", "Home and watched places side by side, with the best place today."],
  },
  "meteoswiss-wall-card": {
    de: ["Wandbildschirm", "Grosse Uhr und Wetter für ein Wandtablet, mit dunkelrotem Nachtmodus."],
    fr: ["Écran mural", "Grande horloge et météo pour une tablette murale, avec mode nuit rouge foncé."],
    it: ["Schermo a parete", "Grande orologio e meteo per un tablet a parete, con modalità notte rosso scuro."],
    rm: ["Visur da paraid", "Grond ura ed aura per in tablet da paraid, cun modus da notg cotschen stgir."],
    en: ["Wall screen", "Big clock and weather for a wall tablet, with a dark red night mode."],
  },
  "meteoswiss-mountain-card": {
    de: ["Berge", "Nullgradgrenze, Schneefallgrenze, Temperaturen nach Höhe, Nebelmeer und Lawinen."],
    fr: ["Montagne", "Isotherme 0 °C, limite de la neige, températures par altitude, mer de brouillard et avalanches."],
    it: ["Montagna", "Zero termico, limite delle nevicate, temperature per altitudine, mare di nebbia e valanghe."],
    rm: ["Muntogna", "Cunfin da 0 °C, cunfin da la naiv, temperaturas tenor autezza, mar da tschajera e lavinas."],
    en: ["Mountain", "0 °C level, snow line, temperatures by altitude, sea of fog and avalanches."],
  },
  "meteoswiss-fog-card": {
    de: ["Nebel", "Nebel und Hochnebel nach Region, mit Referenzstationen und 3-Tage-Prognose."],
    fr: ["Brouillard", "Brouillard et stratus par région, avec stations repères et prévision sur 3 jours."],
    it: ["Nebbia", "Nebbia e strato per regione, con stazioni di riferimento e previsione a 3 giorni."],
    rm: ["Tschajera", "Tschajera e stratus tenor regiun, cun staziuns da referenza e prognosa per 3 dis."],
    en: ["Fog", "Fog and low stratus by region, with reference stations and a 3-day forecast."],
  },
  "meteoswiss-lake-card": {
    de: ["See", "Wassertemperatur, Strömungen, Prognose und Tiefenprofil (Eawag)."],
    fr: ["Lac", "Température de l’eau, courants, prévision et profil en profondeur (Eawag)."],
    it: ["Lago", "Temperatura dell’acqua, correnti, previsione e profilo in profondità (Eawag)."],
    rm: ["Lai", "Temperatura da l’aua, currents, prognosa e profil da la profunditad (Eawag)."],
    en: ["Lake", "Water temperature, currents, forecast and depth profile (Eawag)."],
  },
  "meteoswiss-ephemeris-card": {
    de: ["Ephemeriden", "Datum, Namenstag, Sonne, Tageslänge und Mond (Bild, %, Phase, Zeiten)."],
    fr: ["Éphéméride", "Date, saint du jour, soleil, durée du jour et lune (dessin, %, phase, heures)."],
    it: ["Effemeridi", "Data, santo del giorno, sole, durata del giorno e luna (disegno, %, fase, orari)."],
    rm: ["Efemerids", "Data, sontg dal di, sulegl, durada dal di e glina (dissegn, %, fasa, uras)."],
    en: ["Ephemeris", "Date, saint of the day, sun, day length and moon (picture, %, phase, times)."],
  },
  "meteoswiss-tips-card": {
    de: ["Tipps des Tages", "Wäsche, Frost, Giessen, Sterne, Sonnenuntergang, Föhn, Lüften, Solar…"],
    fr: ["Conseils du jour", "Linge, gel, arrosage, étoiles, coucher de soleil, foehn, aérer, solaire…"],
    it: ["Consigli del giorno", "Bucato, gelo, annaffiare, stelle, tramonto, favonio, arieggiare, solare…"],
    rm: ["Cussegls dal di", "Rauba, gelischun, bagnar, stailas, rendida dal sulegl, favugn, ventilar, solar…"],
    en: ["Tips of the day", "Laundry, frost, watering, stars, sunset, foehn, airing, solar…"],
  },
  "meteoswiss-postcard-card": {
    de: ["Postkarte", "Eine Wetter-Postkarte mit dem Wahrzeichen der Stadt und dem Mond, zum Teilen."],
    fr: ["Carte postale", "Une carte postale météo avec le monument de la ville et la lune, à partager."],
    it: ["Cartolina", "Una cartolina meteo con il monumento della città e la luna, da condividere."],
    rm: ["Carta postala", "Ina carta postala da l’aura cun il monument da la citad e la glina, per parter."],
    en: ["Postcard", "A weather postcard with the town's monument and the moon, to share."],
  },
  "meteoswiss-guess-card": {
    de: ["Maximum raten", "Das heutige Maximum raten und am Abend das Resultat sehen."],
    fr: ["Devine le maximum", "Devinez le maximum du jour et voyez le résultat le soir."],
    it: ["Indovina la massima", "Indovina la massima di oggi e vedi il risultato la sera."],
    rm: ["Indovinar il maximum", "Indovinar il maximum dad oz e vesair il resultat la saira."],
    en: ["Guess the maximum", "Guess today's maximum temperature and see the result in the evening."],
  },
  "meteoswiss-rain-card": {
    de: ["Regen Minute für Minute", "Regen bei Ihnen in den nächsten 60 Minuten, vom Radar."],
    fr: ["Pluie minute par minute", "La pluie chez vous dans les 60 prochaines minutes, d’après le radar."],
    it: ["Pioggia minuto per minuto", "La pioggia da te nei prossimi 60 minuti, dal radar."],
    rm: ["Plievgia minuta per minuta", "La plievgia tar vus en las proximas 60 minutas, tenor il radar."],
    en: ["Rain minute by minute", "Rain at home over the next 60 minutes, from the radar."],
  },
  "meteoswiss-stripes-card": {
    de: ["Klimastreifen", "Ein Streifen pro Jahr seit der Eröffnung der Station, gefärbt nach der Mitteltemperatur."],
    fr: ["Bandes du climat", "Une bande par année depuis l’ouverture de la station, colorée selon la température moyenne."],
    it: ["Strisce del clima", "Una striscia per anno dall’apertura della stazione, colorata secondo la temperatura media."],
    rm: ["Strivlas dal clima", "Ina strivla per onn dapi l’avertura da la staziun, colurada tenor la temperatura media."],
    en: ["Climate stripes", "One stripe per year since the station opened, colored by the mean temperature."],
  },
  "meteoswiss-month-card": {
    de: ["Monatsbilanz", "Dieser und letzter Monat: Temperatur, Regen, Sonne, Frost- und Hitzetage gegenüber der Norm."],
    fr: ["Bilan du mois", "Ce mois-ci et le mois passé : température, pluie, soleil, jours de gel et de canicule par rapport à la normale."],
    it: ["Bilancio del mese", "Questo mese e il mese scorso: temperatura, pioggia, sole, giorni di gelo e di canicola rispetto alla norma."],
    rm: ["Bilanza dal mais", "Quest mais e l’ultim mais: temperatura, plievgia, sulegl, dis da gelischun e da chalira cumparegliads cun la norma."],
    en: ["Month summary", "This month and last month: temperature, rain, sunshine, frost and hot days vs the normal."],
  },
  "meteoswiss-rivers-card": {
    de: ["Flüsse", "Wassertemperatur, Abfluss, Pegel und Hochwassergefahr Ihrer Flüsse (BAFU)."],
    fr: ["Rivières", "Température de l’eau, débit, niveau et danger de crue de vos rivières (OFEV)."],
    it: ["Fiumi", "Temperatura dell’acqua, portata, livello e pericolo di piena dei tuoi fiumi (UFAM)."],
    rm: ["Flums", "Temperatura da l’aua, debit, nivel e privel d’auas grondas da voss flums (UFAM)."],
    en: ["Rivers", "Water temperature, discharge, level and flood danger of your rivers (FOEN)."],
  },
  "meteoswiss-air-card": {
    de: ["Luftqualität", "Ozon, NO2, PM10 und PM2.5 gegenüber den Grenzwerten (NABEL)."],
    fr: ["Qualité de l’air", "Ozone, NO2, PM10 et PM2.5 par rapport aux valeurs limites (NABEL)."],
    it: ["Qualità dell’aria", "Ozono, NO2, PM10 e PM2.5 rispetto ai valori limite (NABEL)."],
    rm: ["Qualitad da l’aria", "Ozon, NO2, PM10 e PM2.5 cumparegliads cun las valurs limitas (NABEL)."],
    en: ["Air quality", "Ozone, NO2, PM10 and PM2.5 against the Swiss standards (NABEL)."],
  },
  "meteoswiss-snow-card": {
    de: ["Schnee", "Schneehöhe an den Stationen in Ihrer Nähe."],
    fr: ["Neige", "Hauteur de neige aux stations proches de chez vous."],
    it: ["Neve", "Altezza della neve alle stazioni vicine."],
    rm: ["Naiv", "Autezza da la naiv a las staziuns en vossa vischinanza."],
    en: ["Snow", "Snow depth at the stations near home."],
  },
};

const LANGS = ["de", "fr", "it", "rm", "en"];

function lang() {
  let l;
  try { l = document.querySelector("home-assistant")?.hass?.language; } catch (e) { /* not ready */ }
  if (!l) { try { l = JSON.parse(localStorage.getItem("selectedLanguage") || "null"); } catch (e) { /* no storage */ } }
  l = (l || document.documentElement.lang || navigator.language || "en").slice(0, 2).toLowerCase();
  return LANGS.includes(l) ? l : "en";
}

// Replace name and description of our cards by getters in the current language.
export function translateCardList() {
  for (const card of window.customCards || []) {
    const t = N[card.type];
    if (!t || card._meteoswiss) continue;
    Object.defineProperty(card, "_meteoswiss", { value: true });
    Object.defineProperty(card, "name", { get: () => `MeteoSwiss ${t[lang()][0]}`, enumerable: true, configurable: true });
    Object.defineProperty(card, "description", { get: () => t[lang()][1], enumerable: true, configurable: true });
  }
}
