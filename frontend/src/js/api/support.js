import { apiPost } from './client.js';

/**
 * @param {{ category: string, platform: string, subject: string, details: string }} ticket
 */
export function submitTicket(ticket) {
  return apiPost('/support/ticket', ticket);
}
