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
            "Your job is to label given text with only one single appropriate emoji.",
        },
        {
          role: "user",
          content: "McDonalds",
        },
        {
          role: "assistant",
          content: "🍔",
        },
        {
          role: "user",
          content: "ryoko japanese restaurant and bar",
        },
        {
          role: "assistant",
          content: "🍣",
        },
        {
          role: "user",
          content:
            "roka akor Upscale Japanese restaurant & bar supplying steak, seafood & sushi in a contemporary setting.",
        },
        {
          role: "assistant",
          content: "🍣",
        },
        {
          role: "user",
          content: "Baitou Hot Springs",
        },
        {
          role: "assistant",
          content: "🏞️",
        },
        {
          role: "user",
          content: "Kenting National Park",
        },
        {
          role: "assistant",
          content: "🏞️",
        },
        {
          role: "user",
          content: "Yosemite National Park",
        },
        {
          role: "assistant",
          content: "🏞️",
        },
      ],
      temperature: 0,
      max_tokens: 5,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      stop: ["--"],
    });
    res.status(200).json({ output: response });
  } else {
  }
}
