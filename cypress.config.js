const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://gharsah.onrender.com/html/homepage.html', // Adjust this to your backend URL
  },
});
