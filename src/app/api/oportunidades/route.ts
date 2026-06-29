export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const baseDemo = [
  {
    id: "op1",
    title: "Edital Meu Primeiro Projeto Cultural",
    uf: "SC",
    source: "Demonstração",
    lang: "Teatro",
    value: 10000,
    deadline: "não informado",
    url: "#",
    summary: "Oportunidade demonstrativa para testar criação de projeto cultural.",
  },
  {
    id: "op2",
    title: "Prêmio de Circulação Cultural",
    uf: "BR",
    source: "Demonstração",
    lang: "Artes Cênicas",
    value: 25000,
    deadline: "não informado",
    url: "#",
    summary: "Modelo de oportunidade para circulação, apresentações e ações formativas.",
  },
];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const uf = String(url.searchParams.get("uf") || "").toUpperCase();
  const linguagem = String(url.searchParams.get("linguagem") || "").toLowerCase();
  const q = String(url.searchParams.get("q") || "").toLowerCase();

  const filtered = baseDemo.filter((item) => {
    const matchUf = !uf || item.uf === uf || item.uf === "BR";
    const text = `${item.title} ${item.lang} ${item.summary}`.toLowerCase();
    const matchLang = !linguagem || text.includes(linguagem);
    const matchQ = !q || text.includes(q);

    return matchUf && matchLang && matchQ;
  });

  return Response.json(filtered.length ? filtered : baseDemo);
}
