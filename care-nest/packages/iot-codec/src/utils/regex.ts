/**
 * Wonlex V3.2 protocol regex constants
 */

/** Device ID: 10-15 digits */
export const DEVICE_ID_RE = /^\d{10,15}$/;

/** Full packet: [3G*DEVICE_ID*LLLL*CONTENT] */
export const PACKET_RE = /^\[3G\*(\d{10,15})\*([0-9A-Fa-f]{4})\*(.*)\]$/;
