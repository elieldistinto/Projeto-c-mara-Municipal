// Dados de pontos de interesse - APENAS PONTOS COM IMAGENS COMPLETAS
const MAP_CENTER = {
  lat: 40.1369,
  lng: -7.4995,
  zoom: 16,
};

// Lista de pontos de interesse - Apenas pontos que possuem todas as imagens (Before, After, Anime)
const FUNDAO_POINTS = [
  {
    id: "camara-municipal",
    name: "Câmara Municipal do Fundão",
    category: "Edifício Público",
    lat: 40.1383,
    lng: -7.5011,
    shortDescription: "Edifício onde funciona o executivo municipal e os principais serviços da autarquia.",
    description: "A Câmara Municipal do Fundão, situada na Praça do Município, é o principal polo de decisão política e administrativa do concelho. O edifício é um marco na paisagem urbana da cidade.",
    curiosities: [
      "Edifício associado a decisões estruturantes para o desenvolvimento do concelho.",
      "Referência visual na frente urbana da praça.",
      "Arquitetura que combina elementos tradicionais e modernos."
    ],
    beforeImage: "images/before/camaramunicipalbefore.png",
    afterImage: "images/after/camaramunicipalafter.jpg",
    animeImage: "images/anime/camaramunicipalanime.png",
    tags: ["administração", "governação", "património"],
  },
  {
    id: "casino-fundanense",
    name: "Casino Fundanense",
    category: "Edifício Histórico",
    lat: 40.1409,
    lng: -7.5014,
    shortDescription: "Antigo espaço cultural e social da cidade, com forte presença na memória coletiva do Fundão.",
    description: "O Casino Fundanense foi, durante décadas, um ponto de encontro para eventos culturais, bailes e convívios. Hoje, a sua envolvente continua a ser um espaço central na vivência urbana do Fundão.",
    curiosities: [
      "Local associado a eventos culturais e recreativos ao longo do século XX.",
      "Integra a paisagem urbana da zona central do Fundão.",
      "Arquitetura emblemática da cidade."
    ],
    beforeImage: "images/before/casinofundanensebefore.png",
    afterImage: "images/after/casinofundanenseafter.jpg",
    animeImage: "images/anime/casinofundanenseanime.png",
    tags: ["história", "cultura", "património"],
  },
  {
    id: "escola-primaria-das-tilias",
    name: "Escola Primária das Tílias",
    category: "Património Educacional",
    lat: 40.1404,
    lng: -7.5019,
    shortDescription: "Antiga escola primária, parte importante da memória educacional do Fundão.",
    description: "A Escola Primária das Tílias representa um marco na história da educação no concelho, tendo formado gerações de fundanenses.",
    curiosities: [
      "Edifício com valor arquitetónico e histórico.",
      "Parte da memória coletiva da cidade.",
      "Atualmente integra o património cultural local."
    ],
    beforeImage: "images/before/escoladastiliasbefore.png",
    afterImage: "images/after/escoladastiliasafter.png",
    animeImage: "images/anime/escoladastiliasanime.png",
    tags: ["educação", "património", "história"],
  },
  {
    id: "edificio-ferreiras-chafariz",
    name: "Edifício dos Ferreiras e Chafariz dos Golfinhos",
    category: "Património Histórico",
    lat: 40.1395,
    lng: -7.5005,
    shortDescription: "Conjunto arquitetónico com o emblemático Chafariz dos Golfinhos.",
    description: "O Edifício dos Ferreiras e o Chafariz dos Golfinhos formam um conjunto patrimonial de grande valor para a cidade, representando a história e a arte local.",
    curiosities: [
      "O Chafariz dos Golfinhos é um dos símbolos da cidade.",
      "Arquitetura singular que merece ser preservada.",
      "Ponto de referência no centro histórico."
    ],
    beforeImage: "images/before/chafarisdosgolfinhosbefore.png",
    afterImage: "images/after/chafarisdosgolfinhosafter.png",
    animeImage: "images/anime/chafarisdosgolfinhosanime.png",
    tags: ["património", "história", "arte"],
  },
  {
    id: "parque-das-tilias",
    name: "Parque das Tílias",
    category: "Espaço Verde",
    lat: 40.1390,
    lng: -7.5020,
    shortDescription: "Parque urbano com áreas de lazer e convívio.",
    description: "O Parque das Tílias é um espaço verde muito apreciado pelos moradores, ideal para passeios, atividades ao ar livre e momentos de descanso.",
    curiosities: [
      "Espaço verde no coração da cidade.",
      "Ideal para atividades de lazer e convívio.",
      "Arborização diversificada e bem cuidada."
    ],
    beforeImage: "images/before/parquedastiliasbefore.png",
    afterImage: "images/after/parquedastiliasafter.png",
    animeImage: "images/anime/parquedastiliasanime.png",
    tags: ["natureza", "lazer", "parque"],
  }
];

// Definição de percursos de exemplo
const FUNDAO_ROUTES = [
  {
    id: "rota-casino-centro",
    name: "Rota: Chegada ao Casino",
    description: "Percurso que simula a chegada ao Casino Fundanense, passando por pontos estratégicos na envolvente.",
    color: "#ff6ad5",
    coordinates: [
      [40.1400, -7.5030],
      [40.1404, -7.5024],
      [40.1407, -7.5019],
      [40.1409, -7.5014],
    ],
  },
  {
    id: "rota-casino-jardim",
    name: "Rota: Casino e Jardim Envolvente",
    description: "Ligação entre o edifício do Casino e a zona de jardim envolvente, sugerindo um passeio pedonal.",
    color: "#7cf8ff",
    coordinates: [
      [40.1409, -7.5014],
      [40.1411, -7.5011],
      [40.1414, -7.5009],
    ],
  },
  {
    id: "rota-centro-historico",
    name: "Rota: Centro Histórico",
    description: "Percurso que liga o Casino Fundanense, a Praça do Município e a Igreja Matriz, sugerindo uma leitura do centro histórico.",
    color: "#f97316",
    coordinates: [
      [40.1409, -7.5014],
      [40.1395, -7.5012],
      [40.1385, -7.5010],
      [40.1383, -7.5011],
      [40.1378, -7.5005],
    ],
  },
  {
    id: "rota-patrimonio",
    name: "Rota: Património Histórico",
    description: "Percurso pelos principais pontos de património histórico da cidade.",
    color: "#22c55e",
    coordinates: [
      [40.1383, -7.5011],
      [40.1395, -7.5005],
      [40.1409, -7.5014],
    ],
  },
  {
    id: "rota-verde",
    name: "Rota: Ligação ao Parque Verde",
    description: "Trajeto pedonal sugerido entre o centro urbano e o Parque Verde do Fundão.",
    color: "#22c55e",
    coordinates: [
      [40.1382, -7.5010],
      [40.1375, -7.5000],
      [40.1368, -7.4990],
      [40.1355, -7.4975],
    ],
  }
];