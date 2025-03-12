const axios = require('axios');
const fs = require('fs');

module.exports = {
  config: {
    name: "ai",
    author: "Tawsif~ & Jun APIs",
    role: 0,
    guide: "ai <query>"
  },
  async execute({ api, event, args }) {
    async function ai({ 
      prompt, 
      id, 
      name, 
      system, 
      gender, 
      model, 
      nsfw = true, 
      link = ""
    }) {
      try {
        const res = await axios.post("https://apis-v71.onrender.com/g4o_v2", {
          id,
          prompt,
          name,
          model,
          system,
          customSystem: [{
            default: "You are a helpful assistant"
          }],
          gender,
          nsfw,
          url: link || undefined,
          config: [{
            gemini: {
              apikey: "AIzaSyAqigdIL9j61bP-KfZ1iz6tI9Q5Gx2Ex_o",
              model: "gemini-1.5-flash"
            },
            llama: {
              model: "llama-3.2-90b-vision-preview"
            }
          }]
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test'
          }
        });
        return res.data;
      } catch (err) {
        console.error("Error occurred while fetching AI response:", err);
        return { 
          result: `error: ${error.message}`
        };
      }
    }

    const tawsif = "100063840894133";
    let model = fs.readFileSync("./model.js", 'utf8');
    let model2 = fs.readFileSync("./model2.js", 'utf8');
    const name = (await api.getUserInfo(event.senderID))[event.senderID].name;
    let prompt = args.join(" ");
    if (!prompt) { prompt = "hi";
                 }
    let sys = model;
    if (!tawsif.includes(event.senderID)) { sys = model2;
                                          }
    const result = await ai({
      prompt: prompt,
      name: name,
      id: event.senderID,
      system: sys,
      gender: "male",
      model: "llama"
    });

    await api.sendMessage(result.result || "No response received.", event.threadID);
  }
}
