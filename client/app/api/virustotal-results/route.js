import fetch from "node-fetch";

const virusTotalApiKey = process.env.VIRUSTOTAL_API_KEY;

export async function POST(req) {
  try {
    const body = await req.json();
    const { scanIds } = body;

    if (!scanIds || !Array.isArray(scanIds) || scanIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid input: Missing scan IDs." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const results = await Promise.all(
      scanIds.map(async (scanId) => {
        const response = await fetch(
          `https://www.virustotal.com/api/v3/analyses/${scanId}`,
          {
            method: "GET",
            headers: {
              "x-apikey": virusTotalApiKey,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error fetching results for ${scanId}:`, errorText);
          return { scanId, error: "Failed to fetch results." };
        }

        const data = await response.json();
        return { scanId, data };
      })
    );

    console.log("API results fetched:", results);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching VirusTotal results:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error occurred." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
