import { createClient, hasSupabaseServerEnv } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bucket = "cerebro-team-documents";

function text(value: unknown) {
  return String(value ?? "").trim();
}

function slug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

async function getClient() {
  if (!hasSupabaseServerEnv()) return null;
  return (await createClient()) as any;
}

async function addSignedUrls(client: any, documents: any[]) {
  const result = [];

  for (const doc of documents || []) {
    let signedUrl = "";

    if (doc.storage_path) {
      try {
        const signed = await client.storage
          .from(bucket)
          .createSignedUrl(doc.storage_path, 60 * 60);

        signedUrl = signed?.data?.signedUrl || "";
      } catch {
        signedUrl = "";
      }
    }

    result.push({
      ...doc,
      signedUrl,
    });
  }

  return result;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const projectId = text(url.searchParams.get("projectId") || url.searchParams.get("project"));
  const personKey = text(url.searchParams.get("personKey"));

  const client = await getClient();

  if (!client) {
    return Response.json({
      ok: false,
      message: "Supabase não configurado.",
      documents: [],
    });
  }

  let query = client
    .from("cerebro_team_documents")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (personKey) query = query.eq("person_key", personKey);

  const { data, error } = await query;

  if (error) {
    return Response.json({
      ok: false,
      message: "Tabela cerebro_team_documents não encontrada ou sem permissão.",
      documents: [],
    });
  }

  return Response.json({
    ok: true,
    documents: await addSignedUrls(client, data || []),
  });
}

export async function POST(request: Request) {
  const form = await request.formData();

  const projectId = text(form.get("projectId"));
  const personKey = text(form.get("personKey"));
  const personName = text(form.get("personName"));
  const category = text(form.get("category")) || "Documento";
  const notes = text(form.get("notes"));
  const file = form.get("file");

  if (!projectId || !personKey) {
    return Response.json({
      ok: false,
      message: "Projeto ou pessoa não informado.",
    });
  }

  if (!(file instanceof File)) {
    return Response.json({
      ok: false,
      message: "Arquivo não enviado.",
    });
  }

  const client = await getClient();

  if (!client) {
    return Response.json({
      ok: false,
      message: "Supabase não configurado.",
    });
  }

  const fileName = file.name || "arquivo";
  const storagePath = `${slug(projectId)}/${slug(personKey)}/${Date.now()}-${slug(fileName)}`;

  const upload = await client.storage.from(bucket).upload(storagePath, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (upload.error) {
    return Response.json({
      ok: false,
      message:
        "Não consegui subir o arquivo. Confira se o bucket cerebro-team-documents existe no Supabase Storage.",
    });
  }

  const { data, error } = await client
    .from("cerebro_team_documents")
    .insert({
      project_id: projectId,
      person_key: personKey,
      person_name: personName,
      category,
      file_name: fileName,
      mime_type: file.type || "",
      size_bytes: file.size || 0,
      storage_path: storagePath,
      notes,
    })
    .select("*")
    .single();

  if (error) {
    return Response.json({
      ok: false,
      message: "Arquivo subiu, mas não consegui registrar no banco.",
    });
  }

  const signed = await client.storage.from(bucket).createSignedUrl(storagePath, 60 * 60);

  return Response.json({
    ok: true,
    message: "Documento registrado no Cérebro IA.",
    document: {
      ...data,
      signedUrl: signed?.data?.signedUrl || "",
    },
  });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = text(url.searchParams.get("id"));

  if (!id) {
    return Response.json({
      ok: false,
      message: "Documento não informado.",
    });
  }

  const client = await getClient();

  if (!client) {
    return Response.json({
      ok: false,
      message: "Supabase não configurado.",
    });
  }

  const existing = await client
    .from("cerebro_team_documents")
    .select("id,storage_path")
    .eq("id", id)
    .maybeSingle();

  if (existing?.data?.storage_path) {
    await client.storage.from(bucket).remove([existing.data.storage_path]).catch?.(() => null);
  }

  const { error } = await client.from("cerebro_team_documents").delete().eq("id", id);

  if (error) {
    return Response.json({
      ok: false,
      message: "Não consegui remover documento.",
    });
  }

  return Response.json({
    ok: true,
    message: "Documento removido.",
  });
}
