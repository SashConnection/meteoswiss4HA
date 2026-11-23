# Mode d'emploi – MeteoSwiss Complete For HA

<img src="images/logo.png" alt="Logo" width="96" align="right">

🇬🇧 **[English version](../README.md)**

**Toute la météo suisse dans Home Assistant, en une seule intégration.**
Données officielles de MétéoSuisse, panneaux et automatisations prêts à l’emploi, rien à programmer — en **allemand, français, italien, romanche et anglais**.

**Prêt à l’emploi — sans une ligne de YAML.** On installe, on choisit sa station, on ajoute un panneau : c’est tout. Chaque panneau se règle à la souris dans un éditeur visuel, chaque automatisation se choisit dans des menus.

<img src="images/overview.png" width="720" alt="MeteoSwiss Complete For HA">

## Sommaire

- [Ce que vous obtenez](#ce-que-vous-obtenez)
- **Pas à pas**
  1. [Installer](#etape-1)
  2. [Ajouter votre domicile](#etape-2)
  3. [Ajouter un panneau au tableau de bord](#etape-3)
  4. [Afficher un capteur sur le tableau de bord](#etape-4)
  5. [Créer une automatisation](#etape-5)
  6. [Modifier les réglages](#etape-6)
  7. [Ajouter un autre lieu](#etape-7)
  8. [Mettre à jour](#etape-8)
- [Les panneaux](#les-panneaux) : [Prévisions](#card-forecast) · [Météo détaillée](#card-weather) · [Pollen](#card-pollen) · [Maintenant, Jours, Tuiles](#card-now-days-tiles) · [Au quotidien](#card-everyday) · [Montagne](#card-mountain) · [Brouillard](#card-fog) · [Lacs](#card-lake) · [Conseils](#card-tips) · [Éphéméride](#card-ephemeris) · [Carte postale et plus](#card-postcard) · [Pluie minute par minute](#card-rain) · [Climat](#card-stripes) · [Rivières](#card-rivers) · [Air](#card-air) · [Neige](#card-snow)
- [Soleil et lune](#soleil-et-lune)
- [Carte de la Suisse](#card-map)
- [Automatisations](#automatisations) : [capteurs oui / non](#capteurs-oui-non) · [chiffres des prévisions](#chiffres-previsions) · [déclencheurs prêts](#declencheurs) · [automatisations en un clic](#blueprints) · [calendrier et Énergie](#calendrier-energie)
- [Toutes les entités](#toutes-les-entites)
- [Langues, pictogrammes et monuments](#langues)
- [En cas de problème](#en-cas-de-probleme)
- [Les nouveautés, version par version](#nouveautes)

<a id="ce-que-vous-obtenez"></a>

## Ce que vous obtenez

| | |
|---|---|
| 🌤️ **Météo** | Conditions actuelles de la station la plus proche, prévisions sur 9 jours et heure par heure |
| 🌧️ **Radar** | Les 3 dernières heures du radar MétéoSuisse, puis la prévision de pluie des 12 heures suivantes |
| ⚠️ **Alertes intempéries** | Pluie, orages, vent, neige, routes glissantes, canicule, gel — alertes officielles de MétéoSuisse |
| 🔥 **Dangers naturels** | Incendies de forêt, crues, sécheresse (OFEV) et avalanches (SLF) |
| 🌼 **Pollen** | 7 espèces, 15 stations de mesure en Suisse |
| 🗺️ **Carte de la Suisse** | Tout cela sur une carte, ou zoomé sur votre région |
| 📍 **Vos lieux** | Alertes pour d’autres lieux (p. ex. Berne, Cernier) et **là où vous êtes** (suit votre téléphone), avec des déclencheurs d’automatisation prêts à l’emploi ; comparez-les côte à côte |
| 🌫️ **Brouillard par région** | Mer de brouillard détectée avec des stations repères de la plaine aux sommets (Neuchâtel → Chaumont → Chasseral), sommet estimé et prévision sur 3 jours, déclencheurs « le brouillard se forme / se dissipe » |
| 🏞️ **Lacs** | 27 lacs suisses : température de l’eau avec prévision sur 4 jours, oxygène, thermocline, glace, profil ; 13 lacs dessinés en couleur avec leurs courants (Eawag) |
| 🏔️ **Montagne** | Isotherme 0 °C, limite de la neige, températures par altitude, mer de brouillard et danger d’avalanche — votre région, une grande région ou toute la Suisse |
| 🧥 **Au quotidien** | *Faut-il sortir ?*, *Ma journée*, un ciel animé en direct et un écran mural avec mode nuit rouge sombre |
| 🌧️ **La pluie dans 20 minutes** | Le radar dit quand la pluie arrive chez vous, avec un déclencheur prêt à l’emploi |
| 💡 **Conseils du jour** | Séchage du linge, gel cette nuit, arrosage, étoiles, coucher de soleil, arc-en-ciel, foehn, bise, aérer — et la journée en une phrase |
| ☀️ **Prévision solaire** | La production de vos panneaux aujourd’hui et demain, heure par heure (il suffit d’entrer leur puissance) |
| 🌙 **Soleil, lune, éphéméride** | Lever, coucher, durée du jour, phase de lune dessinée au jour près (%, nom), saint du jour — dans les panneaux de votre choix |
| 📈 **Historique** | Hier, la normale 1991–2020, les records de l’année, le premier gel et la première neige de la saison |
| 🎁 **Pour le plaisir** | Une carte postale météo à partager, un jeu « devine le maximum », un badge pour le haut du tableau de bord, une couleur pour vos lampes |
| 🏊 **Rivières** | Température de l’eau, débit, niveau et danger de crue des stations de l’OFEV — l’Aar à Berne, le Rhin, le Rhône… avec le confort de baignade |
| 🌬️ **Qualité de l’air** | Ozone, NO₂ et particules fines de la station NABEL la plus proche, avec une alerte *Pic d’ozone* |
| ❄️ **Neige** | Hauteur de neige aux stations proches, et ce qui est tombé aujourd’hui |
| 📊 **Climat** | Les bandes du climat de votre station depuis 1864, et le mois en cours par rapport à la normale |
| 🧭 **Ressenti, pression** | Température ressentie (vent, chaleur), tendance de la pression sur 3 heures |
| 📅 **Calendrier et Énergie** | Un calendrier météo (avertissements, pleines lunes, journées chaudes, gel) et votre prévision solaire dans le tableau de bord Énergie |
| 🤖 **Automatisations** | Capteurs oui / non (*Fortes rafales*, *Pluie imminente*, *Risque de gel cette nuit*, *Avertissement météo en cours*, *Pare-brise gelé demain matin*, *Bon jour pour tondre*, *Nuit fraîche*, *Pic d’ozone*…), chiffres des prévisions (maximum demain, pluie aujourd’hui…), déclencheurs prêts et automatisations en un clic |

# Pas à pas

<a id="etape-1"></a>

## 1. Installer

Il faut Home Assistant **2026.1** ou plus récent, et [HACS](https://hacs.xyz).

1. Ouvrez **HACS**, puis le menu **⋮ → Dépôts personnalisés**.
2. Collez `https://github.com/SashConnection/meteoswiss4HA`, catégorie **Intégration**, puis **Ajouter**.
3. Cherchez **MeteoSwiss Complete For HA** dans HACS, ouvrez-la et cliquez **Télécharger**.
4. **Redémarrez Home Assistant** : *Paramètres → Système → ⏻ (en haut à droite) → Redémarrer Home Assistant*.

<a id="etape-2"></a>

## 2. Ajouter votre domicile

1. **Paramètres → Appareils et services → Ajouter une intégration** (bouton en bas à droite).
2. Cherchez **MeteoSwiss Complete For HA**.
3. Choisissez la **station de mesure** (la plus proche est en tête de liste) et le **numéro postal** des prévisions, p. ex. `2000` pour Neuchâtel ou `3000` pour Berne.
4. **Valider**. C’est fait : l’intégration crée un *service* au nom de votre lieu, avec une entité météo et ses capteurs.
5. **Redémarrez Home Assistant** une fois, comme le rappelle le message de fin. Après une première installation, **Paramètres → Réparations** affiche aussi *Redémarrez Home Assistant pour terminer l’installation de MeteoSwiss*, avec un bouton qui le fait pour vous. Les panneaux apparaissent ensuite sur tous les tableaux de bord et dans l’application.

Sur la page de l’intégration, vous voyez ensuite votre lieu (p. ex. *Neuchâtel (2000)*) et son nombre d’entités. Cliquez dessus pour toutes les voir.

<a id="etape-3"></a>

## 3. Ajouter un panneau au tableau de bord

<img src="images/editor.png" width="300" align="right" alt="Éditeur d’un panneau">

1. Ouvrez votre tableau de bord et cliquez le **✏️ crayon** (en haut à droite) pour le modifier.
2. **+ Ajouter une carte**, puis tapez **MeteoSwiss** dans la recherche : tous les panneaux apparaissent avec un aperçu, nommés dans la langue de votre Home Assistant (*MeteoSwiss Tuiles*, *MeteoSwiss Ma journée*…).
3. Cliquez le panneau voulu. Son éditeur s’ouvre : des sections claires, un résumé de ce qui est activé, **↺** pour revenir aux réglages d’origine, un lien vers ce mode d’emploi.
4. Cochez ce que vous voulez voir, puis **Enregistrer**, et **Terminé** en haut.

Rien à taper : chaque panneau trouve tout seul votre entité météo MeteoSwiss.

> Aucun panneau MeteoSwiss dans la liste ? Redémarrez Home Assistant (voir l’étape 2), puis rechargez la page avec **Ctrl+F5** (dans l’application : *Paramètres → Application compagnon → Débogage → Recharger le frontend*).

<br clear="right">

<a id="etape-4"></a>

## 4. Afficher un capteur sur le tableau de bord

Chaque valeur (température, *Pluie imminente*, *Risque de gel cette nuit*, *Maximum demain*…) peut s’afficher seule :

1. **Modifier le tableau de bord → + Ajouter une carte → Par entité**.
2. Cherchez la valeur, p. ex. *Fortes rafales* ou *Maximum demain*, cochez-la, puis **Continuer → Ajouter au tableau de bord**.

Ou dans l’autre sens : **Paramètres → Appareils et services → MeteoSwiss Complete For HA →** votre lieu → **Ajouter au tableau de bord** ajoute toutes ses valeurs d’un coup.

> Une valeur introuvable est peut-être **désactivée** (p. ex. *Pression QNH*) : ouvrez-la dans la page de l’appareil, ⚙️ → **Activé** → Mettre à jour.

<a id="etape-5"></a>

## 5. Créer une automatisation

Trois façons, toutes sans YAML :

- **En un clic, toute faite** — les [automatisations prêtes](#blueprints) : *Rentrer le store avant les fortes rafales*, *La pluie arrive*, *Gel cette nuit*, *Avertissement météo*, *La météo du matin*. Cliquez **Importer**, choisissez votre capteur et votre téléphone, enregistrez.
- **À partir d’un capteur oui / non** — **Paramètres → Automatisations et scènes → + Créer une automatisation → Créer une nouvelle automatisation → + Ajouter un déclencheur → Entité → État**, choisissez p. ex. *Fortes rafales*, **Vers : Activé**. Puis **+ Ajouter une action**, p. ex. *Volet → Fermer*.
- **À partir d’un déclencheur prêt** — **+ Ajouter un déclencheur → Appareil →** votre lieu MeteoSwiss, puis *La pluie arrive bientôt*, *Alerte orages annoncée*, *Premier gel de la saison*, *Le brouillard se dissipe*…

<a id="etape-6"></a>

## 6. Modifier les réglages

**Paramètres → Appareils et services → MeteoSwiss Complete For HA → ⚙️ Configurer**. Le menu propose six pages :

| Page | Réglages |
|---|---|
| **Affichage** | Pack de pictogrammes : **Animé** (par défaut), **Vif** ou **Classique**. Option **« Afficher la page carte dans la barre latérale »** (désactivée par défaut). |
| **Prévisions** | Prévisions horaires oui/non, horizon (48 h par défaut) et fréquence de mise à jour. Les fichiers horaires de MétéoSuisse sont gros : réduisez l'horizon pour économiser de la bande passante. |
| **Pollen, dangers et air** | Station pollen, région d’avalanches et station de qualité de l’air (NABEL). « Automatique » prend la plus proche du domicile ; la qualité de l’air peut être désactivée. |
| **Lacs, rivières et brouillard** | Les lacs qui ont un capteur de température de l’eau (par défaut : le lac le plus proche du domicile, s’il est à moins de 15 km), les **rivières** (stations de l’OFEV ; par défaut la plus proche qui mesure la température de l’eau, à moins de 20 km) et le **brouillard par région** (activé par défaut). |
| **Alerte pluie, vent, solaire et intérieur** | Alerte pluie d’après le radar (et combien de minutes à l’avance), le seuil de *Fortes rafales* (50 km/h par défaut) et le degré de *Avertissement météo en cours* (2 = jaune par défaut), vos panneaux solaires (puissance, inclinaison, orientation) et vos capteurs intérieurs (aérer). |
| **Lieux et personnes surveillés** | Numéros postaux ou lieux, et personnes à suivre (voir [l’étape 7](#etape-7)). |

Après un changement, l'intégration se recharge toute seule.

<a id="etape-7"></a>

## 7. Ajouter un autre lieu

Deux possibilités :

- **Alertes pour d’autres lieux et là où vous êtes** : *⚙️ Configurer → Lieux et personnes surveillés*. Indiquez des numéros postaux ou des lieux (`2053` ou `Cernier`, `3000` ou `Berne`) et des personnes à suivre (une personne ou le suivi de votre téléphone : les alertes vous suivent, en Suisse). Chacun devient un appareil avec les 7 capteurs d’alertes et ses propres déclencheurs, et apparaît dans le panneau *Comparer mes lieux*.
- **Un deuxième lieu complet** (p. ex. votre chalet) : sur la page de l’intégration, **Ajouter un service**, puis choisissez sa station et son numéro postal. Vous obtenez un deuxième jeu d’entités, à choisir dans chaque panneau.

<a id="etape-8"></a>

## 8. Mettre à jour

HACS propose la nouvelle version → **Télécharger** → **redémarrer Home Assistant** → dans le navigateur **Ctrl+F5** (dans l’application : *Paramètres → Application compagnon → Débogage → Recharger le frontend*). Les nouveautés sont dans le [CHANGELOG](../CHANGELOG.md). Les versions suivent le calendrier : **ANNÉE.MOIS.N**.

<a id="les-panneaux"></a>

# Les panneaux

<table>
<tr>
<td width="33%" valign="top"><img src="images/card-sky.png" width="100%" alt="Ciel en direct"><br><b>Ciel en direct</b><br><sub>Soleil ou lune, nuages, pluie, neige — vivant</sub></td>
<td width="33%" valign="top"><img src="images/card-tiles.png" width="100%" alt="Tuiles"><br><b>Tuiles</b><br><sub>Mini-carte des intempéries, radar animé</sub></td>
<td width="33%" valign="top"><img src="images/card-rain.png" width="100%" alt="Pluie minute par minute"><br><b>Pluie minute par minute</b><br><sub>Les 60 prochaines minutes, d’après le radar</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><img src="images/card-air.png" width="100%" alt="Qualité de l’air"><br><b>Qualité de l’air</b><br><sub>Ozone, NO₂, particules fines</sub></td>
<td width="33%" valign="top"><img src="images/card-stripes.png" width="100%" alt="Bandes du climat"><br><b>Bandes du climat</b><br><sub>Une bande par année depuis 1864</sub></td>
<td width="33%" valign="top"><img src="images/card-day.png" width="100%" alt="Ma journée"><br><b>Ma journée</b><br><sub>Matin, après-midi, soir, lever et coucher</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><img src="images/card-wall.png" width="100%" alt="Écran mural"><br><b>Écran mural</b><br><sub>Grande horloge et météo, mode nuit rouge</sub></td>
<td width="33%" valign="top"><img src="images/map-weather.jpg" width="100%" alt="Carte de la Suisse"><br><b>Carte de la Suisse</b><br><sub>Météo, radar, alertes, dangers, pollen</sub></td>
<td width="33%" valign="top"><img src="images/card-snow.png" width="100%" alt="Neige"><br><b>Neige</b><br><sub>La hauteur de neige autour de vous</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><img src="images/card-days.png" width="100%" alt="Jours"><br><b>Jours</b><br><sub>Une courbe de température et la pluie</sub></td>
<td width="33%" valign="top"><img src="images/card-ephemeris.png" width="100%" alt="Éphéméride"><br><b>Éphéméride</b><br><sub>Saint du jour, soleil, lune dessinée</sub></td>
<td width="33%" valign="top"><img src="images/card-compare.png" width="100%" alt="Comparer mes lieux"><br><b>Comparer mes lieux</b><br><sub>Chez vous et Berne côte à côte</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><img src="images/card-mountain.png" width="100%" alt="Montagne"><br><b>Montagne</b><br><sub>Isotherme 0 °C, limite de la neige, avalanches</sub></td>
<td width="33%" valign="top"><img src="images/card-outing.png" width="100%" alt="Faut-il sortir ?"><br><b>Faut-il sortir ?</b><br><sub>Un verdict, quoi mettre, le meilleur moment</sub></td>
<td width="33%" valign="top"><img src="images/card-pollen.jpg" width="100%" alt="Pollen"><br><b>Pollen</b><br><sub>Une esquisse de chaque plante, colorée selon le niveau</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><img src="images/card-rivers.png" width="100%" alt="Rivières"><br><b>Rivières</b><br><sub>L’Aar à Berne : eau, débit, niveau</sub></td>
<td width="33%" valign="top"><img src="images/card-forecast.png" width="100%" alt="Prévisions"><br><b>Prévisions</b><br><sub>Météo actuelle, heures et jours</sub></td>
<td width="33%" valign="top"><img src="images/card-now.png" width="100%" alt="Maintenant"><br><b>Maintenant</b><br><sub>Grand pictogramme et prochaines heures</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><img src="images/card-tips.png" width="100%" alt="Conseils du jour"><br><b>Conseils du jour</b><br><sub>Linge, gel, arrosage, étoiles, solaire…</sub></td>
<td width="33%" valign="top"><img src="images/card-month.png" width="100%" alt="Bilan du mois"><br><b>Bilan du mois</b><br><sub>Le mois par rapport à la normale</sub></td>
<td width="33%" valign="top"><img src="images/card-postcard.png" width="100%" alt="Carte postale"><br><b>Carte postale</b><br><sub>Le monument de votre ville et la météo</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><img src="images/card-weather.jpg" width="100%" alt="Météo détaillée"><br><b>Météo détaillée</b><br><sub>Lieu, mesures au choix, graphique horaire, 9 jours</sub></td>
<td width="33%" valign="top"><img src="images/card-lake-short.png" width="100%" alt="Lacs"><br><b>Lacs</b><br><sub>27 lacs, température de l’eau, courants</sub></td>
<td width="33%" valign="top"><img src="images/card-fog.png" width="100%" alt="Brouillard par région"><br><b>Brouillard par région</b><br><sub>Neuchâtel → Chaumont → Chasseral</sub></td>
</tr>
</table>

<sub>Exemples : Neuchâtel et Berne ; lac et brouillard montrent des données réelles du 10 novembre 2026, les autres valeurs sont des exemples.</sub>

| Panneau | Ce qu’il montre | À régler d’un clic |
|---|---|---|
| 🌤️ **Météo détaillée** | Lieu et altitude, pictogramme, état du ciel, température, station et heure de mesure, graphique heure par heure (bande d’incertitude, pluie), 9 jours (pluie, probabilité, fourchette) | Mesures affichées et leur ordre, graphique, jours, soleil et lune |
| 📅 **Prévisions** | Météo actuelle, prochaines heures et prochains jours avec les pictogrammes animés | Heures et/ou jours, nombre, détails, soleil et lune |
| 🕒 **Maintenant** | Grand pictogramme, lieu, température, prochaines heures | Graphique, nombre d’heures, soleil et lune |
| 📈 **Jours** | Une courbe de température continue et la pluie sur plusieurs jours | Nombre de jours, soleil et lune |
| ☁️ **Ciel en direct** | Le ciel du moment animé : soleil ou lune (vraie phase), nuages, pluie, neige, éclairs, brouillard, étoiles | Animation, fond du tableau de bord, soleil et lune |
| 🚶 **Faut-il sortir ?** | Verdict, heure de la pluie (radar), quoi mettre, rafales, alertes, pollen, brouillard et sommet au soleil, meilleur moment | Nombre d’heures |
| 🗓️ **Ma journée** | Nuit, matin, après-midi, soir, courbe de température, lever et coucher du soleil | Soleil et lune |
| 📍 **Comparer mes lieux** | Chez vous et vos lieux surveillés côte à côte, le meilleur endroit du jour | Nombre de jours |
| 🖥️ **Écran mural** | Grande horloge, date, météo, aujourd’hui et demain, alertes, prochaines heures, mode nuit rouge sombre | Mode nuit, secondes, heures, soleil et lune |
| 🏔️ **Montagne** | Isotherme 0 °C, limite de la neige, températures par altitude, mer de brouillard, danger d’avalanche | Région d’avalanches, altitude |
| 🌫️ **Brouillard** | Stations repères de la plaine aux sommets, sommet du brouillard, prévision sur 3 jours, carte | Région, prévision, carte, toutes les régions |
| 🏞️ **Lac** | Température de l’eau, prévision, oxygène, thermocline, glace, profil, carte en couleur avec courants et localités | Lac, valeurs, carte, profondeur, graphiques |
| 🌼 **Pollen** | Esquisse de chaque plante colorée selon le niveau, pour les stations choisies | Stations, espèces, présentation |
| 🗺️ **Carte de la Suisse** | Météo, radar, prévision radar, alertes, incendies, crues, sécheresse, avalanches, pollen | Couches, zone, zoom, légende, hauteur |
| 🧩 **Tuiles** | Mini-carte des intempéries avec pastilles des dangers, radar animé | Page ouverte au toucher |
| 💡 **Conseils du jour** | La journée en une phrase, pluie dans … min, solaire, linge, gel, arrosage, étoiles, coucher de soleil, arc-en-ciel, foehn, bise, aérer, normale, hier, records, premier gel et première neige | Les tuiles et leur ordre |
| 🌙 **Éphéméride** | Date, saint du jour, semaine, lever et coucher du soleil, durée du jour, lune dessinée (%, nom), lever et coucher de la lune, prochaine pleine et nouvelle lune | — |
| 💌 **Carte postale** | Le monument de votre ville, la météo et la lune, à partager ou télécharger | Lieu |
| 🎯 **Devine le maximum** | Pariez sur la température maximale, résultat le soir, série de réussites | — |
| 🏷️ **Badge** | Pictogramme et température en haut du tableau de bord, « ☂ Pluie dans 15 min » | Alerte pluie |
| ☂️ **Pluie minute par minute** | La pluie chez vous dans les 60 prochaines minutes, barre par barre, quand elle commence ou s’arrête | — |
| 📊 **Bandes du climat** | Une bande par année depuis l’ouverture de la station, les 10 dernières années par rapport à 1961–1990 | — |
| 🗓️ **Bilan du mois** | Ce mois-ci et le mois passé : température moyenne, pluie, soleil, jours de pluie, de gel, d’été et de canicule, extrêmes, par rapport à la normale | — |
| 🏊 **Rivières** | Vos stations de l’OFEV : température de l’eau et confort de baignade, débit, niveau, danger de crue | Stations dans les options |
| 🌬️ **Qualité de l’air** | Niveau général, ozone, NO₂, PM10, PM2.5 par rapport aux valeurs limites suisses | Station dans les options |
| ❄️ **Neige** | Hauteur de neige et changement du jour aux stations proches | — |

<a id="card-forecast"></a>

## Prévisions

La carte météo standard de Home Assistant utilise toujours ses propres icônes. Pour voir **nos pictogrammes** (animés par défaut), utilisez la carte **MeteoSwiss forecast** :

**Modifier le tableau de bord → Ajouter une carte → cherchez « MeteoSwiss forecast »**.

| Heures et jours | Jours seulement, sans détails |
|---|---|
| ![Carte prévisions](images/card-forecast.png) | ![Carte prévisions par jour](images/card-forecast-daily.png) |

- **En haut** : météo actuelle (pictogramme, état du ciel, température mesurée) et détails (humidité, vent, rafales, pression). Un clic ouvre la fiche de l'entité.
- **Au milieu** : les prochaines heures (heure, pictogramme, température, pluie en mm ou probabilité en %). Faites défiler vers la droite.
- **En bas** : les prochains jours (minimum, maximum, pluie).

Réglages dans l'éditeur de la carte, ou en YAML :

```yaml
type: custom:meteoswiss-forecast-card
forecast: both        # both = heures et jours, daily, hourly ou none
days: 7               # 1 à 9
hours: 12
show_current: true    # météo actuelle
show_details: true    # humidité, vent, pression
```

Les prévisions par heure demandent l'option **Prévisions horaires** activée (page Prévisions des réglages).

<a id="card-weather"></a>

## Météo détaillée

<img src="images/card-weather.jpg" alt="Carte météo détaillée" width="360" align="right">

La carte **MeteoSwiss detailed weather** montre tout d’un coup :

- lieu et altitude, pictogramme, état du ciel, station de mesure et heure, température ;
- une grille de **mesures choisies une par une, dans l’ordre voulu** (cochez-les et glissez-les dans l’éditeur de la carte) ;
- un **graphique heure par heure** : pictogrammes, température avec sa bande d’incertitude 10–90 %, barres de pluie, séparation des jours ;
- **9 jours** : pictogramme, minimum et maximum, pluie, risque de pluie et fourchette de pluie (10–90 %) ;
- l’heure de la prévision utilisée.

Mesures disponibles : humidité, vent (avec sa direction), rafales, pression, point de rosée, risque de pluie, isotherme 0 °C, pollen, pluie et soleil des 10 dernières minutes, rayonnement, pression QNH, pression à la station, alertes.

```yaml
type: custom:meteoswiss-weather-card
details: [humidity, wind, gust, pressure, dew_point, precipitation_probability, freezing_level, pollen]
show_header: true
show_chart: true
hours: 24             # 6 à 48
show_daily: true
days: 9
```

<br clear="right">

<a id="card-pollen"></a>

## Pollen

<img src="images/card-pollen.jpg" alt="Carte pollen" width="360" align="right">

La carte **MeteoSwiss pollen** montre, pour chaque espèce choisie, une **esquisse de la plante** qui prend la couleur du niveau de pollen dès qu’il y en a, et pour chaque station choisie le **niveau et la concentration** (moyenne sur 24 heures ou dernière heure). Disposition : **tableau** (stations en colonnes) ou **liste**. Langues : de, fr, it, rm, en.

```yaml
type: custom:meteoswiss-pollen-card
stations: [PNE, PBE]  # Neuchâtel, Berne (par défaut : la station de l’intégration)
species: [grasses, birch, hazel]
layout: table         # ou list
value: mean           # ou latest
language: auto        # ou de, fr, it, rm, en
```

<br clear="right">

<a id="card-now-days-tiles"></a>

## Maintenant, Jours et Tuiles

| Maintenant | Jours | Tuiles |
|---|---|---|
| ![Maintenant](images/card-now.png) | ![Jours](images/card-days.png) | ![Tuiles](images/card-tiles.png) |

- **MeteoSwiss now** : grand pictogramme, lieu, état du ciel et température, puis les prochaines heures (température avec sa bande d’incertitude, probabilité et quantité de pluie).
- **MeteoSwiss days** : les jours (pictogramme, min | max) au-dessus d’une courbe de température continue et de la pluie. La courbe utilise les prévisions horaires (48 h par défaut), puis passe par les minimum et maximum du jour ; réglez l’horizon horaire sur 120 h pour une courbe complète.
- **MeteoSwiss tiles** : mini-carte des intempéries avec les pastilles des dangers, et radar animé de la dernière heure. Un toucher ouvre la page choisie (p. ex. `/meteoswiss`).

<a id="card-tips"></a>

## Conseils du jour

<img src="images/card-tips.png" alt="Conseils du jour" width="380" align="right">

Un seul panneau, les tuiles que vous choisissez : **la journée en une phrase**, **la pluie dans … minutes** (radar), la **production solaire** aujourd’hui et demain, le **séchage du linge** (meilleur moment), le **gel cette nuit** (plantes et pare-brise), l’**arrosage du jardin** (bilan d’eau des 5 derniers jours), les **étoiles cette nuit** (nuages et lune), le **coucher de soleil** (coloré ou terne), l’**arc-en-ciel** (possible maintenant), le **foehn**, la **bise**, **aérer** (humidité dedans / dehors), l’**écart à la normale 1991–2020**, **hier**, les **records de l’année**, le **premier gel** et la **première neige**. Les bonnes nouvelles sont en vert ; un toucher ouvre le détail.

Chaque conseil est aussi un capteur pour vos automatisations, et plusieurs ont un déclencheur prêt à l’emploi : *La pluie arrive bientôt*, *Premier gel de la saison*, *Première neige*, *Arc-en-ciel possible*, *Beau coucher de soleil prévu*, *Le foehn souffle*, *La bise souffle*.

<br clear="right">

<a id="card-ephemeris"></a>

## Soleil, lune et éphéméride

<img src="images/card-ephemeris.png" alt="Éphéméride" width="380" align="right">

Dans l’éditeur des panneaux Météo détaillée, Prévisions, Maintenant, Jours, Ma journée, Ciel et Écran mural, la section **Soleil et lune** ajoute d’un clic : lever et coucher du soleil, durée du jour (et l’écart avec la veille), la **phase de lune dessinée pour le jour exact** avec son % et son nom, lever et coucher de la lune, prochaine pleine et nouvelle lune, et l’**éphéméride** (saint du jour, numéro de semaine et du jour) — dans la langue du panneau. Le panneau **Éphéméride** montre tout d’un coup.

Capteurs : *Phase de lune*, *Durée du jour*, *Saint du jour*.

<br clear="right">

<a id="pluie-solaire-aerer"></a>

## Pluie qui arrive, panneaux solaires, aérer

**Paramètres → Appareils et services → MeteoSwiss Complete For HA → Configurer → Alerte pluie, solaire et intérieur** :

- **Alerte pluie** : activée par défaut ; choisissez combien de minutes à l’avance (20 par défaut). Le capteur *La pluie arrive dans* donne les minutes, et le déclencheur *La pluie arrive bientôt* vous prévient à temps pour rentrer le linge.
- **Panneaux solaires** : entrez la puissance crête (kWc), l’inclinaison et l’orientation — les capteurs *Production solaire aujourd’hui / demain* donnent les kWh et la meilleure heure, heure par heure dans leurs attributs. Idéal pour lancer le lave-vaisselle ou recharger la voiture au bon moment.
- **Capteurs intérieurs** : choisissez vos capteurs de température et d’humidité ; *Aérer* dit quand ouvrir les fenêtres assèche la maison.

<a id="card-postcard"></a>

## Carte postale, devinette, badge, couleur d’ambiance, fond animé

<img src="images/card-postcard.png" alt="Carte postale météo" width="300" align="right">

- **Carte postale météo** : le monument de votre ville, la météo du moment et la lune sur une carte postale — **Partager** (téléphone) ou **Télécharger**.
- **Devine le maximum** : pariez sur la température maximale du jour, découvrez le résultat mesuré le soir, gardez votre série.
- **Badge** : le pictogramme et la température en haut du tableau de bord, avec « ☂ Pluie dans 15 min » quand elle arrive.
- **Couleur d’ambiance** : le capteur donne une couleur selon la météo et l’heure (attribut `rgb_color`) pour une lampe connectée.
- **Fond animé** : le panneau Ciel avec l’option *En fond du tableau de bord* dessine le ciel animé derrière vos panneaux (avec un thème au fond de vue transparent).

<br clear="right">

<a id="card-everyday"></a>

## Ciel en direct, Faut-il sortir ?, Ma journée, Comparer, Écran mural

- **Ciel en direct** (`meteoswiss-sky-card`) : le ciel du moment, animé, derrière le lieu et la température — soleil ou lune sur sa course entre le lever et le coucher, nuages qui avancent avec le vent, pluie, neige, éclairs, bancs de brouillard, étoiles. `animate: false` pour une image fixe (aussi quand l’appareil demande moins d’animations).
- **Faut-il sortir ?** (`meteoswiss-outing-card`) : un verdict (*Oui, vas-y !*, *avec un parapluie*, *plutôt plus tard*, *mieux vaut rester*) et les raisons : l’heure où la pluie commence, quoi mettre selon la température et le vent, rafales, alertes en vigueur, pollen, brouillard avec l’altitude du soleil, le meilleur créneau de 2 heures, le coucher du soleil. `hours: 12`.
- **Ma journée** (`meteoswiss-day-card`) : nuit, matin, après-midi et soir avec pictogramme, températures et pluie, au-dessus de la courbe de température avec le lever et le coucher du soleil. Boutons Aujourd’hui / Demain (demain d’abord après 18 h).
- **Comparer mes lieux** (`meteoswiss-compare-card`) : chez vous et chaque lieu surveillé, sur 1 à 5 jours, alertes en vigueur, et ★ le meilleur endroit du jour (le plus sec, puis le plus chaud). Ajoutez des lieux dans les options (*Lieux et personnes surveillés*).
- **Écran mural** (`meteoswiss-wall-card`) : grande horloge, date, température, aujourd’hui et demain, alertes et prochaines heures. `night_mode: auto` passe tout en rouge sombre après le coucher du soleil (`on` / `off` pour forcer).

```yaml
type: custom:meteoswiss-outing-card
hours: 12
---
type: custom:meteoswiss-wall-card
night_mode: auto        # auto (soleil), on, off
hours: 8
```

<a id="card-mountain"></a>

## Montagne

<img src="images/card-mountain.png" alt="Montagne" width="380" align="right">

Une montagne générique (sans noms) jusqu’à 4000 m avec :

- l’**isotherme 0 °C** de la prévision locale, et sa fourchette aujourd’hui et demain ;
- la **limite des chutes de neige** quand des précipitations sont prévues (≈ 300 m sous le 0 °C, *estimée*) ;
- les **températures par altitude** : ● *mesurées* par une station proche de chez vous à cette altitude (p. ex. Chaumont, Chasseral, Moléson), ○ *estimées* entre votre température et le 0 °C là où il n’y a pas de station ;
- la **mer de brouillard** de votre région (voir plus bas) ;
- le **danger d’avalanche**, avec un menu : *ma région*, une grande région (*Jura, Préalpes, Alpes bernoises, Alpes valaisannes, Suisse centrale, Grisons nord, Engadine, Sud des Alpes*) ou *toute la Suisse* (degré le plus élevé).

```yaml
type: custom:meteoswiss-mountain-card
avalanche_scope: home    # home, switzerland, jura, prealps, bernese, valais, central, grisons, engadine, south
```

<br clear="right">

<a id="card-fog"></a>

## Brouillard par région

<img src="images/card-fog.png" alt="Brouillard" width="380" align="right">

MétéoSuisse ne publie pas de mesure du « sommet du brouillard » : l’intégration le **lit dans les stations**. Chaque région a une échelle de stations de la plaine aux sommets. Une station est *dans le brouillard* quand elle n’a pas de soleil et que l’air est saturé ; elle est *au-dessus* quand elle a du soleil (de jour) ou de l’air sec (de nuit). Le sommet est entre les deux.

| Région | Plaine | Collines et sommets |
|---|---|---|
| Trois-Lacs | Neuchâtel 485 m, Payerne 490 m | Chaumont 1136 m, La Frétaz 1205 m, Chasseral 1594 m |
| Bassin lémanique | Genève 411 m, Changins 458 m, Pully 456 m | Bière 684 m, La Dôle 1670 m |
| Plateau fribourgeois | Payerne 490 m, Grangeneuve 651 m | Plaffeien 1042 m, Moléson 1974 m |
| Berne / Plateau central | Wynau 422 m, Berne 553 m | Bantiger 942 m, Napf 1404 m |
| Zurich / Nord-est | Kloten 426 m, Tänikon 539 m, Zurich 604 m | Lägern 845 m, Uetliberg 854 m, Hörnli 1133 m, Säntis 2501 m |
| Suisse centrale | Lucerne 454 m, Mosen 453 m, Egolzwil 522 m | Einsiedeln 911 m, Pilate 2105 m |
| Bâle / Jura nord | Bâle 316 m, Delémont 439 m | Fahy 596 m, Rünenberg 611 m |
| Tessin | Magadino 203 m, Lugano 273 m, Locarno 367 m | Monte Generoso 1600 m, Cimetta 1661 m |

- **Maintenant** : toutes les 10 minutes, d’après les mesures (soleil, humidité, point de rosée, précipitations).
- **Prévision** : heure par heure sur 3 jours, d’après la prévision locale des mêmes stations (symboles *stratus* et *brouillard*, nébulosité basse, durée d’ensoleillement), résumée par jour : *mercredi : stratus 6–14 h, sommet ~1000 m, soleil au-dessus*.
- **Capteurs** : `sensor.<lieu>_fog` (pas de brouillard, brouillard, stratus, couvert, précipitations ; attributs : région, `top_min`, `top_max`, stations, prévision) et `sensor.<lieu>_fog_top` (sommet estimé, m).
- **Déclencheurs** : *Le brouillard ou le stratus se forme* / *Le brouillard se dissipe*.

```yaml
type: custom:meteoswiss-fog-card
region: three_lakes     # par défaut : votre région
show_forecast: true
show_map: true
show_all: false         # liste de toutes les régions
```

La prévision lit trois fichiers horaires de MétéoSuisse toutes les 6 heures (~90 Mo) ; désactivez le brouillard dans *Lacs et brouillard* pour économiser la bande passante.

<br clear="right">

<a id="card-lake"></a>

## Lacs

<img src="images/card-lake.png" alt="Lac de Neuchâtel" width="380" align="right">

Données des modèles de lacs **Eawag Alplakes** (CC BY 4.0), pour 27 lacs : Léman, Constance, Neuchâtel, Majeur, Quatre-Cantons, Zurich, Lugano, Thoune, Bienne, Zoug, Brienz, Walenstadt, Morat, Sempach, Hallwil, Gruyère, Joux, Greifen, Sarnen, Ägeri, Baldegg, Sils, Pfäffikon, Silvaplana, Lungern, Poschiavo, Saint-Moritz.

- **Valeurs au choix** (`measures`) : température de l’eau à 1 m, variation sur 24 h, fourchette des prochaines 24 h (10–90 %), température au fond, saturation en oxygène, profondeur de la thermocline, glace, altitude, superficie, profondeur maximale, volume.
- **Carte** pour les 13 lacs qui ont un modèle 3D (Léman, Neuchâtel, Bienne, Morat, Zurich, Zoug, Quatre-Cantons, Lugano, Joux, Hallwil, Greifen, Ägeri, Saint-Moritz) : le lac dessiné en couleur selon la température, les **courants** en flèches, les **localités du bord** avec la température de l’eau devant elles, l’endroit le plus chaud et le plus froid. Un curseur va d’hier à +4 jours ; le menu de profondeur montre 1 à 50 m.
- **Prévision** à 1 m avec sa fourchette 10–90 %, et le **profil** de la surface au fond (température, oxygène, thermocline).
- **Capteurs** : un capteur *Température de l’eau <lac>* par lac choisi dans *Lacs et brouillard*, avec la prévision et toutes les valeurs en attributs — p. ex. « préviens-moi quand le lac de Neuchâtel atteint 20 °C ».

```yaml
type: custom:meteoswiss-lake-card
lake: neuchatel
measures: [trend, range, bottom, oxygen, thermocline, ice, altitude, area, max_depth, volume]
show_map: true
show_forecast: true
show_profile: true
depth: 1
```

<br clear="right">


<a id="card-rain"></a>

## Pluie minute par minute

<img src="images/card-rain.png" alt="Pluie minute par minute" width="320" align="right">

Le radar suivi en amont de chez vous, toutes les 5 minutes pour l’heure qui vient : *Pluie dans 20 min*, *Il pleut — s’arrête dans environ 15 min* ou *Pas de pluie dans l’heure*. Il faut l’alerte pluie (activée par défaut).

<br clear="right">

<a id="card-stripes"></a>

## Bandes du climat et bilan du mois

<img src="images/card-stripes.png" alt="Bandes du climat" width="320" align="right">

**Bandes du climat** : une bande par année depuis l’ouverture de votre station (depuis 1864 à Neuchâtel ou à Berne), du bleu (frais) au rouge (chaud), et de combien les 10 dernières années sont plus chaudes que 1961–1990.

<a id="card-month"></a>**Bilan du mois** : le mois en cours et le mois passé — température moyenne, pluie, soleil, jours de pluie, de gel, d’été et de canicule, extrêmes — comparés à la normale 1991–2020 (pour le mois en cours, à la part de la normale des jours déjà passés).

<br clear="right">

<a id="card-rivers"></a>

## Rivières

<img src="images/card-rivers.png" alt="Rivières" width="320" align="right">

L’OFEV mesure environ 230 rivières et lacs toutes les 10 minutes. Choisissez les vôtres dans *⚙️ Configurer → Lacs, rivières et brouillard* (par défaut la plus proche qui mesure la température de l’eau : l’Aar à Berne, la Broye à Payerne…). Chacune reçoit un capteur *Température de l’eau* (avec le confort de baignade) et un capteur *Débit* ou *Niveau* ; le panneau les montre toutes, avec le degré de danger de crue (1 à 5).

<br clear="right">

<a id="card-air"></a>

## Qualité de l’air

<img src="images/card-air.png" alt="Qualité de l’air" width="320" align="right">

Le réseau national NABEL (16 stations, p. ex. Chaumont, Berne, Payerne) : l’ozone maintenant, NO₂, PM10 et PM2.5 sur 24 heures, par rapport aux valeurs limites suisses. Capteurs *Qualité de l’air* (bonne, accrue, élevée, très élevée), *Ozone*, *Dioxyde d’azote*, *PM10*, *PM2.5*, et *Pic d’ozone* (activé au-dessus de 120 µg/m³). La station la plus proche est utilisée ; choisissez-en une autre ou désactivez-la dans *Pollen, dangers et air*.

<br clear="right">

<a id="card-snow"></a>

## Neige

<img src="images/card-snow.png" alt="Neige" width="320" align="right">

La hauteur de neige automatique des 6 stations MétéoSuisse les plus proches, avec le changement depuis minuit. Capteur *Hauteur de neige* (station la plus proche, les autres en attributs).

<br clear="right">

<a id="soleil-et-lune"></a>

# Soleil et lune

## Le soleil : lever, coucher et durée du jour

Les heures de **lever et de coucher du soleil** sont calculées pour votre domicile, à la minute, sans rien télécharger. Vous les retrouvez :

- dans la section **« Soleil et lune »** de la plupart des panneaux, avec la **durée du jour** et l’écart avec la veille (« 9 h 29, −3 min par rapport à hier ») ;
- dans **l’éphéméride**, en grand ;
- dans **« Ma journée »** : la nuit est ombrée sur la courbe de température, avec l’heure du lever ☀ et du coucher ☾ ;
- dans le **ciel animé** : le soleil suit sa vraie course entre le lever et le coucher, l’aube et le crépuscule colorent le ciel, puis la lune et les étoiles prennent le relais ;
- dans **« Faut-il sortir ? »** (« Coucher du soleil 16:58 ») et en **mode nuit automatique** de l’écran mural, qui passe au rouge sombre au coucher du soleil ;
- dans les **conseils du jour** : « Coucher de soleil magnifique » quand les nuages s’annoncent colorés.

Pour vos automatisations : le capteur **Durée du jour** (avec le lever, le coucher et l’écart avec hier) et le déclencheur **« Beau coucher de soleil prévu »**.

## La lune, dessinée pour le jour exact

La lune n’est pas une icône toute faite : elle est **dessinée pour la phase exacte du jour**, avec la partie éclairée au bon pourcentage, quelques cratères et la face sombre en bleu nuit. Elle apparaît dans l’éphéméride, dans la section « Soleil et lune » des panneaux, dans le ciel animé et sur la carte postale, avec le **nom de la phase dans votre langue** et le **% éclairé**.

![Les phases de la lune](images/moon-phases.png)

<a id="card-map"></a>

# Carte de la Suisse

Ajoutez la carte **MeteoSwiss map** à un tableau de bord (ou activez la page dans la barre latérale, voir [Modifier les réglages](#etape-6)). La barre de boutons en haut à gauche change de carte ; le **trait de couleur** au-dessus de chaque bouton donne le niveau de danger le plus élevé en ce moment en Suisse.

Boutons sous le zoom : **⌖** recentre la carte, **+ / −** zooment.

### Météo

![Prévisions sur la carte](images/map-weather.jpg)

Pictogramme, minimum et maximum pour 31 villes et quelques sommets (en vert) ; votre domicile est en orange. Les onglets du bas choisissent le jour. En zoomant, d'autres lieux apparaissent.

### Radar des précipitations

![Radar](images/map-radar.jpg)

Les **3 dernières heures** du radar MétéoSuisse, une image toutes les 5 minutes, puis la **prévision de pluie heure par heure** (partie **orange** du curseur, libellé « Prévision ») :

![Prévision radar](images/map-radar-forecast.jpg)

Le bouton ▶ / ❚❚ lance ou arrête l'animation ; le curseur permet de choisir une heure. Les images radar et la prévision de pluie sont préparées à partir des données MétéoSuisse par un serveur du projet (`ha.jesaispas.ch`), d’où Home Assistant les télécharge. Si ce serveur ne répond pas, la carte affiche « Le radar n'est pas disponible pour le moment ».

### Alertes intempéries

![Alertes intempéries](images/map-warnings.jpg)

Les alertes officielles de MétéoSuisse : **pluie, orages, vent, neige, routes glissantes, canicule, gel** (onglets du bas). La Suisse est en vert quand il n'y a pas d'alerte ; les régions en alerte prennent la couleur du degré de danger. Les alertes **à venir** sont en pointillés. Passez la souris (ou touchez) une région pour voir le texte, le début et la fin de l'alerte.

### Incendies de forêt, crues, sécheresse

| Incendies | Crues | Sécheresse |
|---|---|---|
| ![Incendies](images/map-fire.jpg) | ![Crues](images/map-flood.jpg) | ![Sécheresse](images/map-drought.jpg) |

Cartes de l'OFEV par région (et par cours d'eau pour les crues). Les couches **Avalanches** (bulletin du SLF, en saison) et **Pollen** (15 stations de mesure) fonctionnent de la même façon.

### Degrés de danger

| Degré | Couleur | Signification |
|---|---|---|
| 1 | vert | Aucun danger ou danger faible (pas d'alerte) |
| 2 | jaune | Danger limité |
| 3 | orange | Danger marqué |
| 4 | rouge | Fort danger |
| 5 | rouge foncé | Très fort danger |

## Une carte par danger, ou zoomée sur votre région

Dans l'éditeur de la carte **MeteoSwiss map** :

- **Couches affichées** : cochez **un seul** danger pour une carte dédiée, sans barre de boutons (vous pouvez en mettre plusieurs sur un tableau de bord) ;
- **Zone** : **Toute la Suisse** ou **Ma région (domicile)**, avec un niveau de **zoom** de 7 à 12 ;
- **Légende** affichée ou non, **hauteur** de la carte.

| Incendies seulement | Radar zoomé sur le domicile |
|---|---|
| ![Carte incendies](images/card-map-fire.png) | ![Radar zoomé](images/card-map-home-radar.png) |

En YAML :

```yaml
type: custom:meteoswiss-map-card
layers: [radar]       # une ou plusieurs couches : weather, radar, warnings, fire, flood, drought, avalanche, pollen
area: home            # switzerland (par défaut) ou home
zoom: 9
legend: true
height: 360
```

## Sur téléphone

<img src="images/mobile.jpg" alt="Sur téléphone" width="300">

Sur un écran étroit, la légende devient une ligne compacte et les onglets utilisent des icônes. Dans la page de la barre latérale, le bouton ☰ ouvre le menu de Home Assistant.

<a id="automatisations"></a>

# Automatisations

Tout se choisit dans des menus : voir [Créer une automatisation](#etape-5).

<a id="capteurs-oui-non"></a>

## Capteurs oui / non

Ils sont **activés** quand quelque chose se passe ou qu’il faut agir — une automatisation n’a besoin que de *« quand il s’active »*.

| Capteur | Activé quand… |
|---|---|
| ☔ **Il pleut** | la station a mesuré de la pluie dans les 10 dernières minutes, ou le radar voit de la pluie chez vous |
| 🌧️ **Pluie imminente** | le radar voit la pluie arriver chez vous dans le délai d’alerte (20 min par défaut) ; attribut `minutes` |
| 💨 **Fortes rafales** | les rafales atteignent le seuil (50 km/h par défaut) maintenant ou dans les 3 prochaines heures — rentrez le store ; attributs : pointe et son heure |
| ⚠️ **Avertissement météo en cours** | un avertissement MétéoSuisse chez vous atteint le degré choisi (2 = jaune par défaut) ; attributs : lesquels, degré le plus haut, à venir |
| ❄️ **Risque de gel cette nuit** | du gel est possible ou probable la nuit prochaine |
| 👕 **Bon pour sécher le linge** | le reste de la journée est bon pour sécher le linge dehors |
| 🌫️ **Brouillard à la maison** | brouillard ou stratus dans votre région maintenant |
| 🪴 **Arrosage nécessaire** | le bilan d’eau des derniers jours dit que le jardin a soif |
| 🪟 **Aérer maintenant** | ouvrir les fenêtres assèche la maison (seulement avec vos capteurs intérieurs) |
| 🚗 **Pare-brise gelé demain matin** | le matin (5–8 h) sera sous zéro, ou proche de zéro par ciel dégagé |
| 🌱 **Bon jour pour tondre** | de mars à octobre, sec maintenant et pour le reste de la journée, assez doux |
| 🌙 **Nuit fraîche : aérer ce soir** | une journée chaude (25 °C ou plus) suivie d’une nuit à 18 °C ou moins — ouvrez les fenêtres pour rafraîchir la maison |
| 🫁 **Pic d’ozone** | ozone au-dessus de la valeur limite suisse (120 µg/m³) à la station NABEL |

Les seuils se règlent dans *⚙️ Configurer → Alerte pluie, vent, solaire et intérieur*.

<a id="chiffres-previsions"></a>

## Chiffres des prévisions

De simples nombres, pour *« si le maximum de demain dépasse 30 °C… »* :

| Capteur | Valeur |
|---|---|
| **Maximum aujourd’hui / demain**, **Minimum aujourd’hui / demain** | °C de la prévision locale |
| **Précipitations aujourd’hui / demain** | mm |
| **Probabilité de pluie aujourd’hui / demain** | % (probabilité horaire la plus haute de la journée) |
| **Rafale la plus forte aujourd’hui** | km/h encore attendus aujourd’hui, avec l’heure |
| **La pluie arrive dans** | minutes avant que la pluie atteigne votre domicile (radar) |
| **Température ressentie** | °C : refroidissement éolien au froid, indice de chaleur au chaud |
| **Tendance de la pression (3 h)** | hPa sur 3 heures : baisse rapide, baisse, stable, hausse, hausse rapide |
| **Hauteur de neige** | cm à la station la plus proche qui la mesure |
| **Température de l’eau / Débit / Niveau** *(rivière)* | °C, m³/s, m de vos stations de l’OFEV |
| **Ozone**, **Dioxyde d’azote**, **PM10**, **PM2.5** | µg/m³ à la station NABEL |

À utiliser avec **+ Ajouter un déclencheur → Entité → État numérique**, p. ex. *Minimum demain* sous 0 → couvrir les plantes.

<a id="declencheurs"></a>

## Déclencheurs prêts à l’emploi

**+ Ajouter un déclencheur → Appareil →** votre lieu MeteoSwiss, puis :

- alertes météo : *Alerte orages annoncée* (une alerte à venir est publiée), *Alerte pluie en vigueur* / *Fin de l’alerte pluie*, *L’alerte vent atteint un degré* (2 à 5) — aussi pour vos lieux et personnes surveillés ;
- *Le danger d’incendie / de crues / de sécheresse / d’avalanches atteint un degré*, *Le pollen atteint un niveau* ;
- *Le brouillard ou le stratus se forme*, *Le brouillard se dissipe* ;
- *La pluie arrive bientôt*, *Premier gel de la saison*, *Première neige de la saison*, *Arc-en-ciel possible*, *Beau coucher de soleil attendu*, *Le foehn souffle*, *La bise souffle*.

<a id="blueprints"></a>

## Automatisations prêtes en un clic

Cliquez **Importer**, confirmez, puis **Créer une automatisation** à partir du modèle : choisissez votre capteur, votre téléphone (application Home Assistant) ou vos stores, enregistrez. Les textes des messages se changent dans votre langue.

| Automatisation | Ce qu’elle fait | |
|---|---|---|
| 💨 **Rentrer le store avant les fortes rafales** | Ferme stores, volets ou marquises quand *Fortes rafales* s’active (et, si vous voulez, quand il pleut) | [![Importer](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2FSashConnection%2Fmeteoswiss4HA%2Fblob%2Fmain%2Fblueprints%2Fautomation%2Fmeteoswiss4ha%2Fclose_awning_wind.yaml) |
| 🌧️ **La pluie arrive** | Prévient votre téléphone : *« La pluie arrive chez vous dans environ 15 minutes »* | [![Importer](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2FSashConnection%2Fmeteoswiss4HA%2Fblob%2Fmain%2Fblueprints%2Fautomation%2Fmeteoswiss4ha%2Frain_alert.yaml) |
| ❄️ **Gel cette nuit** | Le soir, vous prévient quand du gel est attendu, avec le minimum | [![Importer](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2FSashConnection%2Fmeteoswiss4HA%2Fblob%2Fmain%2Fblueprints%2Fautomation%2Fmeteoswiss4ha%2Ffrost_alert.yaml) |
| ⚠️ **Avertissement météo** | Vous prévient quand un avertissement entre en vigueur chez vous | [![Importer](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2FSashConnection%2Fmeteoswiss4HA%2Fblob%2Fmain%2Fblueprints%2Fautomation%2Fmeteoswiss4ha%2Fweather_warning.yaml) |
| 🚗 **Pare-brise gelé** | Le soir, vous prévient quand le pare-brise sera gelé demain matin | [![Importer](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2FSashConnection%2Fmeteoswiss4HA%2Fblob%2Fmain%2Fblueprints%2Fautomation%2Fmeteoswiss4ha%2Fwindshield_frost.yaml) |
| ☀️ **La météo du matin** | Chaque matin, la journée en une phrase, le maximum et la probabilité de pluie — sur votre téléphone et, si vous voulez, lue par un haut-parleur | [![Importer](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2FSashConnection%2Fmeteoswiss4HA%2Fblob%2Fmain%2Fblueprints%2Fautomation%2Fmeteoswiss4ha%2Fmorning_briefing.yaml) |

<a id="calendrier-energie"></a>

## Calendrier et tableau de bord Énergie

- **Calendrier météo** : avertissements en cours et annoncés, pleines et nouvelles lunes, journées chaudes (30 °C ou plus), gel et fortes pluies de la prévision. Il s’affiche dans le calendrier de Home Assistant et peut déclencher des automatisations (*Début d’un événement du calendrier*).
- **Tableau de bord Énergie** : quand vos panneaux solaires sont réglés (*Alerte pluie, vent, solaire et intérieur*), **Paramètres → Tableaux de bord → Énergie → Panneaux solaires → Prévision de production solaire** propose *MeteoSwiss Complete For HA* : la production estimée apparaît dans les graphiques Énergie.

<a id="toutes-les-entites"></a>

# Toutes les entités

| Entité | Contenu |
|---|---|
| `weather.<lieu>` | Météo actuelle et prévisions par jour et par heure (attribut `meteoswiss_symbol` en plus de l'état standard). |
| `sensor.<lieu>_temperature`, `_humidity`, … | Mesures de la station. |
| `sensor.<lieu>_meteoswiss_symbol`, `_weather_description` | Symbole et description officielle MétéoSuisse ; l'image du capteur est le pictogramme du pack choisi. |
| `sensor.<lieu>_rain_warning`, `_thunderstorm_warning`, `_wind_warning`, `_snow_warning`, `_slippery_roads_warning`, `_heat_warning`, `_frost_warning` | Alerte en cours chez vous (`low` = pas d'alerte). Attributs : texte, début, fin, et `upcoming` pour les alertes à venir. |
| `sensor.<lieu>_flood_danger`, `_forest_fire_danger`, `_drought_danger`, `_avalanche_danger` | Degré de danger de votre région. |
| `sensor.<lieu>_pollen_level`, `_birch_pollen`, … | Pollen : niveau général et concentration par espèce. |
| Phase de lune, Durée du jour, Saint du jour | Phase (éclairage en %, prochaine pleine / nouvelle lune), durée du jour (lever, coucher), saint du jour (semaine, jour). |
| La journée en une phrase, Couleur d’ambiance | Résumé du jour dans la langue de HA ; une couleur pour vos lampes (`rgb_color`). |
| La pluie arrive dans | Minutes avant que la pluie atteigne votre domicile (radar). |
| Séchage du linge, Gel cette nuit, Arrosage du jardin, Étoiles cette nuit, Coucher de soleil, Arc-en-ciel, Foehn, Bise, Aérer | Conseils du quotidien (états traduits), détails en attributs. |
| Production solaire aujourd’hui / demain | kWh estimés de vos panneaux, heure par heure. |
| Écart à la normale, Maximum d’hier, Plus chaud / Plus froid de l’année, Plus forte rafale de l’année, Premier gel, Première neige | Historique de votre station : normale 1991–2020, hier, records, premiers gel et neige. |
| `sensor.<lieu>_fog`, `_fog_top` | Brouillard / stratus dans votre région et sommet estimé (m). |
| `sensor.<lieu>_water_temperature_<lac>` | Température de l’eau d’un lac (1 m), avec prévision, oxygène, thermocline, glace et données du lac en attributs. |
| Il pleut, Pluie imminente, Fortes rafales, Avertissement météo en cours, Risque de gel cette nuit, Bon pour sécher le linge, Brouillard à la maison, Arrosage nécessaire, Aérer maintenant | Capteurs oui / non (`binary_sensor`) pour les automatisations (voir [plus haut](#capteurs-oui-non)). |
| Maximum / Minimum aujourd’hui et demain, Précipitations aujourd’hui / demain, Probabilité de pluie aujourd’hui / demain, Rafale la plus forte aujourd’hui | Chiffres des prévisions. |
| Pare-brise gelé demain matin, Bon jour pour tondre, Nuit fraîche, Pic d’ozone | Autres capteurs oui / non. |
| Température ressentie, Tendance de la pression (3 h), Hauteur de neige | Ressenti, tendance de la pression (attribut `trend`), neige (stations alentour en attributs). |
| Température de l’eau / Débit / Niveau *<station>* | Rivières (OFEV) : valeurs, danger de crue, confort de baignade. |
| Qualité de l’air, Ozone, Dioxyde d’azote, PM10, PM2.5 | Qualité de l’air (NABEL). |
| Calendrier météo | Le calendrier (`calendar.`). |

Pour les amateurs de YAML : être averti dès qu’une alerte orage est annoncée.

```yaml
triggers:
  - trigger: state
    entity_id: sensor.maison_thunderstorm_warning
    attribute: upcoming
conditions:
  - condition: template
    value_template: "{{ state_attr('sensor.maison_thunderstorm_warning', 'upcoming') | count > 0 }}"
actions:
  - action: notify.notify
    data:
      message: "Alerte orages annoncée : {{ state_attr('sensor.maison_thunderstorm_warning', 'upcoming')[0].event }}"
```

<a id="langues"></a>

# Langues, pictogrammes et monuments

Tout — réglages, entités, cartes et carte de la Suisse — existe en **Deutsch, Français, Italiano, Rumantsch et English**. Les cartes suivent la langue de Home Assistant ; chaque carte peut aussi être réglée sur une autre langue.

![La carte pollen en cinq langues](images/languages.jpg)

Trois packs de pictogrammes, un par symbole météo MétéoSuisse ; le pack animé est celui par défaut (réglages → Affichage).

![Packs de pictogrammes](images/packs.jpg)

Chaque ville de la carte a son pictogramme dessiné de son monument le plus connu : la Zytglogge à Berne, le Jet d’eau à Genève, la Kapellbrücke à Lucerne, le château et la Collégiale à Neuchâtel, le Cervin à Zermatt… Ils apparaissent sur les étiquettes de la carte et à côté du nom du lieu dans les panneaux (option `monument: false` pour les masquer).

![Monuments](images/monuments.png)

<a id="en-cas-de-probleme"></a>

# En cas de problème

| Problème | Solution |
|---|---|
| Aucun panneau MeteoSwiss dans *Ajouter une carte* | Redémarrez Home Assistant une fois après l’installation (*Paramètres → Réparations* propose un bouton), puis Ctrl+F5. Cherchez **MeteoSwiss**. |
| Les cartes n'ont pas changé après une mise à jour | Ctrl+F5 dans le navigateur ; sur l'application mobile, *Paramètres de l'application → Débogage → Recharger le frontend*. |
| La carte est décentrée | Bouton **⌖** sous le zoom. |
| « Le radar n'est pas disponible pour le moment » | Le serveur radar du projet ne répond pas ; il se rétablit tout seul, réessayez plus tard. |
| Pas de prévisions par heure | Activez **Prévisions horaires** dans les réglages (page Prévisions). |
| Une alerte ou un danger est « indisponible » | La source (MétéoSuisse/MeteoAlarm, OFEV, SLF) ne répond pas ; la valeur revient à la mise à jour suivante. |
| Le panneau brouillard dit « indisponible » | Activez *Brouillard et stratus par région* dans *Lacs et brouillard*. |
| Un panneau lac reste vide | Le serveur de l’Eawag limite le nombre de requêtes ; le panneau réessaie à la mise à jour suivante. |

Sources : MétéoSuisse (Open Data, CC BY 4.0), alertes MétéoSuisse via MeteoAlarm, OFEV, SLF, rivières OFEV via LINDAS et qualité de l’air NABEL (OFEV / Empa ; données provisoires), lacs Eawag Alplakes (CC BY 4.0 ; données des lacs arrondies), fond de carte swisstopo. Ce projet n'est pas affilié à MétéoSuisse.

<a id="nouveautes"></a>

# Les nouveautés, version par version

**2026.11.13** — la grosse mise à jour
- **Rivières** (OFEV) : l’Aar à Berne et environ 230 stations — température de l’eau avec le confort de baignade, débit, niveau, danger de crue. Nouveau panneau *Rivières*.
- **Qualité de l’air** (NABEL) : ozone, NO₂, PM10, PM2.5, niveau général et capteur *Pic d’ozone*. Nouveau panneau *Qualité de l’air*.
- **Hauteur de neige** aux stations autour de chez vous, **température ressentie**, **tendance de la pression**. Nouveau panneau *Neige*.
- Nouveaux panneaux **Pluie minute par minute**, **Bandes du climat** (depuis 1864) et **Bilan du mois**.
- **Calendrier météo** et votre **prévision solaire dans le tableau de bord Énergie**.
- **Automatisations faciles** : capteurs oui / non (*Il pleut*, *Pluie imminente*, *Fortes rafales*, *Avertissement météo en cours*, *Risque de gel cette nuit*, *Pare-brise gelé demain matin*, *Bon jour pour tondre*, *Nuit fraîche*, *Bon pour sécher le linge*, *Brouillard à la maison*, *Arrosage nécessaire*, *Aérer maintenant*, *Pic d’ozone*), chiffres des prévisions (maximum et minimum aujourd’hui et demain, pluie, rafales) et **6 automatisations en un clic**.
- **Soleil, lune et éphéméride** dans les panneaux : lever, coucher, durée du jour, la lune dessinée pour le jour exact, saint du jour. Nouveau panneau *Éphéméride*.
- **Conseils du jour** : linge, gel, arrosage, étoiles, coucher de soleil, arc-en-ciel, foehn, bise, aérer, production solaire, la journée en une phrase. **Historique de la station** : hier, la normale 1991–2020, les records, le premier gel et la première neige.
- **Échapper au brouillard** : le sommet ensoleillé le plus proche. **Lacs** : confort de baignade. **Pour le plaisir** : carte postale, devinette, badge, couleur d’ambiance, ciel animé en fond d’écran.
- **Sans YAML, jamais** : chaque panneau a un éditeur clair par sections ; noms des panneaux dans votre langue ; rappel de redémarrage et redémarrage en un clic dans *Réparations* ; nouveau mode d’emploi pas à pas.

**2026.11.12** — La carte de la Suisse protège les textes venant des sources fédérales (sécurité).

**2026.11.11** — Prête pour le catalogue HACS par défaut.

**2026.11.10** — **Brouillard par région** (mer de brouillard maintenant et sur 3 jours, avec son sommet), **27 lacs** (température de l’eau, prévision, oxygène, courants dessinés en couleur), le panneau **Montagne** (isotherme 0 °C, limite de la neige, avalanches) et les panneaux du quotidien : **ciel en direct**, **Faut-il sortir ?**, **Ma journée**, **Comparer mes lieux**, **écran mural**.

**2026.11.9** — Un **monument** dessiné pour chaque ville de la carte.

**2026.11.8** — **Lieux surveillés et personnes suivies** avec leurs alertes, **déclencheurs d’automatisation prêts** en 5 langues, et les panneaux **Maintenant**, **Jours** et **Tuiles**.

**2026.11.7** — Nouvelle page de présentation, heures sur 24 h partout.

**2026.11.6** — Tout en **5 langues** : allemand, français, italien, romanche et anglais.

**2026.11.5** — Le **panneau pollen** avec une esquisse de chaque plante.

**2026.11.2 – 2026.11.4** — Le panneau **météo détaillée** (mesures au choix, graphique horaire avec la bande d’incertitude, 9 jours) et le logo.

**2026.11.0 – 2026.11.1** — Première version : entité météo, mesures de la station, prévisions, pollen, dangers naturels et alertes météo, **pictogrammes animés**, le panneau **Prévisions** et la **carte de la Suisse** avec le radar.

Les détails sont dans le [CHANGELOG](../CHANGELOG.md).
