const Canvas = require('canvas');
const fs = require('fs');
const path = require('path');

// Initialize global command tracker if it doesn't exist
if (!global.analytics) {
  global.analytics = {
    commands: {},
    users: {},
    startTime: Date.now()
  };
}

module.exports = {
  config: {
    name: "analytics",
    aliases: ["stats", "data"],
    version: "1.1.0",
    author: "NexusTeam",
    countDown: 5,
    role: 2,
    shortDescription: "View bot analytics",
    longDescription: "View detailed analytics with graphs about bot usage",
    category: "admin",
    guide: "{prefix}analytics [commands/users/system]"
  },

  async execute({ api, event, args }) {
    const { threadID } = event;
    const type = args[0]?.toLowerCase() || "commands";
    
    try {
      // Create temp directory if it doesn't exist
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      let data;
      let chartTitle;
      let chartType;

      switch(type) {
        case "commands":
          data = await getCommandAnalytics();
          chartTitle = "Most Used Commands";
          chartType = "bar";
          break;
        case "users":
          data = await getUserAnalytics();
          chartTitle = "User Activity";
          chartType = "pie";
          break;
        case "system":
          data = await getSystemAnalytics();
          chartTitle = "System Performance";
          chartType = "line";
          break;
        default:
          return api.sendMessage("📊 Available analytics types: commands, users, system", threadID);
      }

      // Create and save visualization
      const outputPath = path.join(tempDir, `analytics_${Date.now()}.png`);
      await createChart(data, chartTitle, chartType, outputPath);
      
      await api.sendMessage({
        body: `📊 ${chartTitle} Analytics Report`,
        attachment: fs.createReadStream(outputPath)
      }, threadID, () => fs.unlinkSync(outputPath));

    } catch (error) {
      console.error("Analytics error:", error);
      return api.sendMessage("❌ Error generating analytics: " + error.message, threadID);
    }
  }
};

async function getCommandAnalytics() {
  // Convert command usage data into sorted array
  const commands = Object.entries(global.analytics.commands)
    .map(([name, count]) => ({
      commandName: name,
      usageCount: count
    }))
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 10);

  // If no commands used yet, show dummy data
  if (commands.length === 0) {
    return {
      labels: ['No commands used yet'],
      values: [0],
      colors: ['#5865F2']
    };
  }

  return {
    labels: commands.map(c => c.commandName),
    values: commands.map(c => c.usageCount),
    colors: generateColors(commands.length)
  };
}

async function getUserAnalytics() {
  // Convert user activity data into sorted array
  const users = Object.entries(global.analytics.users)
    .map(([id, data]) => ({
      label: data.name || id,
      value: data.commandsUsed || 0
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // If no user data yet, show dummy data
  if (users.length === 0) {
    return {
      labels: ['No user data yet'],
      values: [0],
      colors: ['#5865F2']
    };
  }

  return {
    labels: users.map(u => u.label),
    values: users.map(u => u.value),
    colors: generateColors(users.length)
  };
}

async function getSystemAnalytics() {
  // Generate system metrics
  const metrics = [];
  for (let i = 0; i < 24; i++) {
    metrics.push({
      timestamp: Date.now() - (i * 3600000),
      value: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
    });
  }

  return {
    labels: metrics.map(m => formatTime(m.timestamp)),
    values: metrics.map(m => m.value),
    colors: ['#5865F2']
  };
}

async function createChart(data, title, type, outputPath) {
  const canvas = Canvas.createCanvas(800, 500);
  const ctx = canvas.getContext('2d');

  // Set background
  ctx.fillStyle = '#2F3136';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw title
  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText(title, canvas.width / 2, 40);

  // Draw chart based on type
  switch(type) {
    case "bar":
      drawBarChart(ctx, data, canvas);
      break;
    case "pie":
      drawPieChart(ctx, data, canvas);
      break;
    case "line":
      drawLineChart(ctx, data, canvas);
      break;
  }

  // Save to file
  const buffer = canvas.toBuffer();
  fs.writeFileSync(outputPath, buffer);
}

function drawBarChart(ctx, data, canvas) {
  const chartArea = {
    x: 50,
    y: 70,
    width: canvas.width - 100,
    height: canvas.height - 120
  };

  const barWidth = Math.min(40, (chartArea.width / data.labels.length) - 10);
  const maxValue = Math.max(...data.values);

  // Draw bars
  data.labels.forEach((label, i) => {
    const x = chartArea.x + (i * (chartArea.width / data.labels.length));
    const barHeight = (data.values[i] / maxValue) * chartArea.height;
    const y = chartArea.y + chartArea.height - barHeight;

    // Draw bar
    ctx.fillStyle = data.colors[i];
    ctx.fillRect(x, y, barWidth, barHeight);

    // Draw label
    ctx.save();
    ctx.translate(x + barWidth/2, chartArea.y + chartArea.height + 10);
    ctx.rotate(-Math.PI/4);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(label, 0, 0);
    ctx.restore();

    // Draw value
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(data.values[i], x + barWidth/2, y - 5);
  });
}

function drawPieChart(ctx, data, canvas) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(canvas.width, canvas.height) / 3;

  let total = data.values.reduce((a, b) => a + b, 0);
  let currentAngle = 0;

  // Draw pie segments
  data.values.forEach((value, i) => {
    const sliceAngle = (2 * Math.PI * value) / total;

    ctx.beginPath();
    ctx.fillStyle = data.colors[i];
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.closePath();
    ctx.fill();

    // Draw label
    const labelAngle = currentAngle + sliceAngle / 2;
    const labelX = centerX + (radius * 1.3) * Math.cos(labelAngle);
    const labelY = centerY + (radius * 1.3) * Math.sin(labelAngle);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${data.labels[i]} (${Math.round(value/total*100)}%)`, labelX, labelY);

    currentAngle += sliceAngle;
  });
}

function drawLineChart(ctx, data, canvas) {
  const chartArea = {
    x: 50,
    y: 70,
    width: canvas.width - 100,
    height: canvas.height - 120
  };

  const maxValue = Math.max(...data.values);
  const xStep = chartArea.width / (data.labels.length - 1);

  // Draw axes
  ctx.strokeStyle = '#666666';
  ctx.beginPath();
  ctx.moveTo(chartArea.x, chartArea.y);
  ctx.lineTo(chartArea.x, chartArea.y + chartArea.height);
  ctx.lineTo(chartArea.x + chartArea.width, chartArea.y + chartArea.height);
  ctx.stroke();

  // Draw line
  ctx.beginPath();
  ctx.strokeStyle = data.colors[0];
  ctx.lineWidth = 2;

  data.values.forEach((value, i) => {
    const x = chartArea.x + (i * xStep);
    const y = chartArea.y + chartArea.height - ((value / maxValue) * chartArea.height);

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }

    // Draw point
    ctx.fillStyle = data.colors[0];
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw label
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(data.labels[i], x, chartArea.y + chartArea.height + 20);
  });

  ctx.stroke();
}

function generateColors(count) {
  const colors = [
    '#5865F2', '#57F287', '#FEE75C', '#EB459E', '#ED4245',
    '#7289DA', '#43B581', '#FAA61A', '#B9BBBE', '#FF73FA'
  ];
  return colors.slice(0, count);
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Track command usage
global.trackCommand = function(commandName, userId, userName) {
  // Track command usage
  if (!global.analytics.commands[commandName]) {
    global.analytics.commands[commandName] = 0;
  }
  global.analytics.commands[commandName]++;

  // Track user activity
  if (!global.analytics.users[userId]) {
    global.analytics.users[userId] = {
      name: userName,
      commandsUsed: 0
    };
  }
  global.analytics.users[userId].commandsUsed++;
};
