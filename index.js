const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// CATALOG: Add your keywords, product images, and affiliate links here
const CATALOG = {
  "SHOE": {
    title: "Running Shoes (Special Deal)",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
    url: "https://amzn.to/your-shoe-link"
  },
  "WATCH": {
    title: "Fitness Smartwatch",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
    url: "https://amzn.to/your-watch-link"
  }
};

// Meta Webhook Verification
app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

// Auto-send DM when someone comments
app.post('/webhook', async (req, res) => {
  const comment = req.body?.entry?.[0]?.changes?.[0]?.value;
  const text = (comment?.text || "").toUpperCase();
  const senderId = comment?.from?.id;

  if (senderId) {
    for (const [keyword, item] of Object.entries(CATALOG)) {
      if (text.includes(keyword)) {
        await axios.post(
          `https://graph.facebook.com/v20.0/me/messages?access_token=${process.env.PAGE_TOKEN}`,
          {
            recipient: { id: senderId },
            message: {
              attachment: {
                type: "template",
                payload: {
                  template_type: "generic",
                  elements: [{
                    title: item.title,
                    image_url: item.image,
                    buttons: [{ type: "web_url", url: item.url, title: "Buy / View Deal 🛍️" }]
                  }]
                }
              }
            }
          }
        ).catch((err) => console.error(err?.response?.data || err.message));
        break;
      }
    }
  }
  res.sendStatus(200);
});

app.listen(process.env.PORT || 3000, () => console.log('Bot running!'));
