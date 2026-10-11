/**
 * jpegMeta.js — the poem's words travel inside the saved image, as its ALT
 * TEXT: an XMP packet in the JPEG (APP1), with the IPTC Photo Metadata field
 * made for exactly this — Iptc4xmpCore:AltTextAccessibility (IPTC 2021.1) —
 * and dc:description beside it, which older readers know. Photo libraries,
 * screen readers that look and image hosts that read IPTC carry it along;
 * nothing in the picture changes.
 *
 *   withAltText(dataURL, text) → a data URL with the packet inside
 * (what the text says is altText.js's work)
 */
const XMP_NS = 'http://ns.adobe.com/xap/1.0/\u0000';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The XMP packet that carries the text (UTF-8, as XMP must be). */
export function xmpPacket(text){
  const t = esc(text);
  return `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>`
    + `<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">`
    + `<rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:Iptc4xmpCore="http://iptc.org/std/Iptc4xmpCore/1.0/xmlns/">`
    + `<dc:description><rdf:Alt><rdf:li xml:lang="x-default">${t}</rdf:li></rdf:Alt></dc:description>`
    + `<Iptc4xmpCore:AltTextAccessibility><rdf:Alt><rdf:li xml:lang="x-default">${t}</rdf:li></rdf:Alt></Iptc4xmpCore:AltTextAccessibility>`
    + `</rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>`;
}

/** JPEG bytes with an APP1 XMP segment set in after the JFIF header (or SOI). */
export function insertXmp(bytes, text){
  if(!(bytes && bytes[0] === 0xFF && bytes[1] === 0xD8)) return bytes;          // not a JPEG: as it was
  const enc = new TextEncoder();
  let body = enc.encode(XMP_NS + xmpPacket(text));
  // one segment holds at most 65533 bytes: a very long poem is cut, never broken
  if(body.length > 65533 - 2){ let t = String(text); while(body.length > 65531 && t.length > 0){ t = t.slice(0, Math.floor(t.length*0.9)); body = enc.encode(XMP_NS + xmpPacket(t + '…')); } }
  const seg = new Uint8Array(4 + body.length);
  seg[0] = 0xFF; seg[1] = 0xE1; seg[2] = ((body.length + 2) >> 8) & 0xFF; seg[3] = (body.length + 2) & 0xFF; seg.set(body, 4);
  // after APP0 (JFIF), if it is there, so readers that expect it first still find it
  let at = 2;
  if(bytes[2] === 0xFF && bytes[3] === 0xE0) at = 4 + ((bytes[4] << 8) | bytes[5]);
  const out = new Uint8Array(bytes.length + seg.length);
  out.set(bytes.subarray(0, at), 0); out.set(seg, at); out.set(bytes.subarray(at), at + seg.length);
  return out;
}

/** A data URL (JPEG) with the alt text inside; anything else comes back unchanged. */
export function withAltText(dataURL, text){
  try {
    if(!text || !/^data:image\/jpeg;base64,/.test(dataURL)) return dataURL;
    const b64 = dataURL.slice(dataURL.indexOf(',') + 1), bin = atob(b64), bytes = new Uint8Array(bin.length);
    for(let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const out = insertXmp(bytes, text);
    let s = ''; for(let i = 0; i < out.length; i += 0x8000) s += String.fromCharCode.apply(null, out.subarray(i, i + 0x8000));
    return 'data:image/jpeg;base64,' + btoa(s);
  } catch(e){ return dataURL; }                    // the image matters more than its caption
}
