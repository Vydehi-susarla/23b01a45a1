const Log = require("./logger");

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiIyM2IwMWE0NWExQHN2ZWN3LmVkdS5pbiIsImV4cCI6MTc4MjM3Nzc4OSwiaWF0IjoxNzgyMzc2ODg5LCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiMDdmOTYxNWMtNmU3Yy00MmM3LTlhNjktMGUwMThhODZkNzE2IiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoic2FyYWRhIHZ5ZGVoaSBzdXNhcmxhIiwic3ViIjoiYTRjNDkzOWMtMjQxMS00NjQwLTkxM2QtOTBmNGYxZmE4YzFmIn0sImVtYWlsIjoiMjNiMDFhNDVhMUBzdmVjdy5lZHUuaW4iLCJuYW1lIjoic2FyYWRhIHZ5ZGVoaSBzdXNhcmxhIiwicm9sbE5vIjoiMjNiMDFhNDVhMSIsImFjY2Vzc0NvZGUiOiJhaFhqdnAiLCJjbGllbnRJRCI6ImE0YzQ5MzljLTI0MTEtNDY0MC05MTNkLTkwZjRmMWZhOGMxZiIsImNsaWVudFNlY3JldCI6InJ2VmdtTW1iR2FwbUV6U3cifQ.W8J--3t9Dwr7Msyp13ANT7SK4DVzS-Lg0xb9UtFCy4s";

(async () => {
    await Log(
        "backend",
        "info",
        "handler",
        "Testing logger",
        token
    );
})();