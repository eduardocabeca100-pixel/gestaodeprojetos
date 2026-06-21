import { listTeamRosterAssignments } from "@/modules/team/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return Response.json(
      { error: "projectId is required" },
      { status: 400 }
    );
  }

  try {
    const assignments = await listTeamRosterAssignments(projectId);
    return Response.json(assignments);
  } catch (error) {
    console.error("Error fetching team roster assignments:", error);
    return Response.json(
      { error: "Failed to fetch team roster assignments" },
      { status: 500 }
    );
  }
}
