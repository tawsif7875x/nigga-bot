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
      link = undefined
    }) {
      try {
        const res = await axios.post("https://test-api-v3.onrender.com/g4o_v2", {
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
          url: link,
          config: [{
            gemini: {
              apikey: process.env.GEMINI_API_KEY || "AIzaSyAqigdIL9j61bP-KfZ1iz6tI9Q5Gx2Ex_o", // Use environment variable
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
      } catch (error) {
        console.error("Error occurred while fetching AI response:", error);
        return { 
          result: `Error: ${error.response ? error.response.data.message : error.message}`
        };
      }
    }

    const tawsif = ["100063840894133"]; // Array of allowed IDs
    let model, model2;

    try {
      model = fs.readFileSync("./model.js", 'utf8');
      model2 = fs.readFileSync("./model2.js", 'utf8');
    } catch (error) {
      console.error("Error reading model files:", error);
      return api.sendMessage("Error loading model files.", event.threadID);
    }

    const name = (await api.getUserInfo(event.senderID))[event.senderID].name;
    let modelFile;
    let modelText = args[1];
    let prompt = args.join(" ");

    if (!prompt) { 
      return api.sendMessage("Please provide a query.", event.threadID);
    } else if (args[0] === "set" || args[0] === "set2") {
      modelFile = args[0] === "set" ? "./model.js" : "./model2.js";
      if (tawsif.includes(event.senderID)) {
        if (modelText && modelText.match(/lover|toxic|default|horny|helpful|friendly/)) {
          fs.writeFileSync(modelFile, modelText);
          return api.sendMessage(`Changed assistant to ${modelText}`, event.threadID);
        } else {
          return api.sendMessage("Please provide a valid model name.", event.threadID);
        }
      } else {
        return api.sendMessage("You do not have permission to change the model.", event.threadID);
      }
    }

    let sys = tawsif.includes(event.senderID) ? model : model2;
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
};
