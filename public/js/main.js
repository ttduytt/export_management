import { handleRefreshtoken } from "./utils.js";

const isSavePass = localStorage.getItem("isSavePass");
await handleRefreshtoken(isSavePass);
