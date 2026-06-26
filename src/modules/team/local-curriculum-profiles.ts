import type { TeamRole } from "./types";

export type LocalCurriculumProfile = {
  name: string;
  aliases?: string[];
  role: TeamRole;
  area: string;
  document?: string;
  formation?: string;
  courses?: string;
  actingTime?: string;
  experience?: string;
  works?: string;
  additionalInfo?: string;
  cityState?: string;
  rosterNotes?: string;
};

const localCurriculumProfiles: LocalCurriculumProfile[] = [
  {
    name: "Marcel Eduardo Cabeça Domingues",
    aliases: ["Marcel Eduardo Cabeça", "Marcel Domingues"],
    role: "Diretor geral",
    area: "Artes cênicas - ator, diretor, formador e produtor cultural",
    document: "59.053.899/0001-53",
    formation:
      "Formação contínua em teatro, voz, dramaturgia e artes cênicas; inclui Bolsa Cultural em teatro, curso de voz e ação vocal, direção de fotografia/luz e bacharelado em Teatro em andamento.",
    actingTime: "10 anos, desde 2016",
    experience:
      "Ator, diretor e produtor cultural desde 2017, fundador da Companhia de Artes Viva. Atua em espetáculos teatrais, musicais, cordel teatral e teatro de rua, com ênfase em dramaturgia alegórica, clown e formação de iniciantes.",
    works:
      "Reféns; Cordel Mexicano; Milagres e Charlatões; Milagres; A Ida ao Teatro; Apocalipse - O Musical; Limpe o Palco, Apague as Luzes; figurante em A Primeira Música.",
    additionalInfo:
      "Desenvolve espetáculos com foco em esperança, transformação e crítica social, com atuação forte em oficinas e na cena cultural de Jaraguá do Sul.",
    cityState: "Jaraguá do Sul/SC",
    rosterNotes: "Direção geral e liderança artística do projeto.",
  },
  {
    name: "Suzi Daiane",
    role: "Intérprete de Libras",
    area: "Atriz, palhaça, diretora, professora, intérprete de LIBRAS e audiodescritora",
    formation:
      "Mestrado em Artes Cênicas; pós-graduação em Contação de Histórias e Literatura; pós-graduação em Línguas Modernas; graduação em Letras; DRT-SC 6232/10.",
    actingTime: "16 anos, desde 2010",
    experience:
      "Atriz, palhaça, diretora, professora e produtora cultural com forte atuação em teatro acessível e inclusão. Trabalha com LIBRAS, audiodescrição e formação de atores em diferentes companhias e projetos.",
    works:
      "Oficinas de teatro, palhaçaria e acessibilidade; espetáculos bilíngues da La Luna Cia de Teatro; palhaçaria em diversos espetáculos; assessoria de acessibilidade em projetos culturais.",
    additionalInfo:
      "Especialista em acessibilidade teatral e em democratização do acesso à arte para públicos surdos e com deficiência visual.",
    cityState: "Jaraguá do Sul/SC",
    rosterNotes: "Acessibilidade comunicacional e intérprete de LIBRAS.",
  },
  {
    name: "Katiana de Souza Coelho",
    role: "Preparador vocal",
    area: "Música - professora de canto, preparadora vocal, tecladista e arranjadora",
    formation:
      "Licenciatura em Música pela UFPE; pós-graduação em Metodologia do Ensino da Música; bacharelado em Fonoaudiologia em andamento.",
    actingTime: "Mais de 18 anos",
    experience:
      "Professora de canto, preparadora vocal e tecladista com experiência em formação vocal, coral e teatro musical. Atuou no Conservatório Pernambucano de Música e hoje dirige o espaço Voz em Foco.",
    works:
      "Preparadora vocal e professora de teoria musical no Coro Sinfônico da SCAR; preparação vocal na turnê de 50 anos do Coral da SCAR; convite no FEMUSC 2025; atuação como arranjadora, produtora musical e tecladista.",
    additionalInfo:
      "Especialista em técnica vocal, respiração e preparação para canto em teatro musical e coral.",
    cityState: "Jaraguá do Sul/SC",
    rosterNotes: "Preparação vocal e acompanhamento musical.",
  },
  {
    name: "Bruna Lazzarotto",
    aliases: ["Bruna Lazarotto"],
    role: "Ator",
    area: "Teatro - atriz e cantora",
    actingTime: "2 anos",
    experience:
      "Estudante e atriz com atuação em teatro e teatro musical, incluindo cantatas de Natal e Páscoa.",
    works: "Especial de Páscoa; Musical Princípios; O Cortiço; Cantata de Páscoa; Fim.",
    additionalInfo: "Cantora, musicista e atriz de teatro e musical.",
    cityState: "Jaraguá do Sul/SC",
    rosterNotes: "Elenco cênico e musical.",
  },
  {
    name: "Jones André Alves Pereira",
    role: "Técnico de som",
    area: "Técnico de som",
    actingTime: "10 anos",
    experience:
      "Técnico de sonorização e iluminação na SCAR entre 2014 e 2019, com atuação em espetáculos, mostras, eventos corporativos e projetos culturais.",
    works: "Turnês POP; Memórias; Brasilíssima; Diálogos; FEMUSC de 2015 a 2025.",
    additionalInfo:
      "Também atua como monitor e técnico de PA, com experiência em mixagem e masterização para orquestra filarmônica.",
    cityState: "Jaraguá do Sul/SC",
    rosterNotes: "Sonorização e apoio técnico de palco.",
  },
  {
    name: "André Felipe de Mila Brito",
    aliases: ["André Brito"],
    role: "Fotógrafo",
    area: "Fotografia profissional",
    actingTime: "8 anos",
    experience:
      "Atuante em produção de vídeo, streaming de eventos e gestão de equipe técnica.",
    works: "Produção audiovisual e cobertura técnica de eventos.",
    additionalInfo: "Gestão de equipe técnica e apoio a produções audiovisuais.",
    cityState: "Jaraguá do Sul/SC",
    rosterNotes: "Fotografia, vídeo e streaming.",
  },
  {
    name: "Renaldo Boddemberg",
    role: "Ator",
    area: "Ator",
    actingTime: "5 anos",
    experience:
      "Ator do grupo de teatro municipal de Jaraguá do Sul desde 2023, com atuação em projetos formativos e de criação teatral.",
    works: "Bilhetinhos da Professora Adda; Milagres e Charlatões.",
    additionalInfo:
      "Participa de formação em teatro técnico por meio do Bolsa Cultural da Prefeitura de Jaraguá do Sul.",
    cityState: "Jaraguá do Sul/SC",
    rosterNotes: "Elenco cênico.",
  },
  {
    name: "Wemerson Gonçalves da Silva",
    aliases: ["Wemerson Gonçalves"],
    role: "Ator",
    area: "Ator",
    formation: "Psicologia, 2025.",
    actingTime: "2 anos",
    experience:
      "Participou do Teatro Básico pelo Bolsa Cultural em 2025 e do Teatro Intermediário em 2026.",
    works: "Assistente em Cordel Mexicano; Cordel de Saias.",
    additionalInfo: "Atua por meio do Bolsa Cultural de Jaraguá do Sul.",
    cityState: "Jaraguá do Sul/SC",
    rosterNotes: "Elenco cênico.",
  },
  {
    name: "Julia Titz",
    role: "Ator",
    area: "Atriz",
    formation: "Psicologia, 2026.",
    actingTime: "Desde 2013",
    experience:
      "Atriz desde 2013, com cursos na SCAR e atuação atual em teatro e expressão corporal no Bolsa Cultural.",
    works: "Cordel Mexicano; Cordel de Saias.",
    additionalInfo:
      "Possui trajetória como atriz com formação complementar e participação contínua em projetos culturais do município.",
    cityState: "Jaraguá do Sul/SC",
    rosterNotes: "Elenco cênico.",
  },
  {
    name: "Karim Kamada",
    aliases: ["Karin Kamada", "Karin", "Karim"],
    role: "Ator",
    area: "Atriz e modelo 50+, em formação cênica",
    formation:
      "Estudante de teatro na SCAR e no SECEL; pós-graduação em Educação Física; professora de Educação Física em atividade.",
    actingTime: "3 anos",
    experience: "Atriz e modelo com presença cênica marcada por autenticidade e maturidade.",
    works:
      "O Menino Narigudo; curta Treze de Julho; campanhas publicitárias da Azaleia e de Arnaldo Ventura / Eivvi.",
    additionalInfo:
      "Representa mulheres reais, com força, sensibilidade e vivência nas interpretações.",
    cityState: "Jaraguá do Sul/SC",
    rosterNotes: "Elenco cênico.",
  },
  {
    name: "Kaique Varela Zalusck",
    aliases: ["Kaique Varela Zalusk"],
    role: "Produtor executivo",
    area: "Produção executiva, planejamento e comunicação",
    actingTime: "4 anos",
    experience:
      "Profissional de produção cultural com atuação em planejamento, orçamento, comunicação e estruturação de projetos incentivados.",
    works:
      "Orquestra Filarmônica de Jaraguá do Sul; FEMUSC; Projeto Mais Dança.",
    additionalInfo:
      "Atuação em produção e organização, coordenação de equipes, planejamento estratégico, comunicação institucional e gestão de eventos.",
    cityState: "Jaraguá do Sul/SC",
    rosterNotes: "Produção executiva e organização.",
  },
  {
    name: "Alexandre Mila Brito",
    role: "Técnico de iluminação",
    area: "Iluminador de espetáculos teatrais e shows nacionais",
    actingTime: "4 anos",
    experience:
      "Iluminador de eventos corporativos e técnico em montagem de iluminação para espetáculos e shows.",
    works: "Iluminação dupla Jefferson e Suellen; turnês de shows nacionais.",
    additionalInfo: "Gestão de eventos e apoio técnico em tours.",
    cityState: "Jaraguá do Sul/SC",
    rosterNotes: "Iluminação de palco e eventos.",
  },
  {
    name: "Mariane Santos de Lima",
    role: "Produtor executivo",
    area: "Produção cultural, comunicação institucional e gestão comercial",
    actingTime: "Desde 2023",
    experience:
      "Profissional com formação em comunicação, gestão comercial e administração com marketing, unindo planejamento, produção cultural e gestão institucional.",
    works: "Produtora do projeto Na Quebrada; apoio à produção cultural; gestão comercial na SCAR.",
    additionalInfo:
      "Atua na articulação institucional e na realização de ações culturais e projetos da SCAR.",
    cityState: "Jaraguá do Sul/SC",
    rosterNotes: "Produção e gestão comercial.",
  },
  {
    name: "Bruno Antunes",
    aliases: ["Bruno"],
    role: "Ator",
    area: "Ator iniciante",
    actingTime: "Iniciante",
    experience:
      "Ator iniciante em processo de formação prática, com foco em expressão corporal, interpretação, presença cênica, escuta e trabalho coletivo.",
    works: "Participação no projeto teatral em desenvolvimento; Princípios (2025); Auto de Páscoa (2026).",
    additionalInfo:
      "Integrante em fase inicial de formação artística e de criação teatral.",
    cityState: "Jaraguá do Sul/SC",
    rosterNotes: "Elenco cênico iniciante.",
  },
  {
    name: "Cassius András Goetzke Venera",
    aliases: ["Cassius Venera", "Cassius Andréas Goetzke Venera"],
    role: "Técnico de iluminação",
    area: "Iluminação cênica e técnica de eventos",
    actingTime: "Desde 2022",
    experience:
      "Atuou como auxiliar técnico na SCAR e como técnico de iluminação em eventos corporativos, festivais, mostras teatrais e espetáculos orquestrais.",
    works:
      "FEMUSC 2023; Weg Partners 2023; Malwee 2023; Festival da Canção 2023; Jaraguá em Dança 2023 a 2025; Mostra Teatral SCAR 2023/2025; Sons do Brasil 2024; Flipomerode 2024; Auto de Natal da SCAR 2023.",
    additionalInfo:
      "Também atua em stand-ups, conferências e eventos particulares como técnico de iluminação e light designer.",
    cityState: "Jaraguá do Sul/SC",
    rosterNotes: "Técnica de luz e suporte de palco.",
  },
  {
    name: "Nicolas Cani",
    role: "Fotógrafo",
    area: "Audiovisual e fotografia",
    formation: "Design pela Faculdade Católica de Jaraguá do Sul, concluído em 2022.",
    actingTime: "4 anos e meio",
    experience:
      "Atua com audiovisual e fotografia em espetáculos de dança, música e teatro, além de transmissões ao vivo e captação de imagem.",
    works:
      "FEMUSC; Jaraguá em Dança; Festival da Canção; projetos Música para Todos, Mais Dança, Orquestra Filarmônica e Orquestra Jovem.",
    additionalInfo:
      "Trabalha com fotos para projetos da SCAR e cobertura audiovisual de diferentes espetáculos.",
    cityState: "Jaraguá do Sul/SC",
    rosterNotes: "Fotografia e audiovisual.",
  },
  {
    name: "Alexya Telles",
    role: "Ator",
    area: "Elenco cênico do espetáculo Reféns",
    experience: "Integrante listado na ficha técnica do projeto enviado.",
    works: "Palhaço Vermelho em Reféns.",
    additionalInfo:
      "Os arquivos enviados não trazem currículo detalhado, apenas a participação na ficha técnica.",
    cityState: "Jaraguá do Sul/SC",
    rosterNotes: "Participação em ficha técnica.",
  },
  {
    name: "Sonia da Luz Pessoa",
    role: "Ator",
    area: "Elenco cênico do espetáculo Reféns",
    experience: "Integrante listado na ficha técnica do projeto enviado.",
    works: "Magnólia em Reféns.",
    additionalInfo:
      "Os arquivos enviados não trazem currículo detalhado, apenas a participação na ficha técnica.",
    cityState: "Jaraguá do Sul/SC",
    rosterNotes: "Participação em ficha técnica.",
  },
  {
    name: "Eduardo Cabeça",
    aliases: ["Eduardo"],
    role: "Ator",
    area: "Elenco cênico do espetáculo Reféns",
    experience: "Integrante listado na ficha técnica do projeto enviado.",
    works: "Rei em Reféns.",
    additionalInfo:
      "Os arquivos enviados não trazem currículo detalhado, apenas a participação na ficha técnica.",
    cityState: "Jaraguá do Sul/SC",
    rosterNotes: "Participação em ficha técnica.",
  },
];

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const profileIndex = new Map<string, LocalCurriculumProfile>();

for (const profile of localCurriculumProfiles) {
  profileIndex.set(normalizeName(profile.name), profile);

  for (const alias of profile.aliases ?? []) {
    profileIndex.set(normalizeName(alias), profile);
  }
}

export function getLocalCurriculumProfile(name: string) {
  return profileIndex.get(normalizeName(name));
}

export function listLocalCurriculumProfiles() {
  return localCurriculumProfiles.slice();
}
