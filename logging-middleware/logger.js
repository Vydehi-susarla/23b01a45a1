const axios = require("axios");

const credentials = {
  
    clientID: "a4c4939c-2411-4640-913d-90f4f1fa8c1f",
    clientSecret: "rvVgmMmbGapmEzSw",
    email: "23b01a45a1@svecw.edu.in",
    name: "sarada vydehi susarla",
    rollNo: "23b01a45a1",
    accessCode: "ahXjvp"
};

let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
    const now = Math.floor(Date.now() / 1000);
    if (cachedToken && (tokenExpiry - now > 60)) {
        return cachedToken;
    }
    try {
        const res = await axios.post("http://4.224.186.213/evaluation-service/auth", credentials);
        cachedToken = res.data.access_token;
        tokenExpiry = res.data.expires_in;
        return cachedToken;
    } catch (err) {
        throw err;
    }
}

async function Log(stack, level, pkg, message, token) {
    try {
        const authToken = token || await getToken();
        const response = await axios({
            method: "POST",
            url: "http://4.224.186.213/evaluation-service/logs",
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json"
            },
            data: {
                stack,
                level,
                package: pkg,
                message
            }
        });

        console.log(response.data);
        return response.data;

    } catch (err) {
        console.log("Status:", err.response?.status);
        console.log("Data:", err.response?.data);
    }
}

module.exports = Log;
module.exports.getToken = getToken;