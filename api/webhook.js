export default function handler(req, res) {
  // 1. Meta Webhook Verification (GET Request)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // चेक करें कि मोड और टोकन सही हैं या नहीं
    if (mode && token) {
      if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
        console.log('WEBHOOK_VERIFIED');
        // Meta को challenge वापस भेजना जरूरी है ताकि वेरिफिकेशन पूरा हो सके
        return res.status(200).send(challenge);
      } else {
        // अगर टोकन मैच नहीं हुआ
        return res.status(403).json({ error: 'Verification failed: Token mismatch' });
      }
    }
    return res.status(400).json({ error: 'Missing parameters' });
  }

  // 2. Incoming WhatsApp Messages (POST Request)
  else if (req.method === 'POST') {
    const body = req.body;
    
    // यहाँ आपको WhatsApp से आने वाले मैसेज और अपडेट्स मिलेंगे
    console.log('Incoming webhook:', JSON.stringify(body, null, 2));

    return res.status(200).send('EVENT_RECEIVED');
  }

  // अगर कोई दूसरा मेथड इस्तेमाल किया जाए
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
