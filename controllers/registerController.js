// src/controllers/registerController.js
import { registerOrg } from "../services/orgService.js";

export const handleRegister = async (req, res) => {
  try {
    const { email, password, org_name } = req.body;

    if (!email || !password || !org_name) {
      return res
        .status(400)
        .json({ error: "email, password, and org_name are required" });
    }

    const { orgId, apiKey } = registerOrg({
      email,
      password,
      orgName: org_name
    });

    // You might later send a verification email etc.
    return res.json({
      org_id: orgId,
      api_key: apiKey
    });
  } catch (err) {
    console.error("Register error", err);
    return res.status(500).json({ error: "Internal error in register" });
  }
};
