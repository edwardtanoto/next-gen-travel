// This code is for v4 of the openai package: npmjs.com/package/openai
import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const text = req.body.data;

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Your job is to clean data to get locations from objects.",
        },
        {
          role: "user",
          content:
            "Given set of strings, get all the specific locations\n\nSet: {\n  'TikTok',\n  '@bucketlistbums',\n  '10 Most Instagrammable',\n  'Places in Istanbul',\n  '10',\n  'Most',\n  'Instagrammable',\n  'Places',\n  'in',\n  'Istanbul',\n  'ل TikTok',\n  'ل',\n  'Suleymaniye Mosque',\n  'Suleymaniye',\n  'Mosque',\n  'Galata Tower',\n  'VITAVIEN',\n  'KARVE',\n  'Galata',\n  'Tower',\n  'E',\n  'LIMAN',\n  'Ajwa Hotel Steps',\n  'Ajwa',\n  'Hotel',\n  'Steps',\n  '30',\n  'Blue Mosque',\n  'Blue',\n  'Balat',\n  'Neighborhood',\n  'Balat Neighborhood',\n  'Seven Hills Rooftop Terrace',\n  'S',\n  'Seven',\n  'Hills',\n  'Rooftop',\n  'Terrace',\n  'DE',\n  'Basilica Cistern',\n  'Basilica',\n  'Cistern',\n  'Topkapi Palace',\n  'Topkapi',\n  'Palace',\n  'Taht Rooftop',\n  'Taht',\n  'Grand Bazaar',\n  'Grand',\n  'Bazaar',\n  'Fed',\n  'FedEx',\n  'Follow me on Instagram',\n  'AJWA',\n  'Follow',\n  'me',\n  'on',\n  'Instagram',\n  'AIWA'\n}",
        },
        {
          role: "assistant",
          content:
            "Cleaned Set: {\n  'Suleymaniye Mosque',\n  'Galata Tower',\n  'Ajwa Hotel Steps',\n  'Blue Mosque',\n  'Balat Neighborhood',\n  'Seven Hills Rooftop Terrace',\n  'Basilica Cistern',\n  'Topkapi Palace',\n  'Taht Rooftop',\n  'Grand Bazaar'\n}",
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 1,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
    res.status(200).json({ output: response });
  } else {
  }
}
