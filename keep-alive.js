const url = process.env.KEEP_ALIVE_URL || 'https://ce-summarizer.onrender.com';

setInterval(async () => {
  try {
    const response = await fetch(url);
    console.log(`Pinged ${url} at ${new Date().toISOString()}: ${response.status}`);
  } catch (error) {
    console.error('Error pinging:', error);
  }
}, 3 * 60 * 1000); // 3 minutes