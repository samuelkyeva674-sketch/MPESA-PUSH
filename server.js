require("dotenv").config();
const express = require("express");
const axios = require("axios");
const app = express();

app.use(express.json());

app.post("/pay", async (req, res) => {
    try {
        const { phone, amount, name } = req.body;

        const auth = Buffer.from(
            process.env.CONSUMER_KEY + ":" + process.env.CONSUMER_SECRET
        ).toString("base64");

        const tokenRes = await axios.get(
            "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
            { headers: { Authorization: `Basic ${auth}` } }
        );

        const accessToken = tokenRes.data.access_token;

        const timestamp = new Date()
            .toISOString()
            .replace(/[-:.TZ]/g, "")
            .slice(0, 14);

        const password = Buffer.from(
            process.env.BUSINESS_SHORTCODE +
            process.env.PASSKEY +
            timestamp
        ).toString("base64");

        await axios.post(
            "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
            {
                BusinessShortCode: process.env.BUSINESS_SHORTCODE,
                Password: password,
                Timestamp: timestamp,
                TransactionType: "CustomerPayBillOnline",
                Amount: amount,
                PartyA: phone,
                PartyB: process.env.BUSINESS_SHORTCODE,
                PhoneNumber: phone,
                CallBackURL: process.env.CALLBACK_URL,
                AccountReference: name,
                TransactionDesc: "AIC Kisaulu Youth Contribution"
            },
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        res.json({ message: "STK Push sent. Check your phone." });
    } catch (err) {
        res.json({ message: "MPESA request failed" });
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));
