function cleanString(value,max=500){return typeof value==="string"?value.trim().slice(0,max):""}
function validEmail(value){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)}
function validId(value){return typeof value==="string" && /^[0-9a-f-]{36}$/i.test(value)}
module.exports={cleanString,validEmail,validId};