# ### Part 1: The Backend Code (Run this on your machine/server)

This script uses the token you provided (you'll need to paste it back in) to authenticate and let the agent "look around."
**dialpad_server.js**
JavaScript

const express = require('express');
const { SignalWire } = require('@signalwire/realtime-api');
const app = express();
app.use(express.json());

// PASTE YOUR TOKEN BELOW
const PROJECT_ID = 'YOUR_PROJECT_ID'; // Found in your Dashboard settings
const API_TOKEN = 'PTadb96ba823b2d46d2914e13d312c8f44916a25bb50ba8658'; // <--- Your token

const client = new SignalWire({ project: PROJECT_ID, token: API_TOKEN });

// This is the "Configuration Room" data the agent will see
const DIALPAD_CONFIG = {
  status: "Active",
  current_mode: "Daytime",
  forwarding: {
    "1": "Reception",
    "2": "Sales",
    "3": "Support",
    "0": "Voicemail"
  },
  allowed_features: ["outbound_dialing", "blind_transfer"]
};

app.post('/get_config', async (req, res) => {
  console.log("Agent is checking configuration...");
  
  // You can add logic here to use the 'client' to fetch real data from SW if needed
  // For now, we return the map so the agent knows the setup.
  
  res.json({
    response: "I have accessed the configuration room.",
    config_data: DIALPAD_CONFIG
  });
});

app.listen(3000, () => console.log('Dialpad Config Server running on port 3000'));

### Part 2: The SWAIG Function (Give this to the Agent)

Put this inside your SWML so the agent knows the tool exists.
YAML

functions:
- function: get_dialpad_configuration
  purpose: Access the configuration room to see current extension mappings and dial pad modes.
  argument:
  type: object
  properties:
  request_type:
  type: string
  description: What to look for (e.g. 'full_config')
  web_hook_url: https://YOUR-NGROK-OR-SERVER-URL/get_config

### How to use it immediately for testing:

1. 1	Save the JS code to a file.
2. 2	Run npm install express @signalwire/realtime-api
3. 3	Run node dialpad_server.js
4. 4	Point your SWML web_hook_url to your server.

⠀The agent will now be able to "see" that DIALPAD_CONFIG object and answer questions about it.
