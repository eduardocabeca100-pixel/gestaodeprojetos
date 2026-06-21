import { listTeamRoster } from "@/modules/team/queries";

export async function GET() {
  try {
    const members = await listTeamRoster();
    return Response.json(members);
  } catch (error) {
    console.error("Error fetching team roster:", error);
    return Response.json({ error: "Failed to fetch team roster" }, { status: 500 });
  }
}
