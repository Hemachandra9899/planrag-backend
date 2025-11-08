
import { getOrgIdForApiKey } from "./orgService.js";

export const getOrgIdFromApiKey = (apiKey) => {
  return getOrgIdForApiKey(apiKey);
};