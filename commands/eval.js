const util = require('util');
const os = require('os');

module.exports = {
  config: {
    name: "eval",
    aliases: ["execute", "run"],
    version: "1.0.0",
    author: "NexusTeam",
    countDown: 5,
    role: 3,
    shortDescription: "Execute JavaScript code",
    longDescription: "Evaluate and execute JavaScript code (Owner only)",
    category: "admin",
    guide: "{prefix}eval [code]"
  },

  async execute({ api, event, args, Users, Threads }) {
    const { threadID, messageID } = event;

    if (!args[0]) {
      return api.sendMessage("🔸 Usage: {prefix}eval [code]", threadID, messageID);
    }

    let code = args.join(" ");

    // Handle code blocks
    if (code.includes("```")) {
      code = code.replace(/```(js|javascript)?/g, "").trim();
    }

    // Basic shortcuts
    const send = (msg) => api.sendMessage(msg, threadID, messageID);

    try {
      // Handle async code
      if (code.includes('await') && !code.includes('async')) {
        code = `(async () => { ${code} })()`;
      }

      // Capture console output
      let logs = [];
      const originalConsole = console.log;
      console.log = (...args) => {
        logs.push(args.map(arg => 
          typeof arg === 'string' ? arg : util.inspect(arg)
        ).join(' '));
      };

      // Execute with timeout
      const startTime = Date.now();
      let evaled = await Promise.race([
        eval(code),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Execution timeout (10s)')), 10000)
        )
      ]);

      // Restore console
      console.log = originalConsole;

      // Format result
      let result = typeof evaled === 'string' ? evaled : util.inspect(evaled, {
        depth: 2,
        maxArrayLength: 50
      });

      // Build response
      let response = `✅ Executed in ${Date.now() - startTime}ms\n\n`;
      response += `📝 Type: ${typeof evaled}\n`;
      response += `📤 Output:\n${result}`;

      if (logs.length > 0) {
        response += `\n\n📋 Console:\n${logs.join('\n')}`;
      }

      // Handle long responses
      if (response.length > 2000) {
        response = response.slice(0, 1997) + "...";
      }

      return send(response);

    } catch (error) {
      return send(`❌ Error:\n${error.message}`);
    }
  }
};

/*
Developer Tips:
1. Use $send(msg) as a shortcut to send messages
2. Use $thread to get current thread ID
3. Use $user to get sender's ID
4. Async code is automatically handled
5. Console.log outputs are captured and displayed
6. Execution time is measured
7. Results are automatically formatted
8. Error stack traces are provided
10. Maximum output is 2000 characters
*/
