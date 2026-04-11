import * as XLSX from 'xlsx';

const normalizeKey = (value) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ');

const normalizeCell = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const digitsOnly = (value) => String(value || '').replace(/\D/g, '');

const isMeaningfulValue = (value) => normalizeCell(value) !== '';

const buildOrderedRow = (row = {}, headers = []) =>
  Object.fromEntries(headers.map((header) => [header, normalizeCell(row?.[header])]));

const getAllHeadersInOrder = (rows = []) => {
  const orderedHeaders = [];

  for (const rawRow of Array.isArray(rows) ? rows : []) {
    for (const key of Object.keys(rawRow || {})) {
      const normalizedKey = normalizeKey(key);
      if (normalizedKey && !orderedHeaders.includes(normalizedKey)) {
        orderedHeaders.push(normalizedKey);
      }
    }
  }

  return orderedHeaders;
};

const removeCompletelyEmptyRows = (rows = []) =>
  (Array.isArray(rows) ? rows : []).filter((row) =>
    Object.values(row || {}).some((value) => isMeaningfulValue(value))
  );

const getNonEmptyHeaders = (rows = [], headers = []) =>
  headers.filter((header) =>
    rows.some((row) => isMeaningfulValue(row?.[header]))
  );

export const parseTabularFile = async (file) => {
  const extension = String(file?.name || '').split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    const text = await file.text();
    const workbook = XLSX.read(text, { type: 'string' });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    return XLSX.utils.sheet_to_json(sheet, { defval: '' });
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  const firstNonEmptySheetName =
    workbook.SheetNames.find((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      return Array.isArray(rows) && rows.length > 0;
    }) || workbook.SheetNames[0];

  const sheet = workbook.Sheets[firstNonEmptySheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
};

export const parseContactsFromRows = (rows = []) =>
  (Array.isArray(rows) ? rows : [])
    .map((row) => {
      const normalized = Object.fromEntries(
        Object.entries(row || {}).map(([key, value]) => [
          normalizeKey(key).toLowerCase(),
          value,
        ])
      );

      const phone = digitsOnly(
        normalized.phone ||
          normalized.mobile ||
          normalized.number ||
          normalized.whatsapp ||
          normalized.contact
      );

      return {
        name: String(
          normalized.name || normalized.customer || normalized.contactname || ''
        ).trim(),
        phone,
        tags: String(normalized.tags || '').trim(),
        assignedAgent: String(
          normalized.assignedagent || normalized.agent || ''
        ).trim(),
      };
    })
    .filter((item) => item.phone);

export const parsePriceCatalogRows = (
  rows = [],
  options = {}
) => {
  const {
    resultColumnCount = 2,
    explicitResultFields = [],
  } = options || {};

  const normalizedRawRows = (Array.isArray(rows) ? rows : []).map((raw) =>
    Object.fromEntries(
      Object.entries(raw || {}).map(([key, value]) => [
        normalizeKey(key),
        normalizeCell(value),
      ])
    )
  );

  const meaningfulRows = removeCompletelyEmptyRows(normalizedRawRows);
  const allHeaders = getAllHeadersInOrder(meaningfulRows);
  const activeHeaders = getNonEmptyHeaders(meaningfulRows, allHeaders);

  const cleanedRows = meaningfulRows.map((row) => buildOrderedRow(row, activeHeaders));

  const validRows = cleanedRows.filter((row) =>
    activeHeaders.some((header) => isMeaningfulValue(row?.[header]))
  );

  let resultFields = [];
  let selectionFields = [];

  if (Array.isArray(explicitResultFields) && explicitResultFields.length > 0) {
    resultFields = explicitResultFields
      .map((field) => normalizeKey(field))
      .filter((field) => activeHeaders.includes(field));

    selectionFields = activeHeaders.filter(
      (header) => !resultFields.includes(header)
    );
  } else {
    const safeResultCount =
      activeHeaders.length <= 1
        ? 1
        : Math.min(
            Math.max(Number(resultColumnCount) || 2, 1),
            activeHeaders.length - 1
          );

    selectionFields = activeHeaders.slice(0, activeHeaders.length - safeResultCount);
    resultFields = activeHeaders.slice(activeHeaders.length - safeResultCount);
  }

  const skippedEmptyFields = allHeaders.filter(
    (header) => !activeHeaders.includes(header)
  );

  return {
    headers: activeHeaders,
    selectionFields,
    resultFields,
    skippedEmptyFields,
    rows: validRows,
  };
};