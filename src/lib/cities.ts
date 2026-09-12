export type CitySection = {
  heading: string;
  paragraphs: string[];
  list?: string[];
};

export type CityData = {
  slug: string;
  title: string;
  metaDescription: string;
  h1: string;
  intro: string;
  sections: CitySection[];
  jsonLdDescription: string;
};

export const cities: CityData[] = [
  {
    slug: "paris",
    title: "Conciergerie seconde main à Paris — on vend vos vêtements",
    metaDescription:
      "Vous habitez à Paris ? Seconde vient chez vous, trie, photographie et vend vos vêtements sur les plateformes de seconde main. Vous touchez 50% de chaque vente. Gratuit sous 24h.",
    h1: "On vend vos vêtements de seconde main à Paris — vous n'avez rien à gérer",
    intro:
      "Vous habitez à Paris et votre dressing déborde ? Vous aimeriez vendre vos vêtements mais vous n'avez ni le temps, ni l'envie de gérer les annonces, les photos, les négociations et les rendez-vous avec des inconnus ?",
    sections: [
      {
        heading: "Comment ça marche à Paris ?",
        paragraphs: [],
        list: [
          "Prenez rendez-vous — Remplissez le formulaire, on vous contacte sous 24 heures.",
          "On vient chez vous — Que vous soyez dans le Marais, à Montmartre, dans le 16e ou à Belleville, on se déplace partout dans Paris intra-muros.",
          "On trie et on photographie — Chaque pièce est évaluée, triée et photographiée par notre vendeuse experte.",
          "On vend pour vous — Vos vêtements sont mis en ligne sur Vinted, Vestiaire Collective, et nos autres plateformes partenaires.",
          "Vous touchez 50% de chaque vente — Le paiement est versé sur votre compte après chaque vente.",
        ],
      },
      {
        heading: "Pourquoi faire appel à une conciergerie de seconde main à Paris ?",
        paragraphs: [
          "Vivre à Paris, c'est souvent vivre dans un espace limité. Un dressing qui déborde, c'est de la place perdue. Mais vendre ses vêtements soi-même, c'est long et fastidieux : prendre des photos, rédiger des descriptions, répondre aux messages, gérer les expéditions, faire face aux négociations...",
          "Avec Seconde, vous récupérez votre espace et votre temps, tout en gagnant de l'argent. Et vous donnez une seconde vie à vos vêtements, dans une ville où la mode circulaire a toute sa place.",
        ],
      },
      {
        heading: "Quelles zones couvre Seconde à Paris ?",
        paragraphs: [
          "On intervient dans tous les arrondissements de Paris, du 1er au 20e, ainsi que dans les communes limitrophes (Neuilly, Levallois, Boulogne, Montreuil, Vincennes, Issy-les-Moulineaux). Si vous habitez en petite couronne, on se déplace aussi chez vous.",
        ],
      },
      {
        heading: "Ce que vous touchez",
        paragraphs: [
          "Vous percevez 50% du prix de vente de chaque article. 40% revient à votre vendeuse (tri, photos, annonces, expédition) et 10% fait tourner la plateforme Seconde. Pas de frais cachés. Le rendez-vous à domicile est facturé de 10 à 50€ selon la formule choisie. Ce qui ne se vend pas vous revient, ou part vers nos filières de réemploi.",
        ],
      },
    ],
    jsonLdDescription:
      "Service de conciergerie de seconde main à Paris. On vient chez vous, on trie, on photographie et on vend vos vêtements. Vous touchez 50% de chaque vente.",
  },
  {
    slug: "conciergerie-seconde-main-neuilly",
    title: "Conciergerie seconde main à Neuilly-sur-Seine",
    metaDescription:
      "Vous habitez à Neuilly ? Seconde vient chez vous, trie et vend vos vêtements de seconde main. Vous touchez 50% de chaque vente. Réponse sous 24h, gratuit.",
    h1: "On vend vos vêtements de seconde main à Neuilly-sur-Seine",
    intro:
      "Vous habitez à Neuilly-sur-Seine et vous voulez vider votre dressing sans effort ? Seconde est une conciergerie de seconde main qui se déplace à domicile pour trier, photographier et vendre vos vêtements à votre place.",
    sections: [
      {
        heading: "Comment ça marche à Neuilly ?",
        paragraphs: [
          "On vient directement chez vous, dans tous les quartiers de Neuilly — du centre-ville aux abords du bois de Boulogne. On trie votre dressing pièce par pièce, on photographie chaque article, on rédige les annonces et on les met en vente sur nos plateformes partenaires (Vinted, Vestiaire Collective...). Vous n'avez rien à gérer.",
        ],
      },
      {
        heading: "Pourquoi choisir Seconde à Neuilly ?",
        paragraphs: [
          "Neuilly est une ville où la qualité des vêtements est souvent élevée : marques premium, pièces de créateurs, vêtements bien entretenus. Notre vendeuse experte sait estimer vos pièces au juste prix pour maximiser vos gains. Avec 50% du prix de vente qui vous revient, vous rentabilisez votre dressing sans lever le petit doigt.",
        ],
      },
      {
        heading: "Ce que vous touchez",
        paragraphs: [
          "Vous percevez 50% du prix de vente de chaque article. 40% revient à votre vendeuse (tri, photos, annonces, expédition) et 10% fait tourner la plateforme. Pas de frais cachés. Le rendez-vous à domicile est facturé de 10 à 50€ selon la formule. Ce qui ne se vend pas vous revient ou part vers nos filières de réemploi.",
        ],
      },
    ],
    jsonLdDescription:
      "Service de conciergerie de seconde main à Neuilly-sur-Seine. On vient chez vous, on trie et on vend vos vêtements. Vous touchez 50% de chaque vente.",
  },
  {
    slug: "conciergerie-seconde-main-boulogne",
    title: "Conciergerie seconde main à Boulogne-Billancourt",
    metaDescription:
      "Vous habitez à Boulogne-Billancourt ? Seconde vient chez vous, trie et vend vos vêtements de seconde main. Vous touchez 50% de chaque vente. Gratuit sous 24h.",
    h1: "On vend vos vêtements de seconde main à Boulogne-Billancourt",
    intro:
      "Vous habitez à Boulogne-Billancourt et votre dressing déborde ? Seconde est une conciergerie de seconde main qui se déplace à domicile pour vendre vos vêtements à votre place.",
    sections: [
      {
        heading: "Comment ça marche à Boulogne ?",
        paragraphs: [
          "On vient chez vous, dans tous les quartiers de Boulogne — du centre-ville aux Rives de Seine. On trie votre dressing, on photographie chaque pièce, on rédige les annonces et on les met en vente sur nos plateformes partenaires. Vous n'avez rien à gérer, vous touchez 50% de chaque vente.",
        ],
      },
      {
        heading: "Pourquoi choisir Seconde à Boulogne-Billancourt ?",
        paragraphs: [
          "Boulogne est une ville dynamique où beaucoup de habitants renouvellent régulièrement leur garde-robe. Plutôt que de jeter ou de laisser dormir vos vêtements, donnez-leur une seconde vie. Notre vendeuse experte se déplace chez vous, évalue vos pièces et s'occupe de toute la revente.",
        ],
      },
      {
        heading: "Ce que vous touchez",
        paragraphs: [
          "50% du prix de vente vous revient. 40% pour votre vendeuse (tri, photos, annonces, expédition) et 10% pour la plateforme. Pas de frais cachés. Le rendez-vous est facturé de 10 à 50€ selon la formule. Les invendus vous reviennent ou partent en réemploi.",
        ],
      },
    ],
    jsonLdDescription:
      "Service de conciergerie de seconde main à Boulogne-Billancourt. On vient chez vous, on trie et on vend vos vêtements. Vous touchez 50% de chaque vente.",
  },
  {
    slug: "conciergerie-seconde-main-levallois",
    title: "Conciergerie seconde main à Levallois-Perret",
    metaDescription:
      "Vous habitez à Levallois ? Seconde vient chez vous, trie et vend vos vêtements de seconde main. Vous touchez 50% de chaque vente. Réponse sous 24h, gratuit.",
    h1: "On vend vos vêtements de seconde main à Levallois-Perret",
    intro:
      "Vous habitez à Levallois-Perret et vous souhaitez vider votre dressing sans effort ? Seconde est une conciergerie de seconde main qui intervient à domicile pour trier, photographier et vendre vos vêtements à votre place.",
    sections: [
      {
        heading: "Comment ça marche à Levallois ?",
        paragraphs: [
          "On se déplace chez vous, partout à Levallois. On trie votre dressing pièce par pièce, on photographie chaque article, on rédige les annonces et on les met en vente sur Vinted, Vestiaire Collective et nos autres plateformes partenaires. Vous n'avez rien à gérer.",
        ],
      },
      {
        heading: "Pourquoi choisir Seconde à Levallois ?",
        paragraphs: [
          "Levallois est une ville compacte et active, où l'espace compte. Libérez votre dressing tout en gagnant de l'argent. Notre vendeuse experte évalue vos pièces au juste prix pour maximiser vos ventes. Avec 50% qui vous revient sur chaque vente, c'est simple et transparent.",
        ],
      },
      {
        heading: "Ce que vous touchez",
        paragraphs: [
          "50% du prix de vente vous revient. 40% pour votre vendeuse et 10% pour la plateforme. Pas de frais cachés. Le rendez-vous à domicile est facturé de 10 à 50€ selon la formule. Les invendus vous reviennent ou partent vers nos filières de réemploi.",
        ],
      },
    ],
    jsonLdDescription:
      "Service de conciergerie de seconde main à Levallois-Perret. On vient chez vous, on trie et on vend vos vêtements. Vous touchez 50% de chaque vente.",
  },
  {
    slug: "conciergerie-seconde-main-montreuil",
    title: "Conciergerie seconde main à Montreuil",
    metaDescription:
      "Vous habitez à Montreuil ? Seconde vient chez vous, trie et vend vos vêtements de seconde main. Vous touchez 50% de chaque vente. Gratuit sous 24h.",
    h1: "On vend vos vêtements de seconde main à Montreuil",
    intro:
      "Vous habitez à Montreuil et votre dressing déborde ? Seconde est une conciergerie de seconde main qui se déplace à domicile pour trier, photographier et vendre vos vêtements à votre place.",
    sections: [
      {
        heading: "Comment ça marche à Montreuil ?",
        paragraphs: [
          "On vient chez vous, dans tous les quartiers de Montreuil — du centre-ville aux Hauts de Montreuil. On trie votre dressing, on photographie chaque pièce, on rédige les annonces et on les met en vente sur nos plateformes partenaires. Vous n'avez rien à gérer, vous touchez 50% de chaque vente.",
        ],
      },
      {
        heading: "Pourquoi choisir Seconde à Montreuil ?",
        paragraphs: [
          "Montreuil est une ville engagée dans l'économie circulaire et la mode responsable. Donner une seconde vie à vos vêtements, c'est parfaitement dans l'air du temps. Notre vendeuse experte se déplace chez vous, évalue vos pièces et s'occupe de toute la revente, sans que vous ayez à bouger.",
        ],
      },
      {
        heading: "Ce que vous touchez",
        paragraphs: [
          "50% du prix de vente vous revient. 40% pour votre vendeuse (tri, photos, annonces, expédition) et 10% pour la plateforme. Pas de frais cachés. Le rendez-vous est facturé de 10 à 50€ selon la formule. Les invendus vous reviennent ou partent en réemploi.",
        ],
      },
    ],
    jsonLdDescription:
      "Service de conciergerie de seconde main à Montreuil. On vient chez vous, on trie et on vend vos vêtements. Vous touchez 50% de chaque vente.",
  },
  {
    slug: "conciergerie-seconde-main-vincennes",
    title: "Conciergerie seconde main à Vincennes",
    metaDescription:
      "Vous habitez à Vincennes ? Seconde vient chez vous, trie et vend vos vêtements de seconde main. Vous touchez 50% de chaque vente. Réponse sous 24h, gratuit.",
    h1: "On vend vos vêtements de seconde main à Vincennes",
    intro:
      "Vous habitez à Vincennes et vous voulez vider votre dressing sans effort ? Seconde est une conciergerie de seconde main qui intervient à domicile pour trier, photographier et vendre vos vêtements à votre place.",
    sections: [
      {
        heading: "Comment ça marche à Vincennes ?",
        paragraphs: [
          "On se déplace chez vous, partout à Vincennes. On trie votre dressing pièce par pièce, on photographie chaque article, on rédige les annonces et on les met en vente sur nos plateformes partenaires. Vous n'avez rien à gérer.",
        ],
      },
      {
        heading: "Pourquoi choisir Seconde à Vincennes ?",
        paragraphs: [
          "Vincennes est une ville où la qualité de vie rime avec qualité des vêtements. Notre vendeuse experte sait valoriser vos pièces, des marques grand public aux marques premium, pour maximiser vos gains. Vous récupérez votre espace et votre temps, tout en gagnant 50% sur chaque vente.",
        ],
      },
      {
        heading: "Ce que vous touchez",
        paragraphs: [
          "50% du prix de vente vous revient. 40% pour votre vendeuse et 10% pour la plateforme. Pas de frais cachés. Le rendez-vous est facturé de 10 à 50€ selon la formule. Les invendus vous reviennent ou partent en réemploi.",
        ],
      },
    ],
    jsonLdDescription:
      "Service de conciergerie de seconde main à Vincennes. On vient chez vous, on trie et on vend vos vêtements. Vous touchez 50% de chaque vente.",
  },
  {
    slug: "conciergerie-seconde-main-courbevoie",
    title: "Conciergerie seconde main à Courbevoie",
    metaDescription:
      "Vous habitez à Courbevoie ? Seconde vient chez vous, trie et vend vos vêtements de seconde main. Vous touchez 50% de chaque vente. Gratuit sous 24h.",
    h1: "On vend vos vêtements de seconde main à Courbevoie",
    intro:
      "Vous habitez à Courbevoie et vous voulez vider votre dressing sans effort ? Seconde est une conciergerie de seconde main qui se déplace à domicile pour trier, photographier et vendre vos vêtements à votre place.",
    sections: [
      {
        heading: "Comment ça marche à Courbevoie ?",
        paragraphs: [
          "On vient chez vous, dans le centre-ville comme à proximité de La Défense. On trie votre dressing, on photographie chaque pièce, on rédige les annonces et on les met en vente sur nos plateformes partenaires. Vous n'avez rien à gérer, vous touchez 50% de chaque vente.",
        ],
      },
      {
        heading: "Pourquoi choisir Seconde à Courbevoie ?",
        paragraphs: [
          "Courbevoie est une ville active à proximité du plus grand quartier d'affaires européen — beaucoup de professionnels qui renouvellent leur garde-robe. Plutôt que de laisser vos vêtements dormir, donnez-leur une seconde vie et gagnez de l'argent sans effort.",
        ],
      },
      {
        heading: "Ce que vous touchez",
        paragraphs: [
          "50% du prix de vente vous revient. 40% pour votre vendeuse (tri, photos, annonces, expédition) et 10% pour la plateforme. Pas de frais cachés. Le rendez-vous est facturé de 10 à 50€ selon la formule. Les invendus vous reviennent ou partent en réemploi.",
        ],
      },
    ],
    jsonLdDescription:
      "Service de conciergerie de seconde main à Courbevoie. On vient chez vous, on trie et on vend vos vêtements. Vous touchez 50% de chaque vente.",
  },
  {
    slug: "conciergerie-seconde-main-issy",
    title: "Conciergerie seconde main à Issy-les-Moulineaux",
    metaDescription:
      "Vous habitez à Issy-les-Moulineaux ? Seconde vient chez vous, trie et vend vos vêtements de seconde main. Vous touchez 50% de chaque vente. Gratuit sous 24h.",
    h1: "On vend vos vêtements de seconde main à Issy-les-Moulineaux",
    intro:
      "Vous habitez à Issy-les-Moulineaux et vous voulez vider votre dressing sans effort ? Seconde est une conciergerie de seconde main qui se déplace à domicile pour trier, photographier et vendre vos vêtements à votre place.",
    sections: [
      {
        heading: "Comment ça marche à Issy-les-Moulineaux ?",
        paragraphs: [
          "On vient chez vous, dans le centre-ville comme aux Rives de Seine. On trie votre dressing, on photographie chaque pièce, on rédige les annonces et on les met en vente sur nos plateformes partenaires. Vous n'avez rien à gérer, vous touchez 50% de chaque vente.",
        ],
      },
      {
        heading: "Pourquoi choisir Seconde à Issy-les-Moulineaux ?",
        paragraphs: [
          "Issy-les-Moulineaux est une ville innovante et éco-responsable, idéale pour donner une seconde vie à vos vêtements. Notre vendeuse experte se déplace chez vous, évalue vos pièces et s'occupe de toute la revente, sans que vous ayez à bouger.",
        ],
      },
      {
        heading: "Ce que vous touchez",
        paragraphs: [
          "50% du prix de vente vous revient. 40% pour votre vendeuse (tri, photos, annonces, expédition) et 10% pour la plateforme. Pas de frais cachés. Le rendez-vous est facturé de 10 à 50€ selon la formule. Les invendus vous reviennent ou partent en réemploi.",
        ],
      },
    ],
    jsonLdDescription:
      "Service de conciergerie de seconde main à Issy-les-Moulineaux. On vient chez vous, on trie et on vend vos vêtements. Vous touchez 50% de chaque vente.",
  },
  {
    slug: "conciergerie-seconde-main-saint-denis",
    title: "Conciergerie seconde main à Saint-Denis",
    metaDescription:
      "Vous habitez à Saint-Denis ? Seconde vient chez vous, trie et vend vos vêtements de seconde main. Vous touchez 50% de chaque vente. Gratuit sous 24h.",
    h1: "On vend vos vêtements de seconde main à Saint-Denis",
    intro:
      "Vous habitez à Saint-Denis et vous voulez vider votre dressing sans effort ? Seconde est une conciergerie de seconde main qui se déplace à domicile pour trier, photographier et vendre vos vêtements à votre place.",
    sections: [
      {
        heading: "Comment ça marche à Saint-Denis ?",
        paragraphs: [
          "On vient chez vous, dans le centre-ville comme à proximité du Stade de France. On trie votre dressing, on photographie chaque pièce, on rédige les annonces et on les met en vente sur nos plateformes partenaires. Vous n'avez rien à gérer, vous touchez 50% de chaque vente.",
        ],
      },
      {
        heading: "Pourquoi choisir Seconde à Saint-Denis ?",
        paragraphs: [
          "Saint-Denis est une ville dense et jeune, où la seconde main a tout son sens. Donner une seconde vie à vos vêtements, c'est utile pour la planète et bon pour votre portefeuille. Notre vendeuse experte se déplace chez vous et s'occupe de toute la revente.",
        ],
      },
      {
        heading: "Ce que vous touchez",
        paragraphs: [
          "50% du prix de vente vous revient. 40% pour votre vendeuse (tri, photos, annonces, expédition) et 10% pour la plateforme. Pas de frais cachés. Le rendez-vous est facturé de 10 à 50€ selon la formule. Les invendus vous reviennent ou partent en réemploi.",
        ],
      },
    ],
    jsonLdDescription:
      "Service de conciergerie de seconde main à Saint-Denis. On vient chez vous, on trie et on vend vos vêtements. Vous touchez 50% de chaque vente.",
  },
  {
    slug: "conciergerie-seconde-main-creteil",
    title: "Conciergerie seconde main à Créteil",
    metaDescription:
      "Vous habitez à Créteil ? Seconde vient chez vous, trie et vend vos vêtements de seconde main. Vous touchez 50% de chaque vente. Gratuit sous 24h.",
    h1: "On vend vos vêtements de seconde main à Créteil",
    intro:
      "Vous habitez à Créteil et vous voulez vider votre dressing sans effort ? Seconde est une conciergerie de seconde main qui se déplace à domicile pour trier, photographier et vendre vos vêtements à votre place.",
    sections: [
      {
        heading: "Comment ça marche à Créteil ?",
        paragraphs: [
          "On vient chez vous, dans le centre-ville comme aux abords du Lac de Créteil. On trie votre dressing, on photographie chaque pièce, on rédige les annonces et on les met en vente sur nos plateformes partenaires. Vous n'avez rien à gérer, vous touchez 50% de chaque vente.",
        ],
      },
      {
        heading: "Pourquoi choisir Seconde à Créteil ?",
        paragraphs: [
          "Créteil, préfecture du Val-de-Marne, compte de nombreux habitants qui peuvent libérer leur dressing. Plutôt que de laisser vos vêtements dormir, donnez-leur une seconde vie et gagnez de l'argent sans effort. Notre vendeuse experte se déplace chez vous et s'occupe de toute la revente.",
        ],
      },
      {
        heading: "Ce que vous touchez",
        paragraphs: [
          "50% du prix de vente vous revient. 40% pour votre vendeuse (tri, photos, annonces, expédition) et 10% pour la plateforme. Pas de frais cachés. Le rendez-vous est facturé de 10 à 50€ selon la formule. Les invendus vous reviennent ou partent en réemploi.",
        ],
      },
    ],
    jsonLdDescription:
      "Service de conciergerie de seconde main à Créteil. On vient chez vous, on trie et on vend vos vêtements. Vous touchez 50% de chaque vente.",
  },
];

export function getCity(slug: string): CityData | undefined {
  return cities.find((city) => city.slug === slug);
}

export function getCityLabel(slug: string): string {
  const city = getCity(slug);
  if (!city) return slug;
  const titleMatch = city.title.match(/à\s+(.+)$/);
  return titleMatch ? titleMatch[1] : slug;
}
