export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RequestBody = Record<string, unknown>;

function asText(value: unknown) {
  return String(value ?? "").trim();
}

function respostaDemo(body: RequestBody) {
  const task = asText(body.task || body.mode || "chat");
  const message = asText(body.message || body.prompt || body.input);

  if (task.toLowerCase().includes("revis")) {
    return "Modo demonstração: revisei o texto e sugiro fortalecer justificativa, objetivos, acessibilidade, orçamento e relação com o edital. Configure GROQ_API_KEY ou OPENAI_API_KEY na Vercel para resposta real.";
  }

  if (message) {
    return `Modo demonstração: recebi sua solicitação: "${message}". Para ativar IA real, configure a chave no backend da Vercel, nunca no navegador.`;
  }

  return "Modo demonstração ativo. O CÉREBRO IA está integrado ao VIVA. Configure a chave de IA no backend para respostas reais.";
}

function montarMensagens(body: RequestBody) {
  const project = body.project ? JSON.stringify(body.project, null, 2) : "Sem projeto estruturado.";
  const message = asText(body.message || body.prompt || body.input || body.task);

  return [
    {
      role: "system",
      content:
        "Você é o CÉREBRO IA, consultor especialista em escrita de projetos culturais, editais, PNAB, SALIC, Lei Rouanet, prestação de contas, orçamento, cronograma, acessibilidade e justificativa cultural. Responda em português do Brasil, com linguagem profissional, prática e orientada a edital.",
    },
    {
      role: "user",
      content: `Dados do projeto:\n${project}\n\nPedido do usuário:\n${message || JSON.stringify(body, null, 2)}`,
    },
  ];
}

function extractOpenAIText(data: any) {
  if (typeof data?.output_text === "string") return data.output_text;

  const output = data?.output;
  if (Array.isArray(output)) {
    const parts: string[] = [];

    for (const item of output) {
      if (Array.isArray(item?.content)) {
        for (const content of item.content) {
          if (typeof content?.text === "string") parts.push(content.text);
        }
      }
    }

    return parts.join("\n").trim();
  }

  return "";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as RequestBody;

    const groqKey = process.env.GROQ_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (groqKey) {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
          messages: montarMensagens(body),
          temperature: 0.35,
          max_tokens: 3500,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return Response.json({
          ok: false,
          output:
            data?.error?.message ||
            "Não consegui conectar com o Groq. Verifique GROQ_API_KEY e GROQ_MODEL na Vercel.",
        });
      }

      return Response.json({
        ok: true,
        output:
          data?.choices?.[0]?.message?.content ||
          "A IA respondeu, mas não retornou texto legível.",
      });
    }

    if (openaiKey) {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-5.5",
          input: montarMensagens(body),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return Response.json({
          ok: false,
          output:
            data?.error?.message ||
            "Não consegui conectar com a OpenAI. Verifique OPENAI_API_KEY e OPENAI_MODEL na Vercel.",
        });
      }

      return Response.json({
        ok: true,
        output: extractOpenAIText(data) || "A IA respondeu, mas não retornou texto legível.",
      });
    }

    return Response.json({
      ok: true,
      demo: true,
      output: respostaDemo(body),
    });
  } catch (error) {
    return Response.json({
      ok: false,
      output: `Erro interno na rota de IA: ${error instanceof Error ? error.message : "erro desconhecido"}`,
    });
  }
}
