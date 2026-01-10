

export default async function handler(req, res) {

  // Only allow POST

  if (req.method !== "POST") {

    return res.status(405).json({ reply: "Method Not Allowed" });

  }


  // Make sure API key exists

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {

    return res.status(500).json({

      reply: "Server misconfiguration: missing API key."

    });

  }


  try {

    const {

      system,

      memory,

      context,

      messages,

      temperature,

      maxTokens

    } = req.body || {};


    // -----------------------------

    // CONTEXT ENGINEERING PROMPT

    // -----------------------------

    const systemMessage = `

SYSTEM INSTRUCTIONS:

${system || "You are a helpful assistant."}


USER PROFILE / MEMORY:

${memory || "No user profile provided."}


RETRIEVED CONTEXT (RAG):

${context || "No retrieved context provided."}


GUIDELINES:

- Use retrieved context when relevant

- If context is missing, ask clarifying questions

- Keep answers concise and helpful

`;


    // Convert messages to OpenAI format

    const chatMessages = [

      { role: "system", content: systemMessage },

      ...(Array.isArray(messages) ? messages : []).map((m) => ({

        role: m.role === "user" ? "user" : "assistant",

        content: String(m.content || "")

      }))

    ].slice(-20); // limit history


    // -----------------------------

    // OPENAI API CALL

    // -----------------------------

    const response = await fetch("https://api.openai.com/v1/chat/completions", {

      method: "POST",

      headers: {

        "Content-Type": "application/json",

        Authorization: `Bearer ${apiKey}`

      },

      body: JSON.stringify({

        model: "gpt-4o-mini",

        messages: chatMessages,

        temperature: typeof temperature === "number" ? temperature : 0.7,

        max_tokens: typeof maxTokens === "number" ? maxTokens : 300

      })

    });


    if (!response.ok) {

      const errText = await response.text();

      return res.status(500).json({

        reply: `OpenAI error: ${errText}`

      });

    }


    const data = await response.json();

    const reply =

      data?.choices?.[0]?.message?.content ||

      "No response returned from model.";


    return res.status(200).json({ reply });


  } catch (error) {

    return res.status(500).json({

      reply: `Server error: ${error.message}`

    });

  }

}

