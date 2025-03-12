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
    const res = await axios.post("https://apis-v71.onrender.com/g4o_v2",
      {
        id,
        prompt,
        name,
        model,
        system,
        customSystem: [{
          default: "You are helpful assistant"
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
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test'
        }
      }
    );
    return res.data;
  } catch (err) {
    const e = err.response?.data;
    return { 
      result: typeof e === 'string' ? e : e?.error || JSON.stringify(e) 
    };
  }
}
let model = fs.readFileSync("./model.js");
let model2 = fs.readFileSync("./model2.js");
const name = (await api.getUserInfo(event.senderID))[event.senderID].name;
const prompt = args.join(" ");
let sys = model;
if (event.senderID === "100063840894133") { sys = model2;}
  const result = await ai({
    prompt: prompt,
    name: name,
    id: event.senderID,
    system: sys,
    gender: "male",
    model: "llama"
  });
await api.sendMessage(result.data.result, event.threadID);
	}
}
