# Prompts photos — Seconde

Pourquoi tes photos actuelles rendent mal : elles font entre 32 et 47 Ko chacune, ce qui correspond à une résolution très basse (probablement compressée depuis un écran ou une capture). Sur le site, ces images sont affichées jusqu'à 520px de haut en desktop, et jusqu'à 2x plus grand sur un écran Retina — donc une image de départ trop petite devient floue dès qu'elle est agrandie. La résolution de départ doit toujours être plus grande que sa taille d'affichage la plus grande.

## Réglages pour une bonne qualité

**Résolution à viser : minimum 2000 x 2000px** par image (ou l'équivalent en 3:2 / 4:5), pour avoir de la marge sur les écrans Retina.

- **Avec ChatGPT (DALL-E) :** demande explicitement "haute résolution, format paysage" dans ton message. Télécharge l'image en PNG (pas de recompression).
- **Avec Midjourney :** ajoute `--ar 4:5` (portrait) ou `--ar 3:2` (paysage) selon la photo, `--v 6.1 --style raw --q 2` à la fin du prompt pour un rendu photoréaliste net et une qualité maximale. Utilise le bouton "Upscale" sur l'image choisie avant de la télécharger.
- Génère **plusieurs variations** (4 par prompt) et choisis celle où les mains/visages sont les plus naturels — c'est souvent le point faible de l'IA.
- Envoie-moi les fichiers tels quels (pas besoin de les recadrer toi-même) : une fois reçus, je les recadre aux bons formats, j'harmonise les couleurs entre elles et j'optimise le poids pour le web sans perte de netteté visible.

## Style commun à coller au début de chaque prompt

```
Photographie éditoriale lifestyle, photoréaliste, style reportage haut de gamme.
Appartement parisien haussmannien chaleureux : parquet point de Hongrie, moulures
blanches, lumière naturelle douce en fin d'après-midi, tons chauds et organiques —
vert sauge, crème, beige, bois clair. Ambiance intime et authentique, pas posée,
comme un instant capturé. Grain de pellicule très léger, profondeur de champ faible
(objectif 50mm ou 85mm), légèrement surexposé et doux. Aucune marque, aucun logo,
aucun texte visible. Rendu photo réel — surtout pas d'illustration, pas de rendu 3D,
pas de style cartoon, pas de peau trop lisse ou plastique.
```

## Photo 1 — Hero (image principale, page d'accueil)

```
[style commun ci-dessus]

Scène : deux femmes d'une trentaine d'années, complices et souriantes, trient
ensemble des vêtements suspendus sur un portant en bois dans un salon lumineux.
L'une tient un chemisier crème, l'autre regarde par-dessus son épaule. Portant
rempli de vêtements aux teintes sauge, crème et terracotta. Format portrait,
cadrage large montrant la pièce (fenêtre haussmannienne en fond, plante verte).
--ar 4:5 --v 6.1 --style raw --q 2
```

## Photo 2 — Concept (gros plan, mains)

```
[style commun ci-dessus]

Scène : gros plan sur des mains de femme qui plient soigneusement un pull en
maille couleur sauge, posé sur une table en bois clair. À côté, une pile de
vêtements déjà pliés (crème, beige) et une étiquette en kraft nouée d'une
ficelle. Lumière rasante venant d'une fenêtre à gauche. Aucun visage visible,
focus entièrement sur les mains et le tissu.
--ar 4:3 --v 6.1 --style raw --q 2
```

## Photo 3 — Étapes (choix dans le dressing)

```
[style commun ci-dessus]

Scène : une femme de dos ou de trois-quarts, dans un dressing ou une penderie
ouverte bien rangée, tenant une robe sur un cintre en bois qu'elle vient de
décrocher pour l'examiner. Vêtements organisés par couleur, tons chauds et
naturels. Lumière douce, ambiance calme et posée, comme un rituel du dimanche.
--ar 4:5 --v 6.1 --style raw --q 2
```

## Photo 4 — Rendez-vous (remise du sac)

```
[style commun ci-dessus]

Scène : à l'entrée d'un appartement parisien (porte en bois, moulures), une
femme tend un sac en toile beige rempli de vêtements pliés à une collectrice
souriante en tenue simple et chaleureuse. Moment d'échange convivial, sourires
naturels, lumière d'entrée d'immeuble douce. Cadrage à hauteur d'épaules.
--ar 4:3 --v 6.1 --style raw --q 2
```
