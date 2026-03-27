import React, { useEffect, useMemo, useState } from "react";
import { HiOutlineSearch, HiOutlineTag, HiOutlineUserCircle } from "react-icons/hi";
import normalizeWhatsAppNumber from "../../utils/normalizeNumber";
import { fetchCustomers, fetchMessagesByNumber } from "../../services/whatsappService";

const FILTERS = ["all", "hot", "warm", "cold"];

const toMillis = (value) => {
  const date = new Date(value || Date.now());
  return Number.isNaN(date.getTime()) ? Date.now() : date.getTime();
};

const getStatusByLastActivity = (timestamp) => {
  const ageHours = Math.abs(Date.now() - timestamp) / (1000 * 60 * 60);
  if (ageHours <= 24) return "hot";
  if (ageHours <= 72) return "warm";
  return "cold";
};

const formatRelativeTime = (timestamp) => {
  const diffMs = Math.max(0, Date.now() - timestamp);
  const mins = Math.floor(diffMs / (1000 * 60));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

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
  const [contacts, setContacts] = useState([]);
  const [tagsByContact, setTagsByContact] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const [newTag, setNewTag] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isContactsLoading, setIsContactsLoading] = useState(true);
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    const loadContacts = async () => {
      setIsContactsLoading(true);
      try {
        const response = await fetchCustomers();
        const list = response?.data?.result || [];

        const normalizedContacts = list.map((contact) => {
          const updatedAt = toMillis(contact?.UpdatedAt || contact?.CreatedAt || Date.now());
          return {
            id: contact?._id || contact?.Customer_uuid || contact?.Mobile_number,
            name: contact?.Customer_name || "Unknown",
            company: contact?.Customer_group || "No Group",
            mobile: normalizeWhatsAppNumber(contact?.Mobile_number || ""),
            lastSeenAt: updatedAt,
            status: getStatusByLastActivity(updatedAt),
          };
        });

        setContacts(normalizedContacts);
        setSelectedId((prev) => prev || normalizedContacts[0]?.id || "");
      } catch (error) {
        console.error("Failed to load CRM contacts", error);
        setContacts([]);
      } finally {
        setIsContactsLoading(false);
      }
    };

    loadContacts();
  }, []);

  const filteredContacts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return contacts.filter((contact) => {
      const localTags = tagsByContact[contact.id] || [];
      const matchesFilter = activeFilter === "all" || contact.status === activeFilter;
      const matchesSearch =
        !query ||
        contact.name.toLowerCase().includes(query) ||
        contact.mobile.toLowerCase().includes(query) ||
        contact.company.toLowerCase().includes(query) ||
        localTags.some((tag) => tag.toLowerCase().includes(query));

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, contacts, searchTerm, tagsByContact]);

  const activeContact = useMemo(() => {
    const fromFiltered = filteredContacts.find((contact) => contact.id === selectedId);
    if (fromFiltered) return fromFiltered;
    return filteredContacts[0] || null;
  }, [filteredContacts, selectedId]);

  useEffect(() => {
    const loadChatHistory = async () => {
      if (!activeContact?.mobile) {
        setChatHistory([]);
        return;
      }

      setIsChatLoading(true);
      try {
        const response = await fetchMessagesByNumber(activeContact.mobile);
        const messages = response?.data?.messages || [];
        const mappedMessages = messages.map((item, index) => {
          const fromMe = typeof item?.fromMe === "boolean" ? item.fromMe : item?.fromMe === "true" || item?.from === "me";
          const timestamp = toMillis(item?.timestamp || item?.time || item?.createdAt);

          return {
            id: `${activeContact.id}-${index}`,
            sender: fromMe ? "agent" : "contact",
            text: item?.message || item?.text || "",
            time: new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
        });

        setChatHistory(mappedMessages.slice(-25));
      } catch (error) {
        console.error("Failed to load CRM chat history", error);
        setChatHistory([]);
      } finally {
        setIsChatLoading(false);
      }
    };

    loadChatHistory();
  }, [activeContact?.id, activeContact?.mobile]);

  const activeContactTags = activeContact ? tagsByContact[activeContact.id] || [] : [];

  const addTag = (event) => {
    event.preventDefault();
    const tagValue = newTag.trim();

    if (!tagValue || !activeContact) return;

    setTagsByContact((prev) => {
      const currentTags = prev[activeContact.id] || [];
      if (currentTags.some((tag) => tag.toLowerCase() === tagValue.toLowerCase())) {
        return prev;
      }

      return {
        ...prev,
        [activeContact.id]: [...currentTags, tagValue],
      };
    });

    setNewTag("");
  };

  const removeTag = (tag) => {
    if (!activeContact) return;

    setTagsByContact((prev) => ({
      ...prev,
      [activeContact.id]: (prev[activeContact.id] || []).filter((currentTag) => currentTag !== tag),
    }));
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
        {isContactsLoading && <p className="text-xs text-slate-500">Loading contacts…</p>}
        {!isContactsLoading && filteredContacts.length === 0 && <p className="text-xs text-slate-500">No contacts match this search.</p>}
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
            <p className="mt-1 text-[11px] text-slate-500">+{contact.mobile || "No number"}</p>
          </button>
        ))}
      </div>

      {activeContact ? (
        <div className="space-y-3 border-t border-slate-200 pt-3">
          <div className="flex items-center gap-2">
            <HiOutlineUserCircle className="text-xl text-slate-400" />
            <div>
              <p className="text-sm font-semibold text-slate-900">{activeContact.name}</p>
              <p className="text-xs text-slate-500">Last active {formatRelativeTime(activeContact.lastSeenAt)}</p>
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold text-slate-700">Tags</p>
            <div className="mb-2 flex flex-wrap gap-1">
              {activeContactTags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-700">
                  <HiOutlineTag />
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="text-slate-400 hover:text-rose-500">
                    ×
                  </button>
                </span>
              ))}
              {activeContactTags.length === 0 && <p className="text-[11px] text-slate-400">No tags yet.</p>}
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
              {isChatLoading && <p className="text-xs text-slate-500">Loading chat…</p>}
              {!isChatLoading && chatHistory.length === 0 && <p className="text-xs text-slate-500">No chat history found.</p>}
              {chatHistory.map((item) => (
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
