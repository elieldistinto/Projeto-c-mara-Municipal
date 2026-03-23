// Dados de pontos de interesse e percursos para o mapa do Fundão.
// Substitui coordenadas, descrições e caminhos das imagens conforme necessário.

// Coordenadas aproximadas da zona central do Fundão (perto da Praça do Município).
const MAP_CENTER = {
  lat: 40.1369,
  lng: -7.4995,
  zoom: 16,
};

// Lista de pontos de interesse.
// Para cada ponto, podes:
//  - Ajustar as coordenadas (lat/lng)
//  - Alterar a descrição e curiosidades
//  - Atualizar os caminhos das imagens "before" e "after"
//  - Associar também imagens em estilo anime (animeImage)
const FUNDAO_POINTS = [
  {
    id: "casino-fundanense",
    name: "Casino Fundanense",
    category: "Edifício Histórico",
    lat: 40.1409,
    lng: -7.5014,
    shortDescription:
      "Antigo espaço cultural e social da cidade, com forte presença na memória coletiva do Fundão.",
    description:
      "O Casino Fundanense foi, durante décadas, um ponto de encontro para eventos culturais, bailes e convívios. Hoje, a sua envolvente continua a ser um espaço central na vivência urbana do Fundão.",
    curiosities: [
      "Local associado a eventos culturais e recreativos ao longo do século XX.",
      "Integra a paisagem urbana da zona central do Fundão.",
    ],
    // Já existem ficheiros na pasta do projeto com estes nomes.
    beforeImage: "images/before/Casino_Fundanense.original.jpg",
    afterImage: "images/after/Casino_Fundanense.original.jpg",
    animeImage: "images/anime-style/casino-anime.jpg",
    tags: ["história", "cultura", "património"],
  },
  {
    id: "jardim-envolvente",
    name: "Jardim Envolvente",
    category: "Espaço Público",
    lat: 40.1414,
    lng: -7.5009,
    shortDescription:
      "Zona verde junto ao Casino Fundanense, ideal para passeios e encontros informais.",
    description:
      "Este espaço ajardinado enquadra a zona do Casino e serve como transição entre o edificado e as áreas de circulação pedonal. É um local de pausa, conversa e fruição da paisagem urbana.",
    curiosities: [
      "Frequentemente utilizado como ponto de passagem em percursos pedonais no centro.",
      "Possibilidade de integração de eventos culturais ao ar livre.",
    ],
    // Usa o ficheiro existente na pasta images/after (antes continua no set atual)
    beforeImage: "images/before/3231758168.png",
    afterImage: "images/after/jardin publico.png",
    animeImage: "images/anime-style/garden-anime.jpg",
    tags: ["espaço verde", "lazer"],
  },
  {
    id: "acesso-principal",
    name: "Acesso Principal",
    category: "Percurso Urbano",
    lat: 40.1404,
    lng: -7.5019,
    shortDescription:
      "Ligação pedonal que faz a transição entre a malha urbana envolvente e o Casino.",
    description:
      "Este percurso marca a chegada ao Casino Fundanense, articulando ruas adjacentes com o acesso principal ao edifício e à sua envolvente.",
    curiosities: [
      "Importante eixo de chegada para quem visita a zona.",
      "Possível de ser realçado com iluminação, mobiliário urbano e arte pública.",
    ],
    beforeImage: "images/before/7451884168.png",
    afterImage: "images/after/rua_das_tilias.png",
    animeImage: "images/anime-style/access-anime.jpg",
    tags: ["mobilidade", "acessos"],
  },
  {
    id: "praca-municipio",
    name: "Praça do Município",
    category: "Praça / Centro Urbano",
    lat: 40.1382,
    lng: -7.5010,
    shortDescription:
      "Praça central da cidade, onde se localiza a Câmara Municipal do Fundão.",
    description:
      "A Praça do Município é o coração administrativo e simbólico do Fundão. Aqui concentram-se serviços, eventos oficiais e momentos de encontro da comunidade.",
    curiosities: [
      "Frequentemente utilizada para cerimónias oficiais e comemorações públicas.",
      "Ponto de partida ideal para percursos pedonais pelo centro histórico.",
    ],
    beforeImage: "images/before/8993829168.jpg",
    afterImage: "images/after/camara_municipal.png",
    animeImage: "images/anime-style/praca-municipio-anime.jpg",
    tags: ["centro", "administração", "vida urbana"],
  },
  {
    id: "camara-municipal",
    name: "Câmara Municipal do Fundão",
    category: "Edifício Público",
    lat: 40.1383,
    lng: -7.5011,
    shortDescription:
      "Edifício onde funciona o executivo municipal e os principais serviços da autarquia.",
    description:
      "A Câmara Municipal do Fundão, situada na Praça do Município, é o principal polo de decisão política e administrativa do concelho.",
    curiosities: [
      "Edifício associado a decisões estruturantes para o desenvolvimento do concelho.",
      "Referência visual na frente urbana da praça.",
    ],
    beforeImage: "images/before/Camara_Municipal_do_Fundão.jpg",
    afterImage: "images/after/Camara_Municipal_do_Fundão.jpg",
    animeImage: "images/anime-style/camara-anime.jpg",
    tags: ["administração", "governação"],
  },
  {
    id: "igreja-matriz",
    name: "Igreja Matriz do Fundão",
    category: "Património Religioso",
    lat: 40.1375,
    lng: -7.5000,
    shortDescription:
      "Templo de referência na paisagem urbana, ligado à história religiosa do Fundão.",
    description:
      "A Igreja Matriz do Fundão é um marco histórico e arquitetónico, integrando elementos tradicionais e assumindo um papel central nas celebrações religiosas da comunidade.",
    curiosities: [
      "Espaço associado a festividades locais e procissões.",
      "Possui enquadramento urbano característico com ligação às ruas históricas.",
    ],
    beforeImage: "images/before/6365877168.png",
    afterImage: "images/after/4184838168.png",
    animeImage: "images/anime-style/igreja-anime.jpg",
    tags: ["património", "religioso", "história"],
  },
  {
    id: "parque-verde",
    name: "Parque Verde do Fundão",
    category: "Parque Urbano",
    lat: 40.1355,
    lng: -7.4975,
    shortDescription:
      "Grande espaço verde para lazer, prática desportiva e contacto com a natureza.",
    description:
      "O Parque Verde do Fundão oferece percursos pedonais, zonas de estar e áreas de recreio, funcionando como pulmão verde da cidade e espaço de convívio intergeracional.",
    curiosities: [
      "Ideal para caminhadas, corrida e atividades ao ar livre.",
      "Potencial para instalação de arte pública e eventos culturais.",
    ],
    beforeImage: "images/before/9256572168.png",
    afterImage: "images/after/parque .png",
    animeImage: "images/anime-style/parque-verde-anime.jpg",
    tags: ["natureza", "lazer", "desporto"],
  },
  {
    id: "estacao-cp",
    name: "Estação de Caminhos de Ferro do Fundão",
    category: "Mobilidade / Transporte",
    lat: 40.1418,
    lng: -7.4970,
    shortDescription:
      "Ponto de acesso ferroviário à cidade, ligando o Fundão a outras regiões.",
    description:
      "A estação ferroviária do Fundão é um nó importante na rede de transportes, suportando deslocações diárias e viagens ocasionais, com impacto na mobilidade do concelho.",
    curiosities: [
      "Ligação histórica às dinâmicas económicas e sociais da região.",
      "Possível ponto de partida para percursos pedonais em direção ao centro.",
    ],
    beforeImage: "images/before/6745695168.jpg",
    afterImage: "images/after/edificio continario.jpg",
    animeImage: "images/anime-style/estacao-anime.jpg",
    tags: ["transportes", "mobilidade"],
  },
  {
    id: "piscinas-municipais",
    name: "Piscinas Municipais",
    category: "Equipamento Desportivo",
    lat: 40.1392,
    lng: -7.4965,
    shortDescription:
      "Complexo de piscinas utilizado para lazer, formação e prática desportiva.",
    description:
      "As Piscinas Municipais do Fundão acolhem atividades de natação, hidroginástica e eventos desportivos, sendo um ponto de encontro para a comunidade local.",
    curiosities: [
      "Inclui áreas interiores e/ou exteriores, dependendo da configuração local.",
      "Frequentemente associadas a programas de promoção de saúde e bem-estar.",
    ],
    beforeImage: "images/before/7773889168.png",
    afterImage: "images/after/14 (1).png",
    animeImage: "images/anime-style/piscinas-anime.jpg",
    tags: ["desporto", "saúde", "lazer"],
  },
  {
    id: "pavilhao-multiusos",
    name: "Pavilhão / Espaço Multiusos",
    category: "Equipamento Cultural e Desportivo",
    lat: 40.1388,
    lng: -7.4985,
    shortDescription:
      "Infraestrutura vocacionada para eventos desportivos, culturais e feiras.",
    description:
      "O pavilhão ou espaço multiusos do Fundão permite acolher competições, concertos, feiras e outras iniciativas, contribuindo para a dinamização da cidade.",
    curiosities: [
      "Espaço versátil que pode ser adaptado a diferentes tipos de eventos.",
      "Potencial de articulação com outros pontos da cidade através de percursos temáticos.",
    ],
    beforeImage:
      "images/before/17-novo-quartel-bombeiros-fundao-maquete11-scaled.jpg",
    afterImage: "images/after/Antigo_quartel_dos_bombeiros.png",
    animeImage: "images/anime-style/pavilhao-anime.jpg",
    tags: ["eventos", "cultura", "desporto"],
  },
];

// Definição de percursos de exemplo.
// Cada percurso é composto por uma lista de coordenadas (lat/lng) que definem a linha no mapa.
// Podes adaptar estes percursos às tuas rotas reais.
const FUNDAO_ROUTES = [
  {
    id: "rota-casino-centro",
    name: "Rota: Chegada ao Casino",
    description:
      "Percurso que simula a chegada ao Casino Fundanense, passando por pontos estratégicos na envolvente.",
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
    description:
      "Ligação entre o edifício do Casino e a zona de jardim envolvente, sugerindo um passeio pedonal.",
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
    description:
      "Percurso que liga o Casino Fundanense, a Praça do Município e a Igreja Matriz, sugerindo uma leitura do centro histórico.",
    color: "#f97316",
    coordinates: [
      [40.1409, -7.5014], // Casino
      [40.1395, -7.5012],
      [40.1385, -7.5010], // Praça / Câmara
      [40.1378, -7.5005],
      [40.1375, -7.5000], // Igreja Matriz
    ],
  },
  {
    id: "rota-verde",
    name: "Rota: Ligação ao Parque Verde",
    description:
      "Trajeto pedonal sugerido entre o centro urbano e o Parque Verde do Fundão.",
    color: "#22c55e",
    coordinates: [
      [40.1382, -7.5010], // Praça
      [40.1375, -7.5000], // Igreja Matriz (passagem)
      [40.1368, -7.4990],
      [40.1355, -7.4975], // Parque Verde
    ],
  },
  {
    id: "rota-mobilidade",
    name: "Rota: Estação - Centro",
    description:
      "Rota que liga a Estação de Caminhos de Ferro ao centro da cidade, passando por zonas de interesse urbano.",
    color: "#a855f7",
    coordinates: [
      [40.1418, -7.4970], // Estação
      [40.1410, -7.4980],
      [40.1402, -7.4992],
      [40.1392, -7.5005],
      [40.1382, -7.5010], // Praça do Município
    ],
  },
];

