
export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { base64Image } = await req.json();
        
        // Validate input
        if (!base64Image || typeof base64Image !== 'string') {
            return res.status(400).json({ error: 'Invalid or missing base64Image' });
        }

        if (base64Image.length > 10 * 1024 * 1024) { // 10MB limit
            return res.status(413).json({ error: 'Image too large' });
        }

        const API_TOKEN = process.env.API_TOKEN;
        
        // Validate API token
        if (!API_TOKEN) {
            console.error("API_TOKEN not configured");
            return res.status(500).json({ error: 'Server configuration error' });
        }

        console.log("Processing image of length:", base64Image.length);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(
            "https://api-inference.huggingface.co/models/francis-ogbuagu/maize_vit_model",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${API_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ inputs: base64Image }),
                signal: controller.signal
            }
        );
        
        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error(`HF API error: ${response.status} ${response.statusText}`);
            return res.status(response.status).json({ 
                error: `Hugging Face API error: ${response.statusText}` 
            });
        }

        const data = await response.json();
        
        // Handle Hugging Face specific errors
        if (data.error) {
            console.error("HF API returned error:", data.error);
            return res.status(400).json({ error: data.error });
        }

        console.log("Prediction successful");
        res.status(200).json(data);

    } catch (err) {
        console.error("Prediction error:", err);
        
        // Handle specific error types
        if (err.name === 'AbortError') {
            res.status(408).json({ error: 'Request timeout' });
        } else if (err.name === 'FetchError') {
            res.status(503).json({ error: 'Service unavailable' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
