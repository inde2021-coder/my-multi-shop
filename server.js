const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// मेटा व्हाट्सएप क्रेडेंशियल्स (इन्हें अपने Vercel Environment Variables में सेट करें)
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN; 
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID; 
const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;

// 1. वेबहुक वेरिफिकेशन (Meta Setup के लिए - GET Request)
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token === WEBHOOK_VERIFY_TOKEN) {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// 1.1 वेबहुक मैसेज रिसीव करने के लिए (Customer जब WhatsApp पर मैसेज/बुकिंग करेगा - POST Request) [NEW ADDED]
app.post('/webhook', (req, res) => {
    const body = req.body;

    // Check karein ki yeh WhatsApp business account se hai ya nahi
    if (body.object === 'whatsapp_business_account') {
        body.entry.forEach(entry => {
            entry.changes.forEach(change => {
                const value = change.value;
                
                // Dekhein ki message aaya hai
                if (value.messages && value.messages[0]) {
                    const senderPhone = value.messages[0].from; // Customer ka mobile number
                    const messageText = value.messages[0].text ? value.messages[0].text.body : "Media/Interactive Message"; // Message ya booking text
                    
                    console.log(`Naya WhatsApp Message Mila!`);
                    console.log(`Customer Mobile: ${senderPhone}`);
                    console.log(`Message/Booking Content: ${messageText}`);

                    // --- YAHAN APNA DATABASE YA SOFTWARE LOGIC LAGA SAKTE HAIN ---
                    // Jaise customer ke message ko apne software ke database mein save karna 
                    // ya live dashboard par show karna.
                }
            });
        });

        // Meta ko 200 OK bhejna zaroori hai taaki wo baar-baar request na bheje
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// 2. व्हाट्सएप पर मैसेज भेजने का मुख्य फंक्शन (Template Sender)
async function sendWhatsAppTemplate(toMobile, templateName, languageCode, parameters) {
    try {
        const url = `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`;
        
        const formattedParameters = parameters.map(param => ({
            type: "text",
            text: String(param)
        }));

        const data = {
            messaging_product: "whatsapp",
            to: toMobile,
            type: "template",
            template: {
                name: templateName,
                language: {
                    code: languageCode
                },
                components: [
                    {
                        type: "body",
                        parameters: formattedParameters
                    }
                ]
            }
        };

        const response = await axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Message sent successfully:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error sending WhatsApp message:', error.response ? error.response.data : error.message);
        return { success: false, error: error.response ? error.response.data : error.message };
    }
}

// ==========================================
// 3. आपके सभी 8 टेम्पलेट्स के लिए API Endpoints
// ==========================================

app.post('/api/send-booking-pending', async (req, res) => {
    const { mobile, customerName, bookingId, date } = req.body;
    const result = await sendWhatsAppTemplate(mobile, 'booking_pending', 'hi', [customerName, bookingId, date]);
    res.json(result);
});

app.post('/api/send-due-payment', async (req, res) => {
    const { mobile, customerName, bookingId, dueAmount } = req.body;
    const result = await sendWhatsAppTemplate(mobile, 'due_payment', 'hi', [customerName, bookingId, dueAmount]);
    res.json(result);
});

app.post('/api/send-booking-reject', async (req, res) => {
    const { mobile, customerName, bookingId, date, reason } = req.body;
    const result = await sendWhatsAppTemplate(mobile, 'booking_reject', 'hi', [customerName, bookingId, date, reason]);
    res.json(result);
});

app.post('/api/send-bill-invoice', async (req, res) => {
    const { mobile, customerName, bookingId, totalAmount, paidAmount, dueAmount } = req.body;
    const result = await sendWhatsAppTemplate(mobile, 'bill_invoice', 'hi', [customerName, bookingId, totalAmount, paidAmount, dueAmount]);
    res.json(result);
});

app.post('/api/send-item-return', async (req, res) => {
    const { mobile, customerName, bookingId, returnedItems, missingItems } = req.body;
    const result = await sendWhatsAppTemplate(mobile, 'item_return', 'hi', [customerName, bookingId, returnedItems, missingItems]);
    res.json(result);
});

app.post('/api/send-item-dispatch', async (req, res) => {
    const { mobile, customerName, bookingId, itemsList } = req.body;
    const result = await sendWhatsAppTemplate(mobile, 'item_dishpach', 'hi', [customerName, bookingId, itemsList]);
    res.json(result);
});

app.post('/api/send-booking-conferm', async (req, res) => {
    const { mobile, customerName, bookingId, date } = req.body;
    const result = await sendWhatsAppTemplate(mobile, 'booking_conferm', 'hi', [customerName, bookingId, date]);
    res.json(result);
});

app.post('/api/send-otp', async (req, res) => {
    const { mobile, customerName, otpCode } = req.body;
    const result = await sendWhatsAppTemplate(mobile, 'verification_otp', 'hi', [customerName, otpCode]);
    res.json(result);
});

// सर्वर पोर्ट सेटअप (Vercel के लिए)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Radhe Krishna Tent House Server is running on port ${PORT}`);
});
