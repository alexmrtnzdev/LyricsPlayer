export class HuggingFaceAPI {
  static async generarSignificado(texto) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer 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",
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost",
          "X-Title": "LyricsPlayer"           
        },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct",
          messages: [
            {
              role: "system",
              content: "Eres un experto en letras musicales. Explica el significado de canciones en español de forma clara y concisa."
            },
            {
              role: "user",
              content: `Analiza el significado de la siguiente letra según cómo el artista la interpreta. Si está escrita en primera persona, mantén ese enfoque. Si describe a otro sujeto, puedes usar expresiones como “el cantante”, “una mujer”, “un hombre”, etc. Menciona al artista si es reconocible y analiza también el tono emocional, los conflictos internos y la intención detrás de las frases clave. Usa lenguaje natural y profundo, no genérico:\n\n${texto}`
            }
          ],
          temperature: 0.8
        })
      });

      const data = await response.json();

      if (data?.choices?.[0]?.message?.content) {
        return data.choices[0].message.content.trim();
      } else {
        console.error("Respuesta no válida de OpenRouter:", data);
        return "No se pudo analizar la letra";
      }

    } catch (error) {
      console.error("Error con OpenRouter API:", error);
      return "Error al generar el significado";
    }
  }
}
