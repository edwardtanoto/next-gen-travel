import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const text = req.body.data;
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_KEY,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "Your job is to find location name and city name from text in this format below. If there are multiple locations, add everything inside the array. \n [location_name, city_name].",
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0,
      max_tokens: 400,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      stop: ["--"],
    });
    res.status(200).json({ output: response });
  } else {
  }
}
