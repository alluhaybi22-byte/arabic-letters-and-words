'use strict';
const CONTENT_SECURITY_POLICY = "default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' blob:; worker-src 'self' blob:; object-src 'none'; frame-src 'none'; base-uri 'self'; form-action 'none'";
const {pathToFileURL}=require('node:url');
function authorizeFrame(event,window,file) {
  if(!window || window.isDestroyed() || event.sender!==window.webContents || !event.senderFrame ||
    event.senderFrame!==event.sender.mainFrame || event.senderFrame.url!==pathToFileURL(file).href) {
    throw new Error('طلب من مصدر غير معتمد');
  }
}
function protectSession(session) {
  session.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));
  session.setPermissionCheckHandler(()=>false);
  session.webRequest.onHeadersReceived((details,callback)=>callback({responseHeaders:{
    ...details.responseHeaders,'Content-Security-Policy':[CONTENT_SECURITY_POLICY]
  }}));
}
function protectReport(html) {
  // Insert our policy before any report content. A renderer-supplied second CSP
  // can only restrict it further, never relax the first policy.
  const prefix='<!doctype html><html lang="ar" dir="rtl"><head>';
  if(!html.startsWith(prefix)) throw new Error('تنسيق معاينة غير معتمد');
  return prefix+'<meta http-equiv="Content-Security-Policy" content="'+CONTENT_SECURITY_POLICY+'">'+html.slice(prefix.length);
}
module.exports={CONTENT_SECURITY_POLICY,authorizeFrame,protectSession,protectReport};
