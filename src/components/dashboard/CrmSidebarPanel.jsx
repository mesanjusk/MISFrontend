import React, { useMemo, useState } from "react";
import { HiOutlineSearch, HiOutlineTag, HiOutlineUserCircle } from "react-icons/hi";

const CONTACTS = [
  {
    id: "c-1001",
    name: "Ava Johnson",
    company: "Northwind Traders",
    status: "hot",
    lastMessage: "Can we review the updated quote this afternoon?",
    lastSeen: "10m ago",
    tags: ["VIP", "Renewal"],
    chat: [
      { id: "m-1", sender: "contact", text: "Hey, need pricing update for Q2", time: "09:15" },
      { id: "m-2", sender: "agent", text: "Sure, I can share this before lunch.", time: "09:20" },
      { id: "m-3", sender: "contact", text: "Can we review the updated quote this afternoon?", time: "09:41" },
    ],
  },
  {
    id: "c-1002",
    name: "Liam Chen",
    company: "BluePeak Retail",
    status: "warm",
    lastMessage: "Please tag this as onboarding.",
    lastSeen: "35m ago",
    tags: ["Onboarding"],
    chat: [
      { id: "m-1", sender: "contact", text: "Sent signed documents.", time: "08:05" },
      { id: "m-2", sender: "agent", text: "Great, adding your account now.", time: "08:12" },
      { id: "m-3", sender: "contact", text: "Please tag this as onboarding.", time: "08:18" },
    ],
  },
  {
    id: "c-1003",
    name: "Mia Rodriguez",
    company: "Vertex Labs",
    status: "cold",
    lastMessage: "Following up next week works for me.",
    lastSeen: "2h ago",
    tags: ["Follow-up", "Email"],
    chat: [
      { id: "m-1", sender: "agent", text: "Any update from finance team?", time: "11:00" },
      { id: "m-2", sender: "contact", text: "Following up next week works for me.", time: "11:16" },
    ],
  },
];

const FILTERS = ["all", "hot", "warm", "cold"];

function StatusPill({ status }) {
  const palette = {
    hot: "bg-rose-100 text-rose-700",
    warm: "bg-amber-100 text-amber-700",
    cold: "bg-slate-100 text-slate-600",
  };

  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${palette[status] || palette.cold}`}>
      {status}
    </span>
  );
}

export default function CrmSidebarPanel() {
  const [contacts, setContacts] = useState(CONTACTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(CONTACTS[0]?.id);
  const [newTag, setNewTag] = useState("");

  const filteredContacts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return contacts.filter((contact) => {
      const matchesFilter = activeFilter === "all" || contact.status === activeFilter;
      const matchesSearch =
        !query ||
        contact.name.toLowerCase().includes(query) ||
        contact.company.toLowerCase().includes(query) ||
        contact.tags.some((tag) => tag.toLowerCase().includes(query));

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, contacts, searchTerm]);

  const activeContact = useMemo(() => {
    const fromFiltered = filteredContacts.find((contact) => contact.id === selectedId);
    if (fromFiltered) return fromFiltered;
    return filteredContacts[0] || null;
  }, [filteredContacts, selectedId]);

  const addTag = (event) => {
    event.preventDefault();
    const tagValue = newTag.trim();

    if (!tagValue || !activeContact) return;

    setContacts((prev) =>
      prev.map((contact) => {
        if (contact.id !== activeContact.id) return contact;

        if (contact.tags.some((tag) => tag.toLowerCase() === tagValue.toLowerCase())) {
          return contact;
        }

        return { ...contact, tags: [...contact.tags, tagValue] };
      }),
    );

    setNewTag("");
  };

  const removeTag = (tag) => {
    if (!activeContact) return;

    setContacts((prev) =>
      prev.map((contact) => {
        if (contact.id !== activeContact.id) return contact;
        return { ...contact, tags: contact.tags.filter((currentTag) => currentTag !== tag) };
      }),
    );
  };

  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">CRM</h2>
        <span className="text-xs text-slate-500">{filteredContacts.length} contacts</span>
      </div>

      <label className="relative mb-3 block">
        <HiOutlineSearch className="pointer-events-none absolute left-2 top-2.5 text-slate-400" />
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search contacts"
          className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-2 text-sm outline-none focus:border-indigo-300"
        />
      </label>

      <div className="mb-3 flex flex-wrap gap-1">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${
              activeFilter === filter ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="mb-4 max-h-64 space-y-2 overflow-y-auto pr-1">
        {filteredContacts.length === 0 && <p className="text-xs text-slate-500">No contacts match this search.</p>}
        {filteredContacts.map((contact) => (
          <button
            key={contact.id}
            type="button"
            onClick={() => setSelectedId(contact.id)}
            className={`w-full rounded-lg border p-2 text-left transition ${
              activeContact?.id === contact.id ? "border-indigo-300 bg-indigo-50" : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-900">{contact.name}</p>
              <StatusPill status={contact.status} />
            </div>
            <p className="text-[11px] text-slate-500">{contact.company}</p>
            <p className="mt-1 line-clamp-1 text-[11px] text-slate-500">{contact.lastMessage}</p>
          </button>
        ))}
      </div>

      {activeContact ? (
        <div className="space-y-3 border-t border-slate-200 pt-3">
          <div className="flex items-center gap-2">
            <HiOutlineUserCircle className="text-xl text-slate-400" />
            <div>
              <p className="text-sm font-semibold text-slate-900">{activeContact.name}</p>
              <p className="text-xs text-slate-500">Last active {activeContact.lastSeen}</p>
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold text-slate-700">Tags</p>
            <div className="mb-2 flex flex-wrap gap-1">
              {activeContact.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-700">
                  <HiOutlineTag />
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="text-slate-400 hover:text-rose-500">
                    ×
                  </button>
                </span>
              ))}
            </div>
            <form onSubmit={addTag} className="flex gap-1">
              <input
                value={newTag}
                onChange={(event) => setNewTag(event.target.value)}
                placeholder="Add tag"
                className="min-w-0 flex-1 rounded-md border border-slate-200 px-2 py-1 text-xs outline-none focus:border-indigo-300"
              />
              <button type="submit" className="rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white">
                Add
              </button>
            </form>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold text-slate-700">Chat History</p>
            <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2">
              {activeContact.chat.map((item) => (
                <div
                  key={item.id}
                  className={`max-w-[90%] rounded-md px-2 py-1 text-xs ${
                    item.sender === "agent" ? "ml-auto bg-indigo-600 text-white" : "bg-white text-slate-700"
                  }`}
                >
                  <p>{item.text}</p>
                  <p className={`mt-1 text-[10px] ${item.sender === "agent" ? "text-indigo-200" : "text-slate-400"}`}>{item.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-500">Choose a contact to see details.</p>
      )}
    </aside>
  );
}
