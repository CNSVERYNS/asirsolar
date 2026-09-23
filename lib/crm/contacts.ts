export type ContactInput = { name: string; company: string; phone: string; email: string; address: string };
export type Contact = ContactInput & { id: string; version: number; createdAt: string; updatedAt: string };
export type ContactList = { contacts: Contact[]; total: number; page: number; pageSize: number; query: string; sort: "name" | "company" };
export type ContactDetail = { contact: Contact; leads: { id: string; reference: string; projectType: string; createdAt: string }[]; leadCount: number };
export const emptyContact: ContactInput = { name: "", company: "", phone: "", email: "", address: "" };
