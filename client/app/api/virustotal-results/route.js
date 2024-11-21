import fetch from "node-fetch";

export async function GET(request) {
  const url = new URL(request.url);
  const scanId = url.searchParams.get("scanId");

  if (!scanId) {
    return new Response(JSON.stringify({ error: "Missing scanId" }), {
      status: 400,
    });
  }

  try {
    const apiKey = process.env.VIRUSTOTAL_API_KEY;
    const response = await fetch(
      `https://www.virustotal.com/api/v3/analyses/${scanId}`,
      {
        method: "GET",
        headers: {
          "x-apikey": apiKey,
        },
      }
    );

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch results" }),
        {
          status: 500,
        }
      );
    }

    const result = await response.json();
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error("Error fetching VirusTotal results:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
