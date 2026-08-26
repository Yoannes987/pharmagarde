# Site de PharmaGarde

Le site vitrine de l'application **PharmaGarde** : pharmacies de garde et
prix des médicaments au Togo.

En ligne : <https://yoannes987.github.io/pharmagarde/>

## Les trois fichiers

| Fichier | À quoi il sert |
|---|---|
| `index.html` | La page d'accueil (présentation, chiffres, sources, téléchargement) |
| `confidentialite.html` | La politique de confidentialité — c'est ce lien qu'il faut donner à la Google Play Console |
| `style.css` | L'apparence des deux pages |

Pas de framework, pas d'étape de compilation. On modifie le fichier, on
enregistre, on pousse sur `main`, et GitHub Pages met le site à jour tout
seul en une minute environ.

## Les trois choses à faire quand l'app sortira

**1. Le lien du Play Store.** Ouvre `index.html` et cherche le mot
`ATTENTION` (il apparaît **deux fois** : dans le bouton du haut, et dans la
section verte du bas). Chaque fois, le commentaire juste au-dessus donne la
ligne exacte à mettre à la place.

**2. L'icône.** Dépose `icone.png` (512 × 512 px, l'icône de l'APK) à la
racine du dépôt. Puis, dans `index.html` et `confidentialite.html`, cherche
le mot `FAVICON` et `LOGO` : les commentaires expliquent quoi décommenter.

**3. Les chiffres.** Dans `index.html`, le bloc `class="chiffres"` contient
274 pharmacies, 51 de garde, 4 811 médicaments, 23 villes, avec la date du
relevé juste en dessous. Ces nombres sont écrits en dur : quand tu les mets
à jour, **change aussi la date**, sinon le site affirme une fraîcheur qu'il
n'a pas.

## Ce qui n'est pas ici

- Le code de l'application : <https://github.com/Yoannes987/pharmatogo-app>
- Les robots qui remplissent la base : <https://github.com/Yoannes987/pharmatogo-scraper>

## Mentions

Les listes de garde et les prix proviennent des publications de l'INAM
(Institut National d'Assurance Maladie) du Togo. Projet indépendant, sans
lien officiel avec l'INAM.

Contact : senouyohanes719@gmail.com · +228 96 11 97 15

## L'icone

`icone.svg` est l'icone de l'application redessinee en vectoriel : la croix de
pharmacie dont la branche basse devient la pointe d'un repere de carte. Elle
sert de favicon (le petit dessin dans l'onglet du navigateur) et de logo, en
haut et en bas des deux pages.

Si tu preferes ton fichier PNG d'origine, plus fidele au pixel : depose-le a la
racine du depot sous le nom `icone.png`, puis remplace `icone.svg` par
`icone.png` aux six endroits ou il apparait -- trois par page :

    index.html            ligne <link rel="icon">, logo de l'en-tete, logo du pied
    confidentialite.html  ligne <link rel="icon">, logo de l'en-tete, logo du pied

Sur les deux lignes `<link rel="icon">`, change aussi `type="image/svg+xml"`
en `type="image/png"`.

## Pourquoi le nombre de pharmacies de garde n'est pas affiche ici

Il change chaque semaine, et ce site est statique : il ne lit pas la base de
donnees. Un chiffre hebdomadaire ecrit en dur serait faux au bout de huit
jours -- et c'est precisement le chiffre sur lequel quelqu'un pourrait decider
de prendre la route la nuit. Les quatre chiffres affiches (pharmacies,
pharmacies localisees, medicaments, villes) bougent lentement, et la ligne
sous le tableau dit a quelle date ils ont ete releves. Si tu les mets a jour,
change cette date aussi.
